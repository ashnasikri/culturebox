import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const sourceItemId = searchParams.get("source_item_id");
  const sourceTitle = searchParams.get("source_title");

  let query = supabase.from("quotes").select("*").order("created_at", { ascending: false });

  // When filtering for a specific item, match by ID or by title (for quotes linked by name)
  if (sourceItemId && sourceTitle) {
    query = query.or(
      `source_item_id.eq.${sourceItemId},and(source_item_id.is.null,source_title.ilike.${sourceTitle})`
    );
  }

  const { data, error } = await query;

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
