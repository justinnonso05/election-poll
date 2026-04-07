import { NextRequest } from 'next/server';
import { success, fail } from '@/lib/apiREsponse';
import { askAboutManifestos } from '@/lib/ai/manifesto-ai';

// In-memory rate limiter: { ip -> { count, resetAt } }
// This resets when the server restarts. For persistence across restarts, use Redis/DB.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = 5; // max messages per IP per day
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now >= record.resetAt) {
    // First message or window expired - reset
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { allowed, remaining } = checkRateLimit(ip);

    if (!allowed) {
      return fail(
        'Daily question limit reached. You can ask up to 5 questions per day.',
        null,
        429
      );
    }

    const { electionId, question, candidateIds } = await req.json();

    if (!electionId || !question) {
      return fail('Election ID and question are required', null, 400);
    }

    if (typeof question !== 'string' || question.trim().length < 3) {
      return fail('Question must be at least 3 characters long', null, 400);
    }

    const result = await askAboutManifestos(electionId, question.trim(), candidateIds);

    const response = success('Question processed successfully', result);

    // Attach remaining info in headers so client can optionally surface it
    response.headers.set('X-RateLimit-Remaining', String(remaining));

    return response;
  } catch (_error) {
    console.error('Manifesto Q&A error:', _error);
    if (_error instanceof Error) {
      return fail(`Failed to process question: ${_error.message}`, null, 500);
    }
    return fail('Failed to process question', null, 500);
  }
}