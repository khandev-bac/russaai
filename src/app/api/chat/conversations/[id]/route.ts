import { getAuthenticatedUser } from "@/lib/auth-server";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { title, folderId } = await req.json();
        const conversationId = parseInt(id);

        if (isNaN(conversationId)) { // Removed !title check as title can be undefined for folderId update
            return NextResponse.json({ message: "Invalid data" }, { status: 400 });
        }

        const [updatedConv] = await db.update(conversations)
            .set({
                title: title !== undefined ? title : undefined,
                folderId: folderId !== undefined ? (folderId === null ? null : folderId) : undefined,
                updatedAt: new Date()
            })
            .where(and(eq(conversations.id, conversationId), eq(conversations.userId, user.id)))
            .returning();

        return NextResponse.json({ message: "Updated successfully", conversation: updatedConv });
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
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

        await db.transaction(async (tx) => {
            await tx.delete(messages).where(eq(messages.conversationId, conversationId));
            const result = await tx.delete(conversations)
                .where(and(eq(conversations.id, conversationId), eq(conversations.userId, user.id)))
                .returning();

            if (result.length === 0) {
                throw new Error("NOT_FOUND");
            }
        });

        return NextResponse.json({ message: "Deleted successfully" });
    } catch (error: any) {
        if (error.message === "NOT_FOUND") {
            return NextResponse.json({ message: "Not found" }, { status: 404 });
        }
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
