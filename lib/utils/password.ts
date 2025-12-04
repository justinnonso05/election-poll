export function generateVoterPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 5; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
