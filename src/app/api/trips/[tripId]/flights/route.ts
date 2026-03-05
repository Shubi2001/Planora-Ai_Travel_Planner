import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/utils/api-response";
import { searchFlights, searchHotels } from "@/lib/travel/flights";
import { format } from "date-fns";

export const runtime = "nodejs";

// GET /api/trips/[tripId]/flights?type=flights|hotels
export async function GET(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "flights";

  const trip = await db.trip.findFirst({
    where: {
      id: params.tripId,
      OR: [
        { userId: session.user.id },
        { collaborators: { some: { userId: session.user.id, acceptedAt: { not: null } } } },
      ],
    },
  });

  if (!trip) return errorResponse("Trip not found", 404);

  const origin = searchParams.get("origin") ?? "NYC";
  const startDate = format(new Date(trip.startDate), "yyyy-MM-dd");
  const endDate = format(new Date(trip.endDate), "yyyy-MM-dd");
  const currency = trip.currency ?? "USD";

  if (type === "hotels") {
    const hotels = await searchHotels({
      destination: trip.destination,
      checkIn: startDate,
      checkOut: endDate,
      guests: trip.groupSize ?? 1,
      currency,
    });
    return successResponse({ hotels });
  }

  const flights = await searchFlights({
    origin,
    destination: trip.destination,
    departureDate: startDate,
    returnDate: endDate,
    adults: trip.groupSize ?? 1,
    currency,
  });

  return successResponse({ flights });
}
