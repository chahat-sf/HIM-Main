import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { getDb } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
	FIELD_LIMITS,
	isEmail,
	parseJsonBody,
	tooManyRequests,
} from "@/lib/validation";

const PLATFORMS = new Set([
	"instagram",
	"youtube",
	"tiktok",
	"x",
	"blog",
	"other",
]);

const AUDIENCE_SIZES = new Set([
	"under_10k",
	"10k_50k",
	"50k_100k",
	"100k_500k",
	"500k_plus",
]);

const CONTENT_CATEGORIES = new Set([
	"fashion",
	"menswear",
	"lifestyle",
	"photography",
	"film",
	"music",
	"other",
]);

type CreatorBody = {
	fullName?: string;
	email?: string;
	city?: string;
	country?: string;
	mobile?: string;
	primaryPlatform?: string;
	socialUrl?: string;
	audienceSize?: string;
	contentCategory?: string;
	portfolioUrl?: string;
	about?: string;
	privacyAccepted?: boolean;
};

function isHttpUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

export async function POST(request: Request) {
	try {
		const ip = clientIp(request);
		if (!rateLimit(`creators:${ip}`, { limit: 5, windowMs: 60_000 })) {
			return tooManyRequests(
				"Too many applications. Please try again shortly.",
			);
		}

		const parsed = await parseJsonBody<CreatorBody>(request);
		if (!parsed.ok) return parsed.response;

		const body = parsed.data;
		const fullName = body.fullName?.trim() ?? "";
		const email = body.email?.trim().toLowerCase() ?? "";
		const city = body.city?.trim() ?? "";
		const country = body.country?.trim() ?? "";
		const mobile = body.mobile?.trim() ?? "";
		const primaryPlatform = body.primaryPlatform?.trim().toLowerCase() ?? "";
		const socialUrl = body.socialUrl?.trim() ?? "";
		const audienceSize = body.audienceSize?.trim().toLowerCase() ?? "";
		const contentCategory = body.contentCategory?.trim().toLowerCase() ?? "";
		const portfolioUrl = body.portfolioUrl?.trim() ?? "";
		const about = body.about?.trim() ?? "";
		const privacyAccepted = Boolean(body.privacyAccepted);

		if (!fullName) {
			return NextResponse.json(
				{ error: "Please enter your full name." },
				{ status: 400 },
			);
		}
		if (fullName.length > FIELD_LIMITS.fullName) {
			return NextResponse.json({ error: "Name is too long." }, { status: 400 });
		}
		if (!email) {
			return NextResponse.json(
				{ error: "Please enter your email address." },
				{ status: 400 },
			);
		}
		if (!isEmail(email) || email.length > FIELD_LIMITS.email) {
			return NextResponse.json(
				{ error: "Please enter a valid email address." },
				{ status: 400 },
			);
		}
		if (!city) {
			return NextResponse.json(
				{ error: "Please enter your city." },
				{ status: 400 },
			);
		}
		if (city.length > 120) {
			return NextResponse.json({ error: "City is too long." }, { status: 400 });
		}
		if (!country) {
			return NextResponse.json(
				{ error: "Please enter your country." },
				{ status: 400 },
			);
		}
		if (country.length > 120) {
			return NextResponse.json(
				{ error: "Country is too long." },
				{ status: 400 },
			);
		}
		if (mobile && mobile.length > FIELD_LIMITS.phone) {
			return NextResponse.json(
				{ error: "Mobile number is too long." },
				{ status: 400 },
			);
		}
		if (!primaryPlatform || !PLATFORMS.has(primaryPlatform)) {
			return NextResponse.json(
				{ error: "Please select a primary platform." },
				{ status: 400 },
			);
		}
		if (!socialUrl || !isHttpUrl(socialUrl) || socialUrl.length > 500) {
			return NextResponse.json(
				{ error: "Please enter a valid social profile URL." },
				{ status: 400 },
			);
		}
		if (!audienceSize || !AUDIENCE_SIZES.has(audienceSize)) {
			return NextResponse.json(
				{ error: "Please select your audience size." },
				{ status: 400 },
			);
		}
		if (!contentCategory || !CONTENT_CATEGORIES.has(contentCategory)) {
			return NextResponse.json(
				{ error: "Please select a content category." },
				{ status: 400 },
			);
		}
		if (portfolioUrl) {
			if (!isHttpUrl(portfolioUrl) || portfolioUrl.length > 500) {
				return NextResponse.json(
					{ error: "Please enter a valid portfolio link." },
					{ status: 400 },
				);
			}
		}
		if (!about) {
			return NextResponse.json(
				{ error: "Please tell us why you want to work with HIM." },
				{ status: 400 },
			);
		}
		if (about.length > 500) {
			return NextResponse.json(
				{ error: "Your message must be 500 characters or fewer." },
				{ status: 400 },
			);
		}
		if (!privacyAccepted) {
			return NextResponse.json(
				{ error: "Please accept the privacy policy to continue." },
				{ status: 400 },
			);
		}

		const db = getDb();
		await db.execute<ResultSetHeader>(
			`INSERT INTO creator_program_applications
        (full_name, email, city, country, mobile, primary_platform, social_url,
         audience_size, content_category, portfolio_url, about)
       VALUES
        (:fullName, :email, :city, :country, :mobile, :primaryPlatform, :socialUrl,
         :audienceSize, :contentCategory, :portfolioUrl, :about)`,
			{
				fullName,
				email,
				city,
				country,
				mobile: mobile || null,
				primaryPlatform,
				socialUrl,
				audienceSize,
				contentCategory,
				portfolioUrl: portfolioUrl || null,
				about,
			},
		);

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("creator application error", error);
		return NextResponse.json(
			{ error: "Unable to submit your application. Please try again." },
			{ status: 500 },
		);
	}
}
