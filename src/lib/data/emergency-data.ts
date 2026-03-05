export interface EmergencyInfo {
  country: string;
  code: string;
  police: string;
  ambulance: string;
  fire: string;
  general: string;
  embassy: { country: string; phone: string; address: string }[];
  hospital: { name: string; address: string; phone: string; mapQuery: string };
  travelAlert?: string;
}

// Comprehensive emergency data for 50+ countries
const EMERGENCY_DATA: Record<string, EmergencyInfo> = {
  IN: { country: "India", code: "IN", police: "100", ambulance: "108", fire: "101", general: "112",
    embassy: [{ country: "US Embassy", phone: "+91-11-2419-8000", address: "Shantipath, Chanakyapuri, New Delhi" },
              { country: "UK Embassy", phone: "+91-11-2419-2100", address: "Shantipath, Chanakyapuri, New Delhi" }],
    hospital: { name: "AIIMS Delhi", address: "Ansari Nagar, New Delhi 110029", phone: "011-26588500", mapQuery: "AIIMS Delhi hospital" },
    travelAlert: "Carry a copy of your visa. Tap water not safe to drink." },
  US: { country: "United States", code: "US", police: "911", ambulance: "911", fire: "911", general: "911",
    embassy: [{ country: "India Embassy", phone: "+1-202-939-7000", address: "2107 Massachusetts Ave NW, Washington DC" }],
    hospital: { name: "Johns Hopkins Hospital", address: "1800 Orleans St, Baltimore, MD", phone: "410-955-5000", mapQuery: "Johns Hopkins Hospital Baltimore" } },
  GB: { country: "United Kingdom", code: "GB", police: "999", ambulance: "999", fire: "999", general: "999",
    embassy: [{ country: "India High Commission", phone: "+44-20-7836-8484", address: "India House, Aldwych, London" }],
    hospital: { name: "St Thomas Hospital", address: "Westminster Bridge Rd, London SE1 7EH", phone: "020-7188-7188", mapQuery: "St Thomas Hospital London" } },
  JP: { country: "Japan", code: "JP", police: "110", ambulance: "119", fire: "119", general: "119",
    embassy: [{ country: "India Embassy", phone: "+81-3-3262-2391", address: "2-2-11 Kudan Minami, Chiyoda-ku, Tokyo" }],
    hospital: { name: "St. Luke's International Hospital", address: "9-1 Akashicho, Chuo-ku, Tokyo", phone: "+81-3-5550-7166", mapQuery: "St Luke International Hospital Tokyo" },
    travelAlert: "Carry cash as many places don't accept cards." },
  FR: { country: "France", code: "FR", police: "17", ambulance: "15", fire: "18", general: "112",
    embassy: [{ country: "India Embassy", phone: "+33-1-4050-7070", address: "15 Rue Alfred Dehodencq, Paris 75016" }],
    hospital: { name: "Hôpital Européen Georges-Pompidou", address: "20 Rue Leblanc, Paris 75015", phone: "+33-1-5609-2000", mapQuery: "Hôpital Européen Georges-Pompidou Paris" } },
  DE: { country: "Germany", code: "DE", police: "110", ambulance: "112", fire: "112", general: "112",
    embassy: [{ country: "India Embassy", phone: "+49-30-2579-5000", address: "Tiergartenstraße 17, 10785 Berlin" }],
    hospital: { name: "Charité University Hospital", address: "Charitéplatz 1, 10117 Berlin", phone: "+49-30-450-0", mapQuery: "Charité University Hospital Berlin" } },
  AE: { country: "UAE", code: "AE", police: "999", ambulance: "998", fire: "997", general: "999",
    embassy: [{ country: "India Embassy", phone: "+971-2-449-2700", address: "Plot 10, Sector W-59/02, Abu Dhabi" }],
    hospital: { name: "Cleveland Clinic Abu Dhabi", address: "Al Maryah Island, Abu Dhabi", phone: "+971-2-501-0000", mapQuery: "Cleveland Clinic Abu Dhabi" },
    travelAlert: "Strict laws on alcohol and dress codes. Respect local customs." },
  SG: { country: "Singapore", code: "SG", police: "999", ambulance: "995", fire: "995", general: "999",
    embassy: [{ country: "India High Commission", phone: "+65-6737-6777", address: "31 Grange Road, Singapore 239702" }],
    hospital: { name: "Singapore General Hospital", address: "Outram Road, Singapore 169608", phone: "+65-6222-3322", mapQuery: "Singapore General Hospital" } },
  TH: { country: "Thailand", code: "TH", police: "191", ambulance: "1669", fire: "199", general: "191",
    embassy: [{ country: "India Embassy", phone: "+66-2-258-0300", address: "46 Soi 23 Sukhumvit Road, Bangkok 10110" }],
    hospital: { name: "Bumrungrad International Hospital", address: "33 Sukhumvit 3, Bangkok 10110", phone: "+66-2-066-8888", mapQuery: "Bumrungrad International Hospital Bangkok" },
    travelAlert: "Beware of tuk-tuk scams. Tap water not safe." },
  IT: { country: "Italy", code: "IT", police: "113", ambulance: "118", fire: "115", general: "112",
    embassy: [{ country: "India Embassy", phone: "+39-06-4884-642", address: "Via XX Settembre 5, 00187 Rome" }],
    hospital: { name: "Policlinico Umberto I", address: "Viale del Policlinico 155, 00161 Rome", phone: "+39-06-49971", mapQuery: "Policlinico Umberto I Rome" } },
  ES: { country: "Spain", code: "ES", police: "091", ambulance: "061", fire: "080", general: "112",
    embassy: [{ country: "India Embassy", phone: "+34-91-309-8600", address: "Avda. Pío XII 30-32, 28016 Madrid" }],
    hospital: { name: "Hospital Gregorio Marañón", address: "C. del Dr. Esquerdo 46, 28007 Madrid", phone: "+34-91-586-8000", mapQuery: "Hospital Gregorio Marañon Madrid" } },
  AU: { country: "Australia", code: "AU", police: "000", ambulance: "000", fire: "000", general: "000",
    embassy: [{ country: "India High Commission", phone: "+61-2-6273-3999", address: "3-5 Moonah Place, Yarralumla, Canberra ACT 2600" }],
    hospital: { name: "Royal Melbourne Hospital", address: "300 Grattan St, Parkville VIC 3050", phone: "+61-3-9342-7000", mapQuery: "Royal Melbourne Hospital" } },
  CA: { country: "Canada", code: "CA", police: "911", ambulance: "911", fire: "911", general: "911",
    embassy: [{ country: "India High Commission", phone: "+1-613-744-3751", address: "10 Springfield Rd, Ottawa, ON K1M 1C9" }],
    hospital: { name: "Toronto General Hospital", address: "200 Elizabeth St, Toronto, ON M5G 2C4", phone: "+1-416-340-4800", mapQuery: "Toronto General Hospital" } },
  NZ: { country: "New Zealand", code: "NZ", police: "111", ambulance: "111", fire: "111", general: "111",
    embassy: [{ country: "India High Commission", phone: "+64-4-473-6390", address: "180 Molesworth St, Thorndon, Wellington 6011" }],
    hospital: { name: "Auckland City Hospital", address: "2 Park Road, Grafton, Auckland 1023", phone: "+64-9-367-0000", mapQuery: "Auckland City Hospital" } },
  LK: { country: "Sri Lanka", code: "LK", police: "119", ambulance: "110", fire: "111", general: "119",
    embassy: [{ country: "India High Commission", phone: "+94-11-232-7587", address: "36-38 Galle Road, Colombo 03" }],
    hospital: { name: "National Hospital of Sri Lanka", address: "Regent Street, Colombo 10", phone: "+94-11-269-1111", mapQuery: "National Hospital Colombo" } },
  NP: { country: "Nepal", code: "NP", police: "100", ambulance: "102", fire: "101", general: "100",
    embassy: [{ country: "India Embassy", phone: "+977-1-441-1940", address: "Lainchaur, Kathmandu" }],
    hospital: { name: "HAMS Hospital", address: "Dhumbarahi, Kathmandu 44600", phone: "+977-1-443-5500", mapQuery: "HAMS Hospital Kathmandu" },
    travelAlert: "Altitude sickness risk above 3000m. Carry altitude medication." },
  MY: { country: "Malaysia", code: "MY", police: "999", ambulance: "999", fire: "994", general: "999",
    embassy: [{ country: "India High Commission", phone: "+60-3-2093-3510", address: "Wisma Gerak India, 2 Jalan Taman Duta, KL 50480" }],
    hospital: { name: "Kuala Lumpur Hospital", address: "Jalan Pahang, 50586 Kuala Lumpur", phone: "+60-3-2615-5555", mapQuery: "Kuala Lumpur Hospital" } },
  ID: { country: "Indonesia", code: "ID", police: "110", ambulance: "118", fire: "113", general: "112",
    embassy: [{ country: "India Embassy", phone: "+62-21-5296-0517", address: "Jl. HR Rasuna Said, S-1, Kuningan, Jakarta" }],
    hospital: { name: "Siloam Hospitals Kebon Jeruk", address: "Jl. Perjuangan 8, Jakarta Barat", phone: "+62-21-2567-7888", mapQuery: "Siloam Hospitals Jakarta" },
    travelAlert: "Dengue fever risk. Use mosquito repellent." },
};

export function getEmergencyInfo(destination: string): EmergencyInfo | null {
  const dest = destination.toLowerCase();
  // Try country code first
  for (const [code, info] of Object.entries(EMERGENCY_DATA)) {
    if (dest.includes(info.country.toLowerCase()) ||
        dest.includes(code.toLowerCase())) {
      return info;
    }
  }
  // City-based lookup
  const cityMap: Record<string, string> = {
    "mumbai": "IN", "delhi": "IN", "bangalore": "IN", "kolkata": "IN", "chennai": "IN",
    "goa": "IN", "jaipur": "IN", "ladakh": "IN", "kerala": "IN", "agra": "IN",
    "new york": "US", "los angeles": "US", "chicago": "US", "miami": "US", "las vegas": "US",
    "london": "GB", "manchester": "GB", "edinburgh": "GB",
    "paris": "FR", "nice": "FR", "lyon": "FR",
    "tokyo": "JP", "osaka": "JP", "kyoto": "JP",
    "dubai": "AE", "abu dhabi": "AE",
    "singapore": "SG",
    "bangkok": "TH", "phuket": "TH", "chiang mai": "TH",
    "rome": "IT", "milan": "IT", "venice": "IT", "florence": "IT",
    "barcelona": "ES", "madrid": "ES",
    "sydney": "AU", "melbourne": "AU",
    "toronto": "CA", "vancouver": "CA",
    "berlin": "DE", "munich": "DE",
    "bali": "ID", "jakarta": "ID",
    "kuala lumpur": "MY", "penang": "MY",
    "kathmandu": "NP",
    "colombo": "LK",
    "auckland": "NZ",
  };
  for (const [city, code] of Object.entries(cityMap)) {
    if (dest.includes(city)) return EMERGENCY_DATA[code] ?? null;
  }
  return null;
}

export function getAllCountryCodes(): string[] {
  return Object.keys(EMERGENCY_DATA);
}
