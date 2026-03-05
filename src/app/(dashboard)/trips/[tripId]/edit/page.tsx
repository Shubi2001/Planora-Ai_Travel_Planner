import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { TripEditor } from "@/components/itinerary/trip-editor";
import ApiKeyBanner from "@/components/shared/api-key-banner";

interface EditTripPageProps {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ generate?: string }>;
}

export async function generateMetadata({ params }: EditTripPageProps): Promise<Metadata> {
  const { tripId } = await params;
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    select: { title: true },
  });
  return { title: trip ? `Edit: ${trip.title}` : "Edit Trip" };
}

export default async function EditTripPage({ params, searchParams }: EditTripPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { tripId } = await params;
  const { generate } = await searchParams;

  const trip = await db.trip.findFirst({
    where: {
      id: tripId,
      OR: [
        { userId: session.user.id },
        {
          collaborators: {
            some: {
              userId: session.user.id,
              role: { in: ["OWNER", "EDITOR"] },
              acceptedAt: { not: null },
            },
          },
        },
      ],
    },
    include: {
      days: {
        orderBy: { sortOrder: "asc" },
        include: {
          activities: { orderBy: { sortOrder: "asc" } },
        },
      },
      budget: true,
      collaborators: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      weatherData: { orderBy: { date: "asc" } },
    },
  });

  if (!trip) notFound();

  const hasOpenAIKey =
    !!process.env.OPENAI_API_KEY &&
    !process.env.OPENAI_API_KEY.startsWith("sk-placeholder") &&
    process.env.OPENAI_API_KEY !== "sk-placeholder-replace-with-real-key";

  return (
    <>
      {!hasOpenAIKey && <ApiKeyBanner />}
      <TripEditor
        trip={trip}
        shouldAutoGenerate={generate === "true"}
        userId={session.user.id}
      />
    </>
  );
}
