export function firstNameFromFullName(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0] ?? fullName;
  return part.endsWith(".") ? part : `${part}.`;
}

export function formatDisplayDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
