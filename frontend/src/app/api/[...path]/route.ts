import { NextRequest, NextResponse } from 'next/server';

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || 'http://localhost:5000';

async function forwardRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = '/' + path.join('/');
  const searchParams = req.nextUrl.search;
  const targetUrl = `${EXPRESS_API_URL}/api${targetPath}${searchParams}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  const contentType = req.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  let body: string | undefined = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      body = await req.text();
    } catch {
      // no body
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const expressResponse = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    const responseText = await expressResponse.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText };
    }

    return NextResponse.json(responseData, {
      status: expressResponse.status,
      headers: {
        'x-proxied-by': 'nextjs-app-router',
      },
    });
  } catch (error: unknown) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    const message = isTimeout
      ? `Express backend timed out after 8000ms at ${EXPRESS_API_URL}`
      : `Cannot reach Express API at ${EXPRESS_API_URL}. Is the backend service running?`;

    // Return structured honest status
    return NextResponse.json(
      {
        success: false,
        status: 'unavailable',
        message,
        details: {
          targetUrl,
          architecturePath: 'Browser -> Next.js (503) -X- Express API',
        },
      },
      { status: 503 }
    );
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(req, context);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(req, context);
}
