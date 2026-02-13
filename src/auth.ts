import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (!user.email) return false;

            try {
                const existingUser = await db.query.users.findFirst({
                    where: (users, { eq }) => eq(users.email, user.email!),
                });

                if (!existingUser) {
                    await db.insert(users).values({
                        email: user.email,
                        name: user.name,
                        googleId: user.id || undefined,
                        credits: 10,
                        plan: 'free',
                    });
                } else if (!existingUser.name && user.name) {
                    await db.update(users)
                        .set({ name: user.name })
                        .where(eq(users.id, existingUser.id));
                }
                return true;
            } catch (error) {
                console.error("Error during sign in:", error);
                return false;
            }
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            return session;
        },
    },
    secret: process.env.AUTH_SECRET,
});
