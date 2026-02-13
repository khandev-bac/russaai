import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
    const session = req.auth;
    const accessToken = req.cookies.get('accessToken')?.value;

    const refreshToken = req.cookies.get('refreshToken')?.value;
    const isChatPage = req.nextUrl.pathname.startsWith('/chat');

    // Allow access if we have a session (NextAuth) OR an accessToken OR a refreshToken (to allow auto-refresh)
    if (isChatPage && !session && !accessToken && !refreshToken) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/chat/:path*", "/chat"],
};
