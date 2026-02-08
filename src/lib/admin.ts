export function isSuperAdmin(email: string | undefined): boolean {
  if (!email || !process.env.SUPER_ADMIN_EMAIL) return false;
  return email === process.env.SUPER_ADMIN_EMAIL;
}
