export function getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (value) return value;

    if (process.env.NODE_ENV === "production") {
        throw new Error(`${name} is required in production`);
    }

    return `development-only-${name.toLowerCase()}-change-me`;
}

export function assertStrongSecret(name: string, value: string) {
    if (process.env.NODE_ENV !== "production") return;
    if (value.length < 32 || value.startsWith("development-only-")) {
        throw new Error(`${name} must be at least 32 characters in production`);
    }
}
