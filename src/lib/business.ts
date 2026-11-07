/**
 * Seller / supplier details for tax invoices (from GST REG-06).
 * Env vars override when set (e.g. production secrets / Vercel).
 */

export type BusinessProfile = {
	legalName: string;
	tradeName: string;
	gstin: string;
	/** Full single-line / multi-line address for display */
	addressLines: string[];
	state: string;
	/** First two digits of GSTIN */
	stateCode: string;
	pinCode: string;
	constitution: string;
	pan: string;
};

const DEFAULT: BusinessProfile = {
	legalName: "HIM.CLOTHING LLP",
	tradeName: "HIM.CLOTHING LLP",
	gstin: "06AATFH7402G1ZA",
	addressLines: [
		"FIRST FLOOR, F-17, ROYAL RESIDENCY",
		"Sushant Lok Phase 2, Gurugram",
		"Haryana 122003",
	],
	state: "Haryana",
	stateCode: "06",
	pinCode: "122003",
	constitution: "Limited Liability Partnership",
	/** PAN is embedded in GSTIN positions 3–12 */
	pan: "AATFH7402G",
};

/** Indian state / UT name → GST state code */
const STATE_CODES: Record<string, string> = {
	"andaman and nicobar islands": "35",
	"andhra pradesh": "37",
	"arunachal pradesh": "12",
	assam: "18",
	bihar: "10",
	chandigarh: "04",
	chhattisgarh: "22",
	"dadra and nagar haveli and daman and diu": "26",
	delhi: "07",
	"nct of delhi": "07",
	goa: "30",
	gujarat: "24",
	haryana: "06",
	"himachal pradesh": "02",
	"jammu and kashmir": "01",
	jharkhand: "20",
	karnataka: "29",
	kerala: "32",
	ladakh: "38",
	lakshadweep: "31",
	"madhya pradesh": "23",
	maharashtra: "27",
	manipur: "14",
	meghalaya: "17",
	mizoram: "15",
	nagaland: "13",
	odisha: "21",
	puducherry: "34",
	punjab: "03",
	rajasthan: "08",
	sikkim: "11",
	"tamil nadu": "33",
	telangana: "36",
	tripura: "16",
	"uttar pradesh": "09",
	uttarakhand: "05",
	"west bengal": "19",
};

/** Ignore unset or leftover placeholder env values from older templates. */
function envOrDefault(value: string | undefined, fallback: string): string {
	const trimmed = value?.trim() ?? "";
	if (!trimmed) return fallback;
	if (/^\[.+\]$/.test(trimmed)) return fallback;
	if (/^X+$/i.test(trimmed) || /placeholder/i.test(trimmed)) return fallback;
	return trimmed;
}

export function getBusinessProfile(): BusinessProfile {
	const addressEnv = envOrDefault(process.env.BUSINESS_ADDRESS, "");
	return {
		legalName: envOrDefault(process.env.BUSINESS_NAME, DEFAULT.legalName),
		tradeName: envOrDefault(
			process.env.BUSINESS_TRADE_NAME || process.env.BUSINESS_NAME,
			DEFAULT.tradeName,
		),
		gstin: envOrDefault(process.env.BUSINESS_GSTIN, DEFAULT.gstin),
		addressLines: addressEnv
			? addressEnv.split("|").map((s) => s.trim()).filter(Boolean)
			: DEFAULT.addressLines,
		state: envOrDefault(process.env.BUSINESS_STATE, DEFAULT.state),
		stateCode: envOrDefault(
			process.env.BUSINESS_STATE_CODE,
			DEFAULT.stateCode,
		),
		pinCode: envOrDefault(process.env.BUSINESS_PIN, DEFAULT.pinCode),
		constitution: envOrDefault(
			process.env.BUSINESS_CONSTITUTION,
			DEFAULT.constitution,
		),
		pan: envOrDefault(process.env.BUSINESS_PAN, DEFAULT.pan),
	};
}

/** One-line footer / email blurb: name · address · GSTIN. */
export function formatBusinessFooterLine(
	business: BusinessProfile = getBusinessProfile(),
): string {
	return `${business.legalName} · ${business.addressLines.join(", ")} · GSTIN: ${business.gstin}`;
}

export function resolveStateCode(stateName: string | null | undefined): string | null {
	if (!stateName) return null;
	const key = stateName.trim().toLowerCase();
	if (STATE_CODES[key]) return STATE_CODES[key];
	// fuzzy: "Haryana " / "HR"
	for (const [name, code] of Object.entries(STATE_CODES)) {
		if (key.includes(name) || name.includes(key)) return code;
	}
	return null;
}

export type GstBreakup =
	| {
			mode: "intra";
			cgstCents: number;
			sgstCents: number;
			igstCents: 0;
			placeOfSupply: string;
			placeOfSupplyCode: string;
	  }
	| {
			mode: "inter";
			cgstCents: 0;
			sgstCents: 0;
			igstCents: number;
			placeOfSupply: string;
			placeOfSupplyCode: string;
	  };

/**
 * Split inclusive GST tax into CGST+SGST (same state) or IGST (other state).
 * `taxCents` is the full 18% already extracted from the inclusive total.
 */
export function splitGstForPlaceOfSupply(
	taxCents: number,
	buyerState: string | null | undefined,
	seller: BusinessProfile = getBusinessProfile(),
): GstBreakup {
	const buyerCode = resolveStateCode(buyerState) || "";
	const placeName = (buyerState || "India").trim() || "India";
	const placeCode = buyerCode || "—";
	const half = Math.round(taxCents / 2);
	const other = taxCents - half;

	if (buyerCode && buyerCode === seller.stateCode) {
		return {
			mode: "intra",
			cgstCents: half,
			sgstCents: other,
			igstCents: 0,
			placeOfSupply: placeName,
			placeOfSupplyCode: placeCode,
		};
	}

	return {
		mode: "inter",
		cgstCents: 0,
		sgstCents: 0,
		igstCents: taxCents,
		placeOfSupply: placeName,
		placeOfSupplyCode: placeCode,
	};
}
