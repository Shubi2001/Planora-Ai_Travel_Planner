/**
 * Modular flight search service.
 * Currently returns curated mock data for demonstration.
 * Replace `searchFlights` implementation to plug in Amadeus, Skyscanner, or any GDS API.
 */

export interface FlightOffer {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
  cabinClass: string;
  bookingUrl?: string;
  logo?: string;
}

export interface HotelOffer {
  id: string;
  name: string;
  address: string;
  stars: number;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  currency: string;
  checkIn: string;
  checkOut: string;
  imageUrl: string;
  amenities: string[];
  bookingUrl?: string;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  currency?: string;
}

export interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
  currency?: string;
}

const AIRLINES = ["Emirates", "Qatar Airways", "Singapore Airlines", "Delta", "United", "Lufthansa", "Air France", "British Airways"];
const AIRLINE_CODES = ["EK", "QR", "SQ", "DL", "UA", "LH", "AF", "BA"];

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
  // TODO: Replace with real API call, e.g.:
  // const amadeus = new Amadeus({ clientId: process.env.AMADEUS_CLIENT_ID, clientSecret: process.env.AMADEUS_CLIENT_SECRET });
  // const response = await amadeus.shopping.flightOffersSearch.get({ originLocationCode: params.origin, ... });

  await new Promise((r) => setTimeout(r, 600)); // simulate network

  const departure = new Date(params.departureDate + "T08:00:00Z");
  const currency = params.currency ?? "USD";

  return Array.from({ length: 6 }, (_, i) => {
    const idx = i % AIRLINES.length;
    const basePrice = randomBetween(280, 1200);
    const durationH = randomBetween(4, 16);
    const depOffset = i * 2.5;
    const dep = addHours(departure, depOffset);
    const arr = addHours(new Date(dep), durationH);

    return {
      id: `flight-${i}`,
      airline: AIRLINES[idx],
      airlineCode: AIRLINE_CODES[idx],
      flightNumber: `${AIRLINE_CODES[idx]}${randomBetween(100, 999)}`,
      origin: params.origin.toUpperCase(),
      destination: params.destination.toUpperCase(),
      departureTime: dep,
      arrivalTime: arr,
      duration: `${durationH}h ${randomBetween(0, 55)}m`,
      stops: i < 3 ? 0 : 1,
      price: basePrice,
      currency,
      cabinClass: i < 2 ? "BUSINESS" : "ECONOMY",
      bookingUrl: `https://www.google.com/flights?q=${params.origin}+to+${params.destination}`,
    };
  }).sort((a, b) => a.price - b.price);
}

export async function searchHotels(params: HotelSearchParams): Promise<HotelOffer[]> {
  // TODO: Replace with real API call, e.g.:
  // const amadeus = new Amadeus({ ... });
  // const response = await amadeus.shopping.hotelOffersSearch.get({ cityCode: params.destination, ... });

  await new Promise((r) => setTimeout(r, 500));

  const amenityPool = ["Free WiFi", "Pool", "Gym", "Spa", "Restaurant", "Parking", "Room Service", "Bar", "Airport Shuttle", "Concierge"];
  const currency = params.currency ?? "USD";

  return Array.from({ length: 6 }, (_, i) => {
    const stars = Math.max(3, 5 - Math.floor(i / 2));
    const basePrice = stars === 5 ? randomBetween(200, 600) : stars === 4 ? randomBetween(80, 200) : randomBetween(40, 90);
    const amenityCount = randomBetween(3, 6);
    const shuffled = [...amenityPool].sort(() => 0.5 - Math.random());

    return {
      id: `hotel-${i}`,
      name: [`Grand ${params.destination} Palace`, `The ${params.destination} Boutique`, `${params.destination} Premier Inn`, `Hilton ${params.destination}`, `Marriott ${params.destination} City`, `${params.destination} Backpackers`][i],
      address: `${randomBetween(1, 200)} Central Avenue, ${params.destination}`,
      stars,
      rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
      reviewCount: randomBetween(100, 3000),
      pricePerNight: basePrice,
      currency,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      imageUrl: `https://picsum.photos/seed/hotel-${params.destination.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 20)}-${i}/400/300`,
      amenities: shuffled.slice(0, amenityCount),
      bookingUrl: `https://www.booking.com/search.html?ss=${encodeURIComponent(params.destination)}`,
    };
  }).sort((a, b) => b.rating - a.rating);
}
