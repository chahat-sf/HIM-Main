import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  addSavedItem,
  getAccountPayload,
  removeSavedItem,
} from "@/lib/account";

type SavedBody = {
  slug?: string;
  name?: string;
  priceCents?: number;
  imageUrl?: string;
  swatches?: string[];
};

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as SavedBody;
    const slug = body.slug?.trim() ?? "";
    const name = body.name?.trim() ?? "";
    const imageUrl = body.imageUrl?.trim() ?? "";
    const priceCents = Number(body.priceCents ?? 0);

    if (!slug || !name || !imageUrl) {
      return NextResponse.json(
        { error: "slug, name, and imageUrl are required." },
        { status: 400 },
      );
    }

    await addSavedItem(user.id, {
      slug,
      name,
      priceCents,
      imageUrl,
      swatches: body.swatches,
    });

    return NextResponse.json(await getAccountPayload(user));
  } catch (error) {
    console.error("saved POST error", error);
    return NextResponse.json(
      { error: "Unable to save item." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.trim() ?? "";
    if (!slug) {
      return NextResponse.json({ error: "slug is required." }, { status: 400 });
    }

    await removeSavedItem(user.id, slug);
    return NextResponse.json(await getAccountPayload(user));
  } catch (error) {
    console.error("saved DELETE error", error);
    return NextResponse.json(
      { error: "Unable to remove saved item." },
      { status: 500 },
    );
  }
}
