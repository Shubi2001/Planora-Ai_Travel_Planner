import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NewTripWizard } from "@/components/trips/new-trip-wizard";

export const metadata: Metadata = { title: "Plan a New Trip" };

export default async function NewTripPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="mb-5 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-1.5">Plan a New Trip</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Tell our AI about your dream trip and we&apos;ll build a complete itinerary.
        </p>
      </div>
      <NewTripWizard />
    </div>
  );
}
