import { NextResponse } from "next/server";
import { getSessionFarm } from "@/lib/apiHelpers";
import { SEASONAL_TEMPLATES } from "@/lib/seasonTemplates";

export async function GET() {
  const { farm } = await getSessionFarm();
  if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ templates: SEASONAL_TEMPLATES });
}
