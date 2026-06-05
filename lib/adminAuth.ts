import { cookies } from "next/headers";

const SECRET = process.env.ADMIN_JWT_SECRET ?? "farmio-admin-secret-2024";

// Simple token using Web Crypto API (works in all Next.js contexts)
async function hmac(message: string): Promise<string> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(SECRET),
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
    return btoa(`${payload}.${sig}`).replace(/=/g, "");
}

export async function verifyAdminToken(token: string): Promise<string | null> {
    try {
        const decoded = atob(token.replace(/-/g, "+").replace(/_/g, "/"));
        const lastDot = decoded.lastIndexOf(".");
        if (lastDot === -1) return null;

        const payload = decoded.slice(0, lastDot);
        const sig = decoded.slice(lastDot + 1);

        const expectedSig = await hmac(payload);
        if (sig !== expectedSig) return null;

        const parts = payload.split(".");
        if (parts.length < 2) return null;

        const adminId = parts[0];
        const timestamp = parseInt(parts[1]);

        // 24-hour expiry
        if (Date.now() - timestamp > 24 * 60 * 60 * 1000) return null;

        return adminId;
    } catch {
        return null;
    }
}

// Alias kept for any existing imports
export const signAdminToken = createAdminToken;

export async function getAdminSession(): Promise<{ id: string } | null> {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get("admin_token")?.value;
        if (!token) return null;

        const adminId = await verifyAdminToken(token);
        if (!adminId) return null;

        return { id: adminId };
    } catch {
        return null;
    }
}