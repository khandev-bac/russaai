import { getAuthenticatedUser } from "@/lib/auth-server";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    const user = await getAuthenticatedUser();

    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const list = await db.select().from(conversations)
            .where(eq(conversations.userId, user.id))
            .orderBy(desc(conversations.updatedAt));

        return NextResponse.json({ conversations: list });
    } catch (error) {
        console.error("Failed to list conversations:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
