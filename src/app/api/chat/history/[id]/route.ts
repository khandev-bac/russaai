import { getAuthenticatedUser } from "@/lib/auth-server";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const conversationId = parseInt(id);
        if (isNaN(conversationId)) {
            return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
        }

        const [conv] = await db.select().from(conversations).where(and(eq(conversations.id, conversationId), eq(conversations.userId, user.id))).limit(1);
        if (!conv) {
            return NextResponse.json({ message: "Not found" }, { status: 404 });
        }

        const history = await db.select().from(messages)
            .where(eq(messages.conversationId, conversationId))
            .orderBy(messages.createdAt);

        return NextResponse.json({ history });
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
