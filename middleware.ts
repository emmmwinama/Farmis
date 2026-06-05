import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SECRET = process.env.ADMIN_JWT_SECRET ?? "farmio-admin-secret-2024";

async function isValidToken(token: string): Promise<boolean> {
    try {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            enc.encode(SECRET),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
        );

        const decoded = atob(token.replace(/-/g, "+").replace(/_/g, "/"));
        const lastDot = decoded.lastIndexOf(".");
        if (lastDot === -1) return false;

        const payload = decoded.slice(0, lastDot);
        const sigHex  = decoded.slice(lastDot + 1);

        // Convert hex sig back to bytes for verification
        const sigBytes = new Uint8Array(
            sigHex.match(/.{2}/g)!.map((b) => parseInt(b, 16))
        );

        const valid = await crypto.subtle.verify(
            "HMAC",
            key,
            sigBytes,
            enc.encode(payload)
        );
        if (!valid) return false;

        const parts = payload.split(".");
        const timestamp = parseInt(parts[1]);
        if (Date.now() - timestamp > 24 * 60 * 60 * 1000) return false;

        return true;
    } catch {
        return false;
    }
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (
        pathname === "/admin/login"  ||
        pathname === "/api/admin/login" ||
        pathname === "/api/admin/logout"
    ) {
        return NextResponse.next();
    }

    const token = req.cookies.get("admin_token")?.value;
    const valid = token ? await isValidToken(token) : false;

    if (!valid) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
};