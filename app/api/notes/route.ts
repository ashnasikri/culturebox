import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const item_id = searchParams.get("item_id");

  if (!item_id) {
    return NextResponse.json({ error: "item_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("item_id", item_id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notes: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const body = await request.json();
  const { item_id, text } = body;

  if (!item_id || !text?.trim()) {
    return NextResponse.json({ error: "item_id and text required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("notes")
    .insert({ item_id, text: text.trim() })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ note: data });
}
