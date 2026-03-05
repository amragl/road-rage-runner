import { NextRequest } from 'next/server';
import { getTopScores, submitScore } from '@/lib/kv';

// Simple in-memory rate limit
const rateLimit = new Map<string, number>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const lastSubmission = rateLimit.get(ip) || 0;
  if (now - lastSubmission < 5000) return true;
  rateLimit.set(ip, now);
  return false;
}

export async function GET() {
  try {
    const scores = await getTopScores();
    return Response.json({ scores });
  } catch {
    return Response.json({ scores: [], fallback: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(ip)) {
      return Response.json(
        { error: 'Rate limited. Try again in 5 seconds.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, score } = body;

    // Validate name
    if (!name || typeof name !== 'string') {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    const cleanName = name.trim().slice(0, 12).replace(/[^a-zA-Z0-9 ]/g, '');
    if (cleanName.length === 0) {
      return Response.json({ error: 'Invalid name' }, { status: 400 });
    }

    // Validate score
    if (typeof score !== 'number' || score < 0 || score > 999999 || !Number.isInteger(score)) {
      return Response.json({ error: 'Invalid score' }, { status: 400 });
    }

    const result = await submitScore(cleanName, score);
    return Response.json(result);
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
