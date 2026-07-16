import { assertStrongSecret, getRequiredEnv } from "@/lib/env";

const ADMIN_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function getAdminSecret() {
    const secret = getRequiredEnv("ADMIN_JWT_SECRET");
    assertStrongSecret("ADMIN_JWT_SECRET", secret);
    return secret;
}

function base64UrlEncode(input: string) {
    return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return atob(padded);
}

function constantTimeEqual(a: string, b: string) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

async function hmac(message: string): Promise<string> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(getAdminSecret()),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
    return Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

export async function createAdminToken(adminId: string): Promise<string> {
    const payload = `${adminId}.${Date.now()}`;
    const sig = await hmac(payload);
    return base64UrlEncode(`${payload}.${sig}`);
}

export async function verifyAdminToken(token: string): Promise<string | null> {
    try {
        const decoded = base64UrlDecode(token);
        const lastDot = decoded.lastIndexOf(".");
        if (lastDot === -1) return null;

        const payload = decoded.slice(0, lastDot);
        const sig = decoded.slice(lastDot + 1);
        const expectedSig = await hmac(payload);
        if (!constantTimeEqual(sig, expectedSig)) return null;

        const [adminId, timestampRaw] = payload.split(".");
        const timestamp = Number(timestampRaw);
        if (!adminId || !Number.isFinite(timestamp)) return null;
        if (Date.now() - timestamp > ADMIN_TOKEN_TTL_MS) return null;

        return adminId;
    } catch {
        return null;
    }
}
