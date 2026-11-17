import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { createLogger } from '@/lib/logger';

const assetLogger = createLogger('AssetProxy');

/**
 * GCS Asset Proxy with Service Account Authentication
 * 
 * This route proxies requests to Google Cloud Storage for serving images.
 * In production, it uses the Cloud Run service account for authentication.
 * In local development, it falls back to MinIO public URLs.
 * 
 * URL Pattern: /assets/schema/identifier/filename.png
 */

const GCS_BUCKET = process.env.MINIO_BUCKET || 'toonify-prod-assets';

// For local development with MinIO
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost:9000';
const MINIO_SECURE = process.env.MINIO_SECURE === 'True' || process.env.MINIO_SECURE === 'true';
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'minio';

// Initialize GCS client (uses ADC - Application Default Credentials)
let storageClient: Storage | null = null;

function getGCSClient(): Storage {
  if (!storageClient) {
    storageClient = new Storage();
  }
  return storageClient;
}

async function fetchFromGCS(objectPath: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const storage = getGCSClient();
    const bucket = storage.bucket(GCS_BUCKET);
    const file = bucket.file(objectPath);
    
    const [exists] = await file.exists();
    if (!exists) {
      assetLogger.warn('File not found in GCS', { objectPath });
      return null;
    }
    
    const [metadata] = await file.getMetadata();
    const [contents] = await file.download();
    
    return {
      buffer: contents,
      contentType: metadata.contentType || 'image/png',
    };
  } catch (error) {
    assetLogger.error('GCS error', error, { objectPath });
    return null;
  }
}

async function fetchFromMinIO(objectPath: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const protocol = MINIO_SECURE ? 'https' : 'http';
  const url = `${protocol}://${MINIO_ENDPOINT}/${GCS_BUCKET}/${objectPath}`;
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
    });
    
    if (!res.ok) {
      assetLogger.warn('MinIO fetch failed', { status: res.status, statusText: res.statusText });
      return null;
    }
    
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || 'image/png';
    
    return { buffer, contentType };
  } catch (error) {
    assetLogger.error('MinIO error', error, { url });
    return null;
  }
}

async function proxyAsset(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const objectPath = path.join('/');
  
  assetLogger.debug('Asset request', { path: request.nextUrl.pathname, storageType: STORAGE_TYPE });

  let result: { buffer: Buffer; contentType: string } | null = null;

  if (STORAGE_TYPE === 'gcs') {
    result = await fetchFromGCS(objectPath);
  } else {
    result = await fetchFromMinIO(objectPath);
  }

  if (!result) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export { proxyAsset as GET };
