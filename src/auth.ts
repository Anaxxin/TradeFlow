import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const email = credentials.email as string
                const password = credentials.password as string

                if (!email || !password) {
                    throw new Error("Missing email or password")
                }

                const user = await prisma.user.findUnique({
                    where: { email },
                })

                if (!user) {
                    throw new Error("User not found")
                }

                const isPasswordValid = await compare(password, user.password)

                if (!isPasswordValid) {
                    throw new Error("Invalid password")
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    subscriptionStatus: user.subscriptionStatus,
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            // Initial sign in
            if (user) {
                token.role = (user as any).role
                token.subscriptionStatus = (user as any).subscriptionStatus
            }
            // Subsequent calls: fetch fresh status from DB
            else if (token.email) {
                const freshUser = await prisma.user.findUnique({
                    where: { email: token.email as string },
                    select: { subscriptionStatus: true, role: true, subscriptionExpiresAt: true }
                });

                if (freshUser) {
                    let status = freshUser.subscriptionStatus;

                    // Expiry Check
                    if (status === 'ACTIVE' && freshUser.subscriptionExpiresAt) {
                        const now = new Date();
                        if (now > freshUser.subscriptionExpiresAt) {
                            status = 'INACTIVE';
                        }
                    }

                    token.subscriptionStatus = status;
                    token.role = freshUser.role;
                }
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).subscriptionStatus = token.subscriptionStatus;
                session.user.id = token.sub as string;
            }
            return session
        },
    },
    pages: {
        signIn: "/login",
    },
})
