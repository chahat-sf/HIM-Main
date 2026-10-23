import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAccountPayload } from "@/lib/account";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await getAccountPayload(user);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("account GET error", error);
    return NextResponse.json(
      { error: "Unable to load account." },
      { status: 500 },
    );
  }
}
