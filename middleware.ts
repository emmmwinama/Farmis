import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminToken } from "@/lib/adminToken";

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/api/mobile/")) {
        return mobileCors(req);
    }

    if (
        pathname === "/admin/login"  ||
        pathname === "/api/admin/login" ||
        pathname === "/api/admin/logout"
    ) {
        return NextResponse.next();
    }

    const token = req.cookies.get("admin_token")?.value;
    const valid = token ? await verifyAdminToken(token) : false;

    if (!valid) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    return NextResponse.next();
}

function mobileCors(req: NextRequest) {
    const origin = req.headers.get("origin") ?? "";
    const allowedOrigins = new Set([
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ]);
    const allowOrigin = allowedOrigins.has(origin) ? origin : "";

    const headers = new Headers();
    if (allowOrigin) headers.set("Access-Control-Allow-Origin", allowOrigin);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");

    if (req.method === "OPTIONS") {
        return new NextResponse(null, { status: 204, headers });
    }

    const response = NextResponse.next();
    headers.forEach((value, key) => response.headers.set(key, value));
    return response;
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*", "/api/mobile/:path*"],
};
