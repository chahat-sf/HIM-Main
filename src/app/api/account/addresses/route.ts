import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAccountPayload, upsertDefaultAddress } from "@/lib/account";

type AddressBody = {
  label?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as AddressBody;
    const line1 = body.line1?.trim() ?? "";
    const city = body.city?.trim() ?? "";
    const state = body.state?.trim() ?? "";
    const postalCode = body.postalCode?.trim() ?? "";

    if (!line1 || !city || !state || !postalCode) {
      return NextResponse.json(
        { error: "Please fill in address, city, state, and postal code." },
        { status: 400 },
      );
    }

    await upsertDefaultAddress(user.id, {
      label: body.label,
      line1,
      line2: body.line2,
      city,
      state,
      postalCode,
      country: body.country,
    });

    return NextResponse.json(await getAccountPayload(user));
  } catch (error) {
    console.error("addresses POST error", error);
    return NextResponse.json(
      { error: "Unable to save address." },
      { status: 500 },
    );
  }
}
