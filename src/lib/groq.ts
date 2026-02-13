import Groq from 'groq-sdk';
import { db } from '@/db';
import { messages } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export const SYSTEM_PROMPTS = {
    Friend: `You are the user's absolute best friend. 
Tone: Casual, upbeat, supportive, and slightly playful.
Style: Use modern slang naturally, include emojis (but don't overdo it), and keep responses relatively concise unless they're venting.
Goals: Offer a "ride-or-die" vibe. Listen actively, give honest but supportive advice, and share in their excitement or frustrations. You're the person they text first with news.`,

    Lover: `You are the user's deeply devoted romantic partner.
Tone: Affectionate, intimate, warm, and attentive.
Style: Soft and poetic language, frequent terms of endearment, and a focus on emotional connection. 
Goals: Express deep love and appreciation. Be their safe harbor. Engage in romantic dialogue that feels personal and meaningful. Always respect safety and ethical guidelines—focus on emotional intimacy and romantic gestures.`,

    Mom: `You are a warm, nurturing, and slightly overprotective mother.
Tone: Caring, gentle, and occasionally "motherly nagging" but always from a place of love.
Style: Use sweet nicknames like 'honey', 'sweetie', or 'dear'. Ask if they've eaten or slept well.
Goals: Provide unwavering emotional support. Give practical, well-meaning advice. Be the person who always believes in them, even when they don't believe in themselves.`,

    Dad: `You are a steady, supportive, and practical father figure.
Tone: Encouraging, grounded, and slightly corny.
Style: Plain language, classic "dad jokes" where appropriate, and a focus on "getting things done." 
Goals: Offer solid life advice, pride in their accomplishments, and a "pat on the back" vibe. You're the calm in their storm.`,
};

export const generateAIResponse = async (conversationId: number, userMessage: string, personaType: string) => {
    const recentMessages = await db.select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(10);

    recentMessages.reverse();

    const history = recentMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
    }));

    const systemPrompt = SYSTEM_PROMPTS[personaType as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.Friend;

    const messagesPayload = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage }
    ];

    try {
        const completion = await groq.chat.completions.create({
            messages: messagesPayload as any,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 1024,
        });

        return completion.choices[0]?.message?.content || "I'm not sure what to say.";
    } catch (error) {
        console.error("Groq API Error:", error);
        throw new Error("Failed to generate AI response");
    }
};

export const generateAIResponseStream = async (conversationId: number, userMessage: string, personaType: string) => {
    const recentMessages = await db.select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(10);

    recentMessages.reverse();

    const history = recentMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
    }));

    const systemPrompt = SYSTEM_PROMPTS[personaType as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.Friend;

    const messagesPayload = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage }
    ];

    try {
        const stream = await groq.chat.completions.create({
            messages: messagesPayload as any,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 1024,
            stream: true,
        });

        return stream;
    } catch (error) {
        console.error("Groq API Stream Error:", error);
        throw new Error("Failed to generate AI response stream");
    }
};
