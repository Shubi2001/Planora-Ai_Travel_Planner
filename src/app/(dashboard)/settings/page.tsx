import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile and preferences.</p>
      </div>
      <SettingsForm user={session.user} />
    </div>
  );
}
