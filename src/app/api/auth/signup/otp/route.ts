import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendSignupOtpEmail } from "@/lib/email/send";
import {
	deleteSignupVerification,
	emailAlreadyRegistered,
	parseSignupFields,
	saveSignupVerification,
} from "@/lib/signup-verification";
import { parseJsonBody, tooManyRequests } from "@/lib/validation";

type SignupOtpBody = {
	fullName?: string;
	email?: string;
	phone?: string;
	password?: string;
};

export async function POST(request: Request) {
	try {
		const ip = clientIp(request);
		if (!rateLimit(`signup-otp:${ip}`, { limit: 5, windowMs: 60_000 })) {
			return tooManyRequests();
		}

		const parsed = await parseJsonBody<SignupOtpBody>(request);
		if (!parsed.ok) return parsed.response;

		const fields = parseSignupFields(parsed.data);
		if (!fields.ok) {
			return NextResponse.json(
				{ error: fields.error.error },
				{ status: fields.error.status },
			);
		}

		const { email } = fields.data;
		if (!rateLimit(`signup-otp:email:${email}`, { limit: 3, windowMs: 600_000 })) {
			return tooManyRequests("Please wait before requesting another code.");
		}

		if (await emailAlreadyRegistered(email)) {
			return NextResponse.json(
				{ error: "An account with this email already exists." },
				{ status: 409 },
			);
		}

		const code = await saveSignupVerification(fields.data);
		const sent = await sendSignupOtpEmail(email, code);
		if (!sent) {
			await deleteSignupVerification(email);
			return NextResponse.json(
				{ error: "We couldn't send the verification email. Please try again." },
				{ status: 500 },
			);
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("signup otp error", error);
		return NextResponse.json(
			{ error: "We couldn't send the verification email. Please try again." },
			{ status: 500 },
		);
	}
}
