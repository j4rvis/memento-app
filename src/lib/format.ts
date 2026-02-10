export function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return `${d.getUTCDate().toString().padStart(2, "0")}.${(d.getUTCMonth() + 1).toString().padStart(2, "0")}.${d.getUTCFullYear()}`;
}
