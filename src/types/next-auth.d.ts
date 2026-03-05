import type { UserRole, SubscriptionPlan } from "@/types/enums";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      plan: SubscriptionPlan;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    plan?: SubscriptionPlan;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    plan?: SubscriptionPlan;
  }
}
