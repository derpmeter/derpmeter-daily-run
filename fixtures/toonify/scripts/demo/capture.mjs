/** Capture real UI interactions against `npm run demo`, then encode GIFs with FFmpeg. */
import { mkdtemp, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://127.0.0.1:3100';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Capture only supports the local demo.');
const output = fileURLToPath(new URL('../../docs/media/', import.meta.url));
const scratch = await mkdtemp(join(tmpdir(), 'toonify-capture-'));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, colorScheme: 'dark', reducedMotion: 'reduce', acceptDownloads: true });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => {
  if (new URL(response.url()).pathname.startsWith('/api/v1/') && response.status() >= 400) errors.push(`${response.status()} ${new URL(response.url()).pathname}`);
});
const selected = process.env.CAPTURE_SCENARIOS?.split(',');
const wanted = name => !selected || selected.includes(name);
let scenario = '', frames = [];
async function open(path) {
  await page.goto(`${base}/en/${path}`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
}
async function shot(duration = 1.2) {
  await page.waitForTimeout(650);
  const path = join(scratch, `${scenario}-${frames.length}.png`);
  await page.screenshot({ path });
  frames.push({ path, duration });
  console.log(`${scenario}: frame ${frames.length}`);
}
function encode() {
  const concat = frames.map(frame => `file '${frame.path}'\nduration ${frame.duration}`).join('\n') + `\nfile '${frames.at(-1).path}'\n`;
  const list = join(scratch, `${scenario}.txt`);
  return writeFile(list, concat).then(() => {
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-filter_complex', 'fps=8,scale=1000:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=192:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3', '-loop', '0', join(output, `${scenario}.gif`)], { stdio: 'inherit' });
  });
}
async function begin(name) { scenario = name; frames = []; }

try {
  if (wanted('01-project-worldbuilding')) {
  await begin('01-project-worldbuilding');
  await open('dashboard');
  await page.getByText('Neon Harbor', { exact: true }).waitFor();
  await shot();
  await copyFile(frames.at(-1).path, join(output, 'dashboard.png'));
  await page.getByRole('link', { name: 'New Project', exact: true }).first().click();
  await page.getByPlaceholder('e.g. Workromancer').fill('Neon Harbor: Afterlight');
  await shot();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByPlaceholder('e.g. The Ghost of Pangyo').fill('A city built on forgotten memories');
  await shot();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByText('Fantasy', { exact: true }).click();
  await page.getByText('Mystery', { exact: true }).click();
  await shot();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.locator('textarea').fill('In a neon-lit harbor, memories are traded as currency. A courier discovers a message from the city before it vanished.');
  await shot();
  await page.getByRole('button', { name: 'AI Augment', exact: true }).click();
  await page.getByText('AI Suggestions', { exact: true }).waitFor();
  await shot(2);
  await page.getByRole('button', { name: /select|use|apply/i }).last().click();
  await page.getByRole('dialog').waitFor({ timeout: 30000 });
  await shot();
  await page.getByText('Neon Cyberpunk', { exact: true }).first().click();
  await shot();
  await page.getByRole('button', { name: /apply style/i }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await shot(2);
  await encode();
  }

  if (wanted('02-character-casting')) {
  await begin('02-character-casting');
  await open('project/neon-harbor/casting');
  await page.getByPlaceholder('Park Dohyun').fill('Mira');
  await page.getByPlaceholder('Age (e.g., 18)').fill('21');
  await shot();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  const keywords = page.getByPlaceholder('Add keywords (e.g., Uniform, Sword)...');
  for (const tag of ['Silver hair', 'Neon jacket', 'Memory pendant']) { await keywords.fill(tag); await keywords.press('Enter'); }
  await page.getByText('Mysterious', { exact: true }).click();
  await shot(2);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Create Character', exact: true }).waitFor();
  await shot(2);
  await page.getByRole('button', { name: 'Create Character', exact: true }).click();
  await page.getByText('Mira', { exact: true }).first().waitFor({ timeout: 30000 });
  await shot();
  await page.getByText('Mira', { exact: true }).first().click();
  await page.getByRole('dialog').waitFor();
  await shot(2.5);
  await encode();
  }

  if (wanted('03-storyboard-editing')) {
  await begin('03-storyboard-editing');
  await open('project/neon-harbor/editor?episode_id=first-delivery');
  await page.getByText('SCENE #01', { exact: true }).first().waitFor();
  await shot();
  await page.getByText('SCENE #01', { exact: true }).first().click();
  await page.getByPlaceholder('Describe the scene...').waitFor();
  await shot(2);
  await page.getByPlaceholder('Describe the scene...').fill('Wide shot: Luna steps into the rain. Violet neon lights reflect across the harbor as the memory capsule begins to glow.');
  await page.getByPlaceholder('Describe the scene...').blur();
  await shot();
  await page.getByRole('button', { name: 'Regenerate Image', exact: true }).click();
  await shot();
  await page.waitForTimeout(2400);
  await shot();
  await page.getByRole('button', { name: 'Regenerate Mode', exact: true }).first().click();
  await shot();
  await page.getByRole('button', { name: 'Select All', exact: true }).first().click();
  await shot(2);
  await page.getByRole('button', { name: 'Regenerate Mode', exact: true }).first().click();
  await shot();
  await encode();
  }

  if (wanted('04-review-export')) {
  await begin('04-review-export');
  await open('project/neon-harbor/editor?episode_id=first-delivery');
  await page.getByText('SCENE #01', { exact: true }).first().waitFor();
  await shot();
  await page.getByRole('button', { name: 'Review', exact: true }).click();
  await shot(2);
  await page.mouse.move(760, 650);
  await page.mouse.wheel(0, 500);
  await shot(2);
  await page.locator('button').filter({has: page.locator('svg.lucide-x')}).filter({visible: true}).last().click();
  await shot();
  if (await page.getByRole('button', { name: 'Export', exact: true }).isVisible()) {
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export', exact: true }).click()]);
    await download.saveAs(join(scratch, 'episode.zip'));
    execFileSync('python3', ['-c', 'import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert len(z.namelist()) >= 3; assert z.testzip() is None; print("Validated demo ZIP:",z.namelist())', join(scratch, 'episode.zip')], { stdio: 'inherit' });
    await shot(2);
  } else throw new Error('Close the mobile review before exporting');
  await encode();
  }
  if (errors.length) throw new Error(`Browser errors: ${JSON.stringify(errors)}`);
  console.log(`Captured requested scenarios. Output: ${output}. Source frames and validated ZIP: ${scratch}`);
} catch (error) {
  await page.screenshot({ path: join(scratch, 'failure.png') });
  console.error('Capture stopped:', scenario, '\n', (await page.locator('body').innerText()).slice(0,6500), '\nFrames:', scratch);
  throw error;
} finally { await browser.close(); }
