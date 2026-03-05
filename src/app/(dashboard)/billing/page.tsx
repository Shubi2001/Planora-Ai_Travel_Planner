import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { BillingPage } from "@/components/billing/billing-page";

export const metadata: Metadata = { title: "Billing" };

export default async function Billing() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const subscription = await db.subscription.findUnique({
    where: { userId: session.user.id },
  });

  return <BillingPage subscription={subscription} />;
}
