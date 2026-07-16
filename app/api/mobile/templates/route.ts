import { NextRequest, NextResponse } from "next/server";
import { getMobileSession } from "@/lib/mobileAuth";
import { SEASONAL_TEMPLATES } from "@/lib/seasonTemplates";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ templates: SEASONAL_TEMPLATES });
}
