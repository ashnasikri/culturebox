import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const sourceItemId = searchParams.get("source_item_id");
  const sourceTitle = searchParams.get("source_title");

  if (sourceItemId && sourceTitle) {
    // Match by vault item ID
    const { data: byId } = await supabase
      .from("quotes")
      .select("*")
      .eq("source_item_id", sourceItemId)
      .order("created_at", { ascending: false });

    // Match by title for quotes added without linking to vault item
    const { data: byTitle } = await supabase
      .from("quotes")
      .select("*")
      .is("source_item_id", null)
      .ilike("source_title", sourceTitle)
      .order("created_at", { ascending: false });

    const quotes = [...(byId ?? []), ...(byTitle ?? [])];
    return NextResponse.json({ quotes });
  }

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ quotes: data });
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("quotes")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ quote: data });
}
