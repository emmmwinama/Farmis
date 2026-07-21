import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";
import { assertSubscriptionCanWrite } from "@/lib/subscription";

type PermissionKey =
  | "fields"
  | "crops"
  | "activities"
  | "finance"
  | "employees"
  | "yields"
  | "reports"
  | "team"
  | "documents"
  | "equipment"
  | "livestock";

const ROLE_PERMISSIONS: Record<string, Record<PermissionKey, boolean>> = {
  owner: {
    fields: true, crops: true, activities: true, finance: true, employees: true,
    yields: true, reports: true, team: true, documents: true, equipment: true, livestock: true,
  },
  manager: {
    fields: true, crops: true, activities: true, finance: false, employees: true,
    yields: true, reports: true, team: false, documents: true, equipment: true, livestock: true,
  },
  agronomist: {
    fields: true, crops: true, activities: true, finance: false, employees: false,
    yields: true, reports: true, team: false, documents: true, equipment: false, livestock: true,
  },
  accountant: {
    fields: false, crops: false, activities: false, finance: true, employees: true,
    yields: false, reports: true, team: false, documents: true, equipment: false, livestock: false,
  },
  field_worker: {
    fields: false, crops: false, activities: true, finance: false, employees: false,
    yields: true, reports: false, team: false, documents: false, equipment: false, livestock: true,
  },
  viewer: {
    fields: true, crops: true, activities: false, finance: false, employees: false,
    yields: true, reports: true, team: false, documents: true, equipment: false, livestock: true,
  },
};

export async function requireFarmPermission(permission: PermissionKey, mode: "read" | "write" = "read") {
  const { user, farm } = await getSessionFarm();
  if (!user || !farm) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (mode === "write") {
    try {
      await assertSubscriptionCanWrite(user.id);
    } catch (err) {
      return {
        error: NextResponse.json(
          { error: err instanceof Error ? err.message : "Subscription upgrade required" },
          { status: 403 },
        ),
      };
    }
  }

  if (farm.userId === user.id) return { user, farm, role: "owner" };

  const member = await prisma.teamMember.findFirst({
    where: { farmId: farm.id, userId: user.id, status: "active" },
  });

  if (!member) {
    return { error: NextResponse.json({ error: "Access denied" }, { status: 403 }) };
  }

  const custom = member.permissions as Record<string, boolean> | null;
  const allowed = custom?.[permission] ?? ROLE_PERMISSIONS[member.role]?.[permission] ?? false;

  if (!allowed) {
    return {
      error: NextResponse.json(
        { error: "Your role does not allow this action" },
        { status: 403 },
      ),
    };
  }

  return { user, farm, role: member.role };
}
