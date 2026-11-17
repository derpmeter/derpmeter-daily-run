import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createLogger } from '@/lib/logger';

const proxyLogger = createLogger('Proxy');

const BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://localhost:8000';

async function proxyRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathString = path.join('/');

  // Strip any trailing slashes and common API prefixes from the backend URL to get a clean base origin
  const backendBase = BACKEND_URL.replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
  
  // Since this route handler is at 'app/api/[...path]', the pathString contains everything AFTER '/api/'
  // e.g. /api/v1/users/me -> pathString is 'v1/users/me'
  // We re-construct the target URL by ensuring we have EXACTLY ONE '/api/' between base and pathString.
  const targetUrl = `${backendBase}/api/${pathString}${request.nextUrl.search}`;

  // Generate request ID for tracing
  const requestId = request.headers.get('X-Request-ID') || `proxy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  proxyLogger.info('Forwarding request', {
    method: request.method,
    path: request.nextUrl.pathname,
    target: targetUrl,
    requestId,
  });

  try {
    const requestHeaders = new Headers(request.headers);
    
    // Add request ID to forwarded headers
    requestHeaders.set('X-Request-ID', requestId);
    
    // CRITICAL: Strip the Host header as it will conflict with the target backend (Cloud Run)
    requestHeaders.delete('host');
    
    const authHeader = requestHeaders.get('Authorization');

    // Check if Auth header is missing or invalid (null, undefined, empty)
    const isAuthMissingOrInvalid =
      !authHeader ||
      authHeader === 'Bearer undefined' ||
      authHeader === 'Bearer null' ||
      authHeader.trim() === 'Bearer';

    if (isAuthMissingOrInvalid) {
      const cookieStore = await cookies();
      const token = cookieStore.get('access_token')?.value;
      if (token) {
        requestHeaders.set('Authorization', `Bearer ${token}`);
      }
    }

    const res = await fetch(targetUrl, {
      method: request.method,
      headers: requestHeaders,
      // Forward body for non-GET/HEAD requests
      body: (request.method !== 'GET' && request.method !== 'HEAD') ? request.body : undefined,
      // @ts-ignore
      duplex: 'half',
      cache: 'no-store',
      redirect: 'manual',
    });

    // Create a new Headers object to pass to the response
    const responseHeaders = new Headers(res.headers);

    // Handle Redirects safely
    if (res.status >= 300 && res.status < 400 && responseHeaders.has('location')) {
      const location = responseHeaders.get('location');
      if (location) {
        const backendOrigin = new URL(BACKEND_URL).origin;
        if (location.startsWith(backendOrigin)) {
          // Replace backend URL with relative path to keep client on the proxy
          const newLocation = location.replace(backendOrigin, '');
          responseHeaders.set('location', newLocation);
        }
      }
    }

    // Special case for 204 No Content
    if (res.status === 204) {
      return new NextResponse(null, { status: 204, headers: responseHeaders });
    }

    // Forward the response body and original headers
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      return NextResponse.json(data, { 
        status: res.status, 
        headers: responseHeaders 
      });
    } else {
      const body = await res.blob();
      return new NextResponse(body, { 
        status: res.status, 
        headers: responseHeaders 
      });
    }
  } catch (error) {
    proxyLogger.error('Error forwarding request', error, { targetUrl });
    return NextResponse.json({ error: 'Failed to proxy request' }, { status: 500 });
  }
}

export { proxyRequest as GET, proxyRequest as POST, proxyRequest as PUT, proxyRequest as DELETE, proxyRequest as PATCH };
