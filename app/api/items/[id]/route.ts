import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("items")
    .update(body)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);

  if (searchParams.get("cascade_quotes") === "true") {
    const { error: qErr } = await supabase
      .from("quotes")
      .delete()
      .eq("source_item_id", params.id);
    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
  }

  const { error } = await supabase.from("items").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
