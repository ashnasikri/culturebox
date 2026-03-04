import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { ItemType } from "@/types";

interface ImportItem {
  type: ItemType;
  title: string;
  creator: string | null;
  year: number | null;
  cover_image_url: string | null;
  status: string;
  imdb_id: string | null;
  openlibrary_id: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { items }: { items: ImportItem[] } = await request.json();
    if (!items?.length) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const rows = items.map((item) => ({
      type: item.type,
      title: item.title,
      creator: item.creator ?? null,
      year: item.year ?? null,
      cover_image_url: item.cover_image_url ?? null,
      status: item.status,
      progress: null,
      finished_month: null,
      finished_year: null,
      imdb_id: item.imdb_id ?? null,
      openlibrary_id: item.openlibrary_id ?? null,
    }));

    const { error } = await supabase.from("items").insert(rows);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ count: rows.length });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Failed to import" }, { status: 500 });
  }
}
