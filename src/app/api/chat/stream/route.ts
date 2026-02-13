import { getAuthenticatedUser } from "@/lib/auth-server";
import { db } from "@/db";
import { users, conversations, messages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateAIResponseStream } from "@/lib/groq";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const user = await getAuthenticatedUser();
    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { message, personaType, conversationId, folderId } = await req.json();

        if (!message) {
            return NextResponse.json({ message: "Message content is required" }, { status: 400 });
        }

        if (user.credits <= 0) {
            return NextResponse.json({ message: "Insufficient credits", code: "NO_CREDITS" }, { status: 403 });
        }

        let currentConversationId: number;

        if (conversationId) {
            const [existingConv] = await db.select().from(conversations)
                .where(and(eq(conversations.id, conversationId), eq(conversations.userId, user.id)))
                .limit(1);

            if (!existingConv) {
                return NextResponse.json({ message: "Conversation not found" }, { status: 404 });
            }
            currentConversationId = conversationId;

            await db.update(conversations)
                .set({ updatedAt: new Date() })
                .where(eq(conversations.id, currentConversationId));
        } else {
            const [newConv] = await db.insert(conversations).values({
                userId: user.id,
                folderId: folderId || null,
                personaType: personaType || "Friend",
                title: message.substring(0, 30) + (message.length > 30 ? "..." : ""),
            }).returning();
            currentConversationId = newConv!.id;
        }

        await db.insert(messages).values({
            conversationId: currentConversationId,
            role: "user",
            content: message,
        });

        const stream = await generateAIResponseStream(currentConversationId, message, personaType || "Friend");

        const encoder = new TextEncoder();
        const customStream = new ReadableStream({
            async start(controller) {
                let fullAiResponse = "";

                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            fullAiResponse += content;
                            const data = JSON.stringify({ content, conversationId: currentConversationId });
                            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                        }
                    }

                    const [aiMessage] = await db.insert(messages).values({
                        conversationId: currentConversationId,
                        role: "assistant",
                        content: fullAiResponse,
                    }).returning();

                    await db.update(users)
                        .set({ credits: user.credits - 1 })
                        .where(eq(users.id, user.id));

                    const finalData = JSON.stringify({ done: true, messageId: aiMessage!.id, creditsRemaining: user.credits - 1 });
                    controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
                    controller.close();
                } catch (err) {
                    console.error("Stream Error:", err);
                    controller.error(err);
                }
            }
        });

        return new Response(customStream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (error) {
        console.error("Chat Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
