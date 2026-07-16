export const TRIAL_DAYS = 7;

const booleanKeys = [
    "seasonAnalytics",
    "yieldSuggestions",
    "costPerHectare",
    "payrollTracking",
    "multipleFarms",
    "teamAccounts",
    "customReports",
    "apiAccess",
    "dataRetentionLifetime",
    "isActive",
    "isPublic",
    "isFeatured",
] as const;

function toBoolean(value: unknown, fallback = false) {
    if (value === undefined || value === null) return fallback;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") return ["true", "1", "yes", "on"].includes(value.toLowerCase());
    return fallback;
}

function toNumber(value: unknown, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function getTrialEndDate(from = new Date()) {
    return new Date(from.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export function normalizeTierInput(body: any) {
    const normalized: any = {
        name:            typeof body.name === "string" ? body.name.trim() : "",
        description:     typeof body.description === "string" ? body.description.trim() : "",
        priceMonthly:    toNumber(body.priceMonthly, 0),
        priceAnnual:     body.priceAnnual === "" || body.priceAnnual == null ? null : toNumber(body.priceAnnual, 0),
        maxFields:       toNumber(body.maxFields, -1),
        maxCrops:        toNumber(body.maxCrops, -1),
        maxActivities:   toNumber(body.maxActivities, -1),
        maxTransactions: toNumber(body.maxTransactions, -1),
        maxEmployees:    toNumber(body.maxEmployees, -1),
        maxTeamMembers:  toNumber(body.maxTeamMembers, 0),
        maxFarms:        toNumber(body.maxFarms, 1),
        sortOrder:       toNumber(body.sortOrder, 0),
    };

    for (const key of booleanKeys) {
        normalized[key] = toBoolean(body[key], key === "isActive" || key === "isPublic");
    }

    return normalized;
}
