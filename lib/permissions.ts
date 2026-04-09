export const ROLES = {
    owner:      { label: "Owner",      color: "purple" },
    manager:    { label: "Manager",    color: "blue" },
    agronomist: { label: "Agronomist", color: "green" },
    accountant: { label: "Accountant", color: "amber" },
    viewer:     { label: "Viewer",     color: "gray" },
} as const;

export type Role = keyof typeof ROLES;

export const PERMISSIONS = [
    { key: "fields",     label: "Fields & maps" },
    { key: "crops",      label: "Crops & seasons" },
    { key: "activities", label: "Farm activities" },
    { key: "finance",    label: "Finance & payments" },
    { key: "employees",  label: "Employee management" },
    { key: "yields",     label: "Yield recording" },
    { key: "reports",    label: "Reports & analytics" },
    { key: "team",       label: "Team management" },
] as const;

export type Permission = typeof PERMISSIONS[number]["key"];

export const ROLE_DEFAULTS: Record<Role, Record<Permission, boolean>> = {
    owner:      { fields: true,  crops: true,  activities: true,  finance: true,  employees: true,  yields: true,  reports: true,  team: true  },
    manager:    { fields: true,  crops: true,  activities: true,  finance: true,  employees: true,  yields: true,  reports: true,  team: false },
    agronomist: { fields: true,  crops: true,  activities: true,  finance: false, employees: false, yields: true,  reports: true,  team: false },
    accountant: { fields: false, crops: false, activities: false, finance: true,  employees: true,  yields: false, reports: true,  team: false },
    viewer:     { fields: true,  crops: true,  activities: true,  finance: false, employees: false, yields: true,  reports: true,  team: false },
};

export function getDefaultPermissions(role: Role): Record<Permission, boolean> {
    return { ...ROLE_DEFAULTS[role] };
}

export async function getUserPermissions(userId: string, farmId: string) {
    const { prisma } = await import("@/lib/prisma");

    // Farm owner always has full access
    const farm = await prisma.farm.findUnique({ where: { id: farmId } });
    if (farm?.userId === userId) {
        return ROLE_DEFAULTS.owner;
    }

    // Check team membership
    const member = await prisma.teamMember.findFirst({
        where: { userId, farmId, status: "active" },
    });

    if (!member) return null;

    return member.permissions as Record<Permission, boolean>;
}

export async function canAccess(
    userId: string,
    farmId: string,
    permission: Permission
): Promise<boolean> {
    const perms = await getUserPermissions(userId, farmId);
    if (!perms) return false;
    return perms[permission] === true;
}