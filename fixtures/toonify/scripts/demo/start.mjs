/** Local-only UI sandbox. Application source and real credentials stay untouched. */
import { cp, mkdtemp, mkdir, readFile, writeFile, symlink, rm, readdir, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createDemoApi } from './fixtures.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const frontend = join(root, 'frontend');
try { await access(join(frontend, 'node_modules/next/dist/bin/next')); }
catch { throw new Error('Install frontend dependencies first: cd frontend && npm ci --legacy-peer-deps'); }
const sandbox = await mkdtemp(join(tmpdir(), 'toonify-ui-demo-'));
const app = join(sandbox, 'frontend');
const port = Number(process.env.DEMO_PORT || 3100);
if (!Number.isInteger(port) || port < 1024 || port > 65534) throw new Error('Invalid DEMO_PORT');
const ignored = new Set(['node_modules', '.next', '.git', '.env', '.env.local', '.env.production', '.env.production.local']);
await cp(frontend, app, { recursive: true, filter: path => !path.slice(frontend.length).split('/').some(part => ignored.has(part) || part.startsWith('.env.')) });
await symlink(join(frontend, 'node_modules'), join(app, 'node_modules'), 'dir');

// Stub Clerk only in this disposable copy; no authentication bypass ships in the app.
const stub = `'use client';
import type { ReactNode } from 'react';
export const ClerkProvider = ({children}: {children: ReactNode}) => children;
export const useUser = () => ({isLoaded: true, isSignedIn: false, user: null});
export const useAuth = () => ({isLoaded: true, userId: 'demo-user', isSignedIn: true});
export const UserButton = () => null;
export const SignIn = () => null;
export const SignUp = () => null;
`;
await mkdir(join(app, 'src/demo'), { recursive: true });
await writeFile(join(app, 'src/demo/clerk.tsx'), stub);
async function patchImports(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await patchImports(path);
    else if (/\.tsx?$/.test(entry.name)) {
      const original = await readFile(path, 'utf8');
      const changed = original.replace(/(['"])@clerk\/nextjs\1/g, "'@/demo/clerk'");
      if (changed !== original) await writeFile(path, changed);
    }
  }
}
await patchImports(join(app, 'src'));
await writeFile(join(app, 'src/providers/AuthProvider.tsx'), `'use client';
import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
export function AuthProvider({children}: {children: ReactNode}) {
  useEffect(() => { useAuthStore.setState({token: 'toonify-local-demo', user: {id: 'demo-user', email: 'creator@example.com', language: 'en'}, hasHydrated: true}); }, []);
  return children;
}
`);
await writeFile(join(app, 'src/middleware.ts'), `import createMiddleware from 'next-intl/middleware';
import { localePrefix, locales } from './navigation';
const intl = createMiddleware({locales, defaultLocale: 'en', localePrefix});
export default function middleware(request: Parameters<typeof intl>[0]) {
  const response = intl(request);
  response.cookies.set('access_token', 'toonify-local-demo', {httpOnly: true, sameSite: 'lax'});
  return response;
}
export const config = {matcher: ['/((?!api|assets|_next|.*\\\\..*).*)']};
`);
const navigation = join(app, 'src/navigation.ts');
await writeFile(navigation, (await readFile(navigation, 'utf8')).replace("localePrefix = 'never'", "localePrefix = 'always'"));
const layout = join(app, 'src/app/[locale]/layout.tsx');
let html = await readFile(layout, 'utf8');
html = html.replace(/import \{ GoogleAnalytics \} from '@next\/third-parties\/google';/, '')
  .replace(/<GoogleAnalytics[^>]*\/>/, '');
html = html.replace('<NextIntlClientProvider', '<div style={{position:"fixed",bottom:8,left:8,zIndex:9999,padding:"5px 10px",borderRadius:8,background:"#241539",color:"#d8b4fe",fontSize:11,pointerEvents:"none"}}>LOCAL DEMO · Mock data · No AI calls</div><NextIntlClientProvider');
await writeFile(layout, html);
// Do not transmit interaction events or analytics from the sandbox.
const analytics = join(app, 'src/demo/analytics.tsx');
await writeFile(analytics, 'export const sendGAEvent = (..._args: unknown[]) => {};\n');
async function patchAnalytics(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await patchAnalytics(path);
    else if (/\.tsx?$/.test(entry.name)) {
      const original = await readFile(path, 'utf8');
      const changed = original.replace(/(['"])@next\/third-parties\/google\1/g, "'@/demo/analytics'");
      if (changed !== original) await writeFile(path, changed);
    }
  }
}
await patchAnalytics(join(app, 'src'));
// Keep Next's dev indicator out of documentation recordings.
const configPath = join(app, 'next.config.ts');
await writeFile(configPath, (await readFile(configPath, 'utf8')).replace("output: 'standalone',", "devIndicators: false,"));

const api = createServer(createDemoApi(root));
await new Promise((resolve, reject) => { api.once('error', reject); api.listen(port + 1, '127.0.0.1', resolve); });
const child = spawn(process.execPath, [join(frontend, 'node_modules/next/dist/bin/next'), 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], {
  cwd: app, stdio: 'inherit', env: { ...process.env, INTERNAL_BACKEND_URL: `http://127.0.0.1:${port + 1}`, NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${port}`, NEXT_TELEMETRY_DISABLED: '1' },
});
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  child.kill('SIGTERM');
  api.close();
  await new Promise(resolve => child.exitCode !== null ? resolve() : child.once('exit', resolve));
  await rm(sandbox, { recursive: true, force: true });
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { stop().finally(() => process.exit(0)); });
child.on('exit', code => { if (!stopping) stop().finally(() => process.exit(code || 0)); });
console.log(`\nToonify local demo: http://127.0.0.1:${port}/en/dashboard\nMock data only. No DB, Clerk account, or AI key needed. Changes reset on restart.\n`);
