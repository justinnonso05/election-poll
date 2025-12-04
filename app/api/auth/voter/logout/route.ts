import { cookies } from 'next/headers';
import { success } from '@/lib/apiREsponse';

export async function POST() {
  try {
    (await cookies()).delete('voter-session');
    return success('Logged out successfully', null);
  } catch (error) {
    console.error('Voter logout error:', error);
    return success('Logged out successfully', null); // Always succeed for logout
  }
}
