import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface User {
        role: string;
        subscriptionStatus: string;
    }

    interface Session {
        user: {
            id: string;
            role: string;
            subscriptionStatus: string;
        } & DefaultSession["user"]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: string;
        subscriptionStatus: string;
    }
}
