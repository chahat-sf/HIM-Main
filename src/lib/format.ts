export function firstNameFromFullName(fullName: string): string {
	const part = fullName.trim().split(/\s+/)[0] ?? fullName;
	return part.endsWith(".") ? part : `${part}.`;
}

/** Format rupee amount from integer cents (e.g. 4200000 → "₹42,000.00"). */
export function formatInrFromCents(cents: number): string {
	const rupees = (Number(cents) || 0) / 100;
	return `₹${rupees.toLocaleString("en-IN", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
}

/** Format whole rupees (e.g. 42000 → "₹ 42,000"). */
export function formatInrRupees(rupees: number): string {
	return `₹ ${Math.round(Number(rupees) || 0).toLocaleString("en-IN")}`;
}

export function formatDisplayDate(
	iso: string | null | undefined,
): string | null {
	if (!iso) return null;
	const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
}
