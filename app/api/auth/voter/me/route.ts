import { cookies } from 'next/headers';
import { success, fail } from '@/lib/apiREsponse';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('voter-session')?.value;

    if (!sessionCookie) {
      return fail('Not authenticated', null, 401);
    }

    const sessionData = JSON.parse(sessionCookie);

    // Check if session has expired (15 minutes - but don't tell user)
    if (Date.now() - sessionData.loginTime > 900000) {
      cookieStore.delete('voter-session');
      return fail('Session expired. Please login again.', null, 401);
    }

    return success('Session valid', {
      id: sessionData.id,
      email: sessionData.email,
      firstName: sessionData.firstName,
      lastName: sessionData.lastName,
      studentId: sessionData.studentId,
      association: sessionData.association,
    });
  } catch (error) {
    console.error('Get voter session error:', error);
    const cookieStore = await cookies();
    cookieStore.delete('voter-session');
    return fail('Invalid session', null, 401);
  }
}
