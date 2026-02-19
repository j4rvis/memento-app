export function formatDate(dateString: string): string {
  const d = new Date(dateString);
  const locale = typeof navigator !== "undefined" ? navigator.language : "de-DE";
  return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
}
