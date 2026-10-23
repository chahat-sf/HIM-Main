import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAccountPayload, updateProfile } from "@/lib/account";

type ProfileBody = {
  fullName?: string;
  phone?: string | null;
  dateOfBirth?: string | null;
};

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ProfileBody;
    const fullName = body.fullName?.trim();
    if (fullName !== undefined && !fullName) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 },
      );
    }

    if (body.dateOfBirth) {
      const ok = /^\d{4}-\d{2}-\d{2}$/.test(body.dateOfBirth);
      if (!ok) {
        return NextResponse.json(
          { error: "Date of birth must be YYYY-MM-DD." },
          { status: 400 },
        );
      }
    }

    await updateProfile(user.id, {
      fullName,
      phone: body.phone,
      dateOfBirth: body.dateOfBirth,
    });

    const refreshed = await getSessionUser();
    if (!refreshed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(await getAccountPayload(refreshed));
  } catch (error) {
    console.error("profile PATCH error", error);
    return NextResponse.json(
      { error: "Unable to update profile." },
      { status: 500 },
    );
  }
}
