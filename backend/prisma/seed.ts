import { PrismaClient, BerthType, TrainType, SeatClassName, ScheduleStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Static Data ──────────────────────────────────────────────────────────────

const STATIONS = [
  // Delhi / NCR
  { code: "NDLS", name: "New Delhi",            city: "New Delhi",        state: "Delhi" },
  { code: "DLI",  name: "Old Delhi",            city: "Delhi",            state: "Delhi" },
  { code: "NZM",  name: "Hazrat Nizamuddin",    city: "Delhi",            state: "Delhi" },
  // Uttar Pradesh
  { code: "AGC",  name: "Agra Cantt",           city: "Agra",             state: "Uttar Pradesh" },
  { code: "MTJ",  name: "Mathura Jn",           city: "Mathura",          state: "Uttar Pradesh" },
  { code: "CNB",  name: "Kanpur Central",       city: "Kanpur",           state: "Uttar Pradesh" },
  { code: "LKO",  name: "Lucknow",              city: "Lucknow",          state: "Uttar Pradesh" },
  { code: "BSB",  name: "Varanasi Jn",          city: "Varanasi",         state: "Uttar Pradesh" },
  { code: "GKP",  name: "Gorakhpur Jn",         city: "Gorakhpur",        state: "Uttar Pradesh" },
  { code: "ALD",  name: "Prayagraj Jn",         city: "Prayagraj",        state: "Uttar Pradesh" },
  { code: "MB",   name: "Moradabad",            city: "Moradabad",        state: "Uttar Pradesh" },
  { code: "BE",   name: "Bareilly",             city: "Bareilly",         state: "Uttar Pradesh" },
  { code: "JHS",  name: "Jhansi Jn",            city: "Jhansi",           state: "Uttar Pradesh" },
  { code: "DDU",  name: "Pt. DD Upadhyaya Jn", city: "Varanasi",         state: "Uttar Pradesh" },
  // Madhya Pradesh
  { code: "GWL",  name: "Gwalior",              city: "Gwalior",          state: "Madhya Pradesh" },
  { code: "BPL",  name: "Bhopal Jn",            city: "Bhopal",           state: "Madhya Pradesh" },
  { code: "INDB", name: "Indore Jn Bg",         city: "Indore",           state: "Madhya Pradesh" },
  { code: "RTM",  name: "Ratlam Jn",            city: "Ratlam",           state: "Madhya Pradesh" },
  { code: "JBP",  name: "Jabalpur",             city: "Jabalpur",         state: "Madhya Pradesh" },
  { code: "ITJ",  name: "Itarsi Jn",            city: "Hoshangabad",      state: "Madhya Pradesh" },
  // Bihar
  { code: "PNBE", name: "Patna Jn",             city: "Patna",            state: "Bihar" },
  { code: "GAYA", name: "Gaya Jn",              city: "Gaya",             state: "Bihar" },
  { code: "BGP",  name: "Bhagalpur Jn",         city: "Bhagalpur",        state: "Bihar" },
  // West Bengal
  { code: "HWH",  name: "Howrah Jn",            city: "Kolkata",          state: "West Bengal" },
  { code: "SDAH", name: "Sealdah",              city: "Kolkata",          state: "West Bengal" },
  { code: "ASN",  name: "Asansol Jn",           city: "Asansol",          state: "West Bengal" },
  { code: "NJP",  name: "New Jalpaiguri",       city: "Siliguri",         state: "West Bengal" },
  // Assam
  { code: "GHY",  name: "Guwahati",             city: "Guwahati",         state: "Assam" },
  { code: "DBRG", name: "Dibrugarh",            city: "Dibrugarh",        state: "Assam" },
  // Rajasthan
  { code: "JP",   name: "Jaipur Jn",            city: "Jaipur",           state: "Rajasthan" },
  { code: "JU",   name: "Jodhpur Jn",           city: "Jodhpur",          state: "Rajasthan" },
  { code: "UDZ",  name: "Udaipur City",         city: "Udaipur",          state: "Rajasthan" },
  { code: "AII",  name: "Ajmer Jn",             city: "Ajmer",            state: "Rajasthan" },
  { code: "KOTA", name: "Kota Jn",              city: "Kota",             state: "Rajasthan" },
  { code: "BKN",  name: "Bikaner Jn",           city: "Bikaner",          state: "Rajasthan" },
  // Haryana / Punjab / Chandigarh
  { code: "UMB",  name: "Ambala Cant",          city: "Ambala",           state: "Haryana" },
  { code: "CDG",  name: "Chandigarh",           city: "Chandigarh",       state: "Chandigarh" },
  { code: "LDH",  name: "Ludhiana Jn",          city: "Ludhiana",         state: "Punjab" },
  { code: "AMR",  name: "Amritsar Jn",          city: "Amritsar",         state: "Punjab" },
  { code: "JUC",  name: "Jalandhar City",       city: "Jalandhar",        state: "Punjab" },
  // Uttarakhand
  { code: "DDN",  name: "Dehradun",             city: "Dehradun",         state: "Uttarakhand" },
  { code: "HW",   name: "Haridwar Jn",          city: "Haridwar",         state: "Uttarakhand" },
  // Gujarat
  { code: "ADI",  name: "Ahmedabad Jn",         city: "Ahmedabad",        state: "Gujarat" },
  { code: "BRC",  name: "Vadodara Jn",          city: "Vadodara",         state: "Gujarat" },
  { code: "ST",   name: "Surat",                city: "Surat",            state: "Gujarat" },
  { code: "RJT",  name: "Rajkot Jn",            city: "Rajkot",           state: "Gujarat" },
  // Maharashtra
  { code: "CSMT", name: "Mumbai CSMT",          city: "Mumbai",           state: "Maharashtra" },
  { code: "PUNE", name: "Pune Jn",              city: "Pune",             state: "Maharashtra" },
  { code: "NGP",  name: "Nagpur",               city: "Nagpur",           state: "Maharashtra" },
  { code: "SUR",  name: "Solapur",              city: "Solapur",          state: "Maharashtra" },
  // Telangana / Andhra Pradesh
  { code: "SC",   name: "Secunderabad Jn",      city: "Hyderabad",        state: "Telangana" },
  { code: "BZA",  name: "Vijayawada Jn",        city: "Vijayawada",       state: "Andhra Pradesh" },
  { code: "VSKP", name: "Visakhapatnam",        city: "Visakhapatnam",    state: "Andhra Pradesh" },
  { code: "GNT",  name: "Guntur Jn",            city: "Guntur",           state: "Andhra Pradesh" },
  // Tamil Nadu
  { code: "MAS",  name: "Chennai Central",      city: "Chennai",          state: "Tamil Nadu" },
  { code: "CBE",  name: "Coimbatore Jn",        city: "Coimbatore",       state: "Tamil Nadu" },
  { code: "MDU",  name: "Madurai Jn",           city: "Madurai",          state: "Tamil Nadu" },
  // Kerala
  { code: "ERS",  name: "Ernakulam Jn",         city: "Kochi",            state: "Kerala" },
  { code: "TVC",  name: "Trivandrum Central",   city: "Thiruvananthapuram", state: "Kerala" },
  // Karnataka
  { code: "SBC",  name: "KSR Bengaluru",        city: "Bengaluru",        state: "Karnataka" },
  { code: "MYS",  name: "Mysuru Jn",            city: "Mysuru",           state: "Karnataka" },
  { code: "HUB",  name: "Hubballi Jn",          city: "Hubballi",         state: "Karnataka" },
];

// ─── Train / Stop / Coach Configuration ───────────────────────────────────────

interface StopCfg {
  code: string;
  seq: number;
  arr?: string;
  dep?: string;
  dist: number;
}

interface CoachCfg {
  prefix: string;   // H, A, B, S
  count: number;
  className: SeatClassName;
  totalSeats: number;
}

interface TrainCfg {
  number: string;
  name: string;
  type: TrainType;
  stops: StopCfg[];
  coaches: CoachCfg[];
}

const TRAINS: TrainCfg[] = [
  // ── 1. Mumbai Rajdhani Express ────────────────────────────────────────────
  {
    number: "12951", name: "Mumbai Rajdhani Express", type: "EXPRESS",
    coaches: [
      { prefix: "H", count: 2, className: "AC_FIRST_CLASS", totalSeats: 18 },
      { prefix: "A", count: 4, className: "AC_2TIER",       totalSeats: 46 },
      { prefix: "B", count: 8, className: "AC_3TIER",       totalSeats: 64 },
    ],
    stops: [
      { code: "NDLS", seq: 1,                  dep: "17:00", dist: 0    },
      { code: "NZM",  seq: 2, arr: "17:10",    dep: "17:15", dist: 6    },
      { code: "KOTA", seq: 3, arr: "21:00",    dep: "21:05", dist: 356  },
      { code: "RTM",  seq: 4, arr: "23:15",    dep: "23:20", dist: 580  },
      { code: "BRC",  seq: 5, arr: "02:05",    dep: "02:10", dist: 760  },
      { code: "ST",   seq: 6, arr: "04:00",    dep: "04:05", dist: 910  },
      { code: "CSMT", seq: 7, arr: "09:30",                  dist: 1447 },
    ],
  },
  // ── 2. Howrah Rajdhani Express ─────────────────────────────────────────────
  {
    number: "12301", name: "Howrah Rajdhani Express", type: "EXPRESS",
    coaches: [
      { prefix: "H", count: 2, className: "AC_FIRST_CLASS", totalSeats: 18 },
      { prefix: "A", count: 4, className: "AC_2TIER",       totalSeats: 46 },
      { prefix: "B", count: 6, className: "AC_3TIER",       totalSeats: 64 },
    ],
    stops: [
      { code: "NDLS", seq: 1,                  dep: "17:05", dist: 0    },
      { code: "CNB",  seq: 2, arr: "22:10",    dep: "22:15", dist: 441  },
      { code: "DDU",  seq: 3, arr: "01:20",    dep: "01:25", dist: 780  },
      { code: "GAYA", seq: 4, arr: "04:00",    dep: "04:05", dist: 1002 },
      { code: "ASN",  seq: 5, arr: "06:30",    dep: "06:35", dist: 1152 },
      { code: "HWH",  seq: 6, arr: "09:55",                  dist: 1449 },
    ],
  },
  // ── 3. Tamil Nadu Express ─────────────────────────────────────────────────
  {
    number: "12621", name: "Tamil Nadu Express", type: "SUPERFAST",
    coaches: [
      { prefix: "H", count: 1, className: "AC_FIRST_CLASS", totalSeats: 18 },
      { prefix: "A", count: 2, className: "AC_2TIER",       totalSeats: 46 },
      { prefix: "B", count: 4, className: "AC_3TIER",       totalSeats: 64 },
      { prefix: "S", count: 8, className: "SLEEPER",        totalSeats: 72 },
    ],
    stops: [
      { code: "NZM",  seq: 1,                  dep: "22:30", dist: 0    },
      { code: "KOTA", seq: 2, arr: "02:45",    dep: "02:50", dist: 350  },
      { code: "BPL",  seq: 3, arr: "07:30",    dep: "07:35", dist: 700  },
      { code: "NGP",  seq: 4, arr: "14:00",    dep: "14:05", dist: 1100 },
      { code: "SC",   seq: 5, arr: "20:30",    dep: "20:35", dist: 1500 },
      { code: "BZA",  seq: 6, arr: "01:15",    dep: "01:20", dist: 1750 },
      { code: "MAS",  seq: 7, arr: "06:00",                  dist: 2200 },
    ],
  },
  // ── 4. Karnataka Express ──────────────────────────────────────────────────
  {
    number: "12627", name: "Karnataka Express", type: "SUPERFAST",
    coaches: [
      { prefix: "H", count: 1, className: "AC_FIRST_CLASS", totalSeats: 18 },
      { prefix: "A", count: 2, className: "AC_2TIER",       totalSeats: 46 },
      { prefix: "B", count: 4, className: "AC_3TIER",       totalSeats: 64 },
      { prefix: "S", count: 6, className: "SLEEPER",        totalSeats: 72 },
    ],
    stops: [
      { code: "NDLS", seq: 1,                  dep: "22:30", dist: 0    },
      { code: "MTJ",  seq: 2, arr: "01:05",    dep: "01:10", dist: 141  },
      { code: "AGC",  seq: 3, arr: "02:00",    dep: "02:05", dist: 187  },
      { code: "JHS",  seq: 4, arr: "05:15",    dep: "05:20", dist: 403  },
      { code: "BPL",  seq: 5, arr: "09:40",    dep: "09:45", dist: 702  },
      { code: "NGP",  seq: 6, arr: "16:30",    dep: "16:35", dist: 1100 },
      { code: "SC",   seq: 7, arr: "22:00",    dep: "22:05", dist: 1500 },
      { code: "SBC",  seq: 8, arr: "08:00",                  dist: 2100 },
    ],
  },
  // ── 5. Coromandel Express ─────────────────────────────────────────────────
  {
    number: "12841", name: "Coromandel Express", type: "SUPERFAST",
    coaches: [
      { prefix: "H", count: 1, className: "AC_FIRST_CLASS", totalSeats: 18 },
      { prefix: "A", count: 2, className: "AC_2TIER",       totalSeats: 46 },
      { prefix: "B", count: 4, className: "AC_3TIER",       totalSeats: 64 },
      { prefix: "S", count: 8, className: "SLEEPER",        totalSeats: 72 },
    ],
    stops: [
      { code: "HWH",  seq: 1,                  dep: "14:05", dist: 0    },
      { code: "VSKP", seq: 2, arr: "01:40",    dep: "01:45", dist: 1080 },
      { code: "BZA",  seq: 3, arr: "06:05",    dep: "06:10", dist: 1346 },
      { code: "MAS",  seq: 4, arr: "10:00",                  dist: 1652 },
    ],
  },
  // ── 6. Golden Temple Mail ─────────────────────────────────────────────────
  {
    number: "12903", name: "Golden Temple Mail", type: "SUPERFAST",
    coaches: [
      { prefix: "H", count: 1, className: "AC_FIRST_CLASS", totalSeats: 18 },
      { prefix: "A", count: 2, className: "AC_2TIER",       totalSeats: 46 },
      { prefix: "B", count: 4, className: "AC_3TIER",       totalSeats: 64 },
      { prefix: "S", count: 6, className: "SLEEPER",        totalSeats: 72 },
    ],
    stops: [
      { code: "CSMT", seq: 1,                  dep: "21:35", dist: 0    },
      { code: "BRC",  seq: 2, arr: "02:35",    dep: "02:40", dist: 390  },
      { code: "ADI",  seq: 3, arr: "05:00",    dep: "05:05", dist: 491  },
      { code: "JP",   seq: 4, arr: "12:05",    dep: "12:10", dist: 897  },
      { code: "NZM",  seq: 5, arr: "16:50",    dep: "16:55", dist: 1287 },
      { code: "UMB",  seq: 6, arr: "20:35",    dep: "20:40", dist: 1500 },
      { code: "JUC",  seq: 7, arr: "22:45",    dep: "22:50", dist: 1600 },
      { code: "AMR",  seq: 8, arr: "00:30",                  dist: 1656 },
    ],
  },
  // ── 7. Vaishali Express ───────────────────────────────────────────────────
  {
    number: "12554", name: "Vaishali Express", type: "SUPERFAST",
    coaches: [
      { prefix: "H", count: 1, className: "AC_FIRST_CLASS", totalSeats: 18 },
      { prefix: "A", count: 2, className: "AC_2TIER",       totalSeats: 46 },
      { prefix: "B", count: 3, className: "AC_3TIER",       totalSeats: 64 },
      { prefix: "S", count: 8, className: "SLEEPER",        totalSeats: 72 },
    ],
    stops: [
      { code: "NDLS", seq: 1,                  dep: "16:25", dist: 0   },
      { code: "CNB",  seq: 2, arr: "22:15",    dep: "22:20", dist: 441 },
      { code: "LKO",  seq: 3, arr: "00:30",    dep: "00:35", dist: 493 },
      { code: "GKP",  seq: 4, arr: "04:45",    dep: "04:50", dist: 729 },
      { code: "PNBE", seq: 5, arr: "09:30",                  dist: 1053 },
    ],
  },
  // ── 8. Kerala Express ────────────────────────────────────────────────────
  {
    number: "12625", name: "Kerala Express", type: "SUPERFAST",
    coaches: [
      { prefix: "H", count: 1, className: "AC_FIRST_CLASS", totalSeats: 18 },
      { prefix: "A", count: 2, className: "AC_2TIER",       totalSeats: 46 },
      { prefix: "B", count: 4, className: "AC_3TIER",       totalSeats: 64 },
      { prefix: "S", count: 10, className: "SLEEPER",       totalSeats: 72 },
    ],
    stops: [
      { code: "NDLS", seq: 1,                  dep: "11:00", dist: 0    },
      { code: "CNB",  seq: 2, arr: "16:30",    dep: "16:35", dist: 441  },
      { code: "BSB",  seq: 3, arr: "20:30",    dep: "20:35", dist: 730  },
      { code: "SC",   seq: 4, arr: "09:00",    dep: "09:05", dist: 1750 },
      { code: "MAS",  seq: 5, arr: "16:00",    dep: "16:05", dist: 2100 },
      { code: "CBE",  seq: 6, arr: "21:30",    dep: "21:35", dist: 2400 },
      { code: "TVC",  seq: 7, arr: "06:30",                  dist: 2800 },
    ],
  },
  // ── 9. Deccan Queen ───────────────────────────────────────────────────────
  {
    number: "12123", name: "Deccan Queen Express", type: "SUPERFAST",
    coaches: [
      { prefix: "A", count: 4, className: "AC_2TIER", totalSeats: 46 },
      { prefix: "B", count: 6, className: "AC_3TIER", totalSeats: 64 },
      { prefix: "S", count: 3, className: "SLEEPER",  totalSeats: 72 },
    ],
    stops: [
      { code: "CSMT", seq: 1,               dep: "17:10", dist: 0   },
      { code: "PUNE", seq: 2, arr: "20:25",               dist: 192 },
    ],
  },
  // ── 10. Bhopal Shatabdi Express ──────────────────────────────────────────
  {
    number: "12001", name: "Bhopal Shatabdi Express", type: "EXPRESS",
    coaches: [
      { prefix: "H", count: 2, className: "AC_FIRST_CLASS", totalSeats: 18 },
      { prefix: "A", count: 4, className: "AC_2TIER",       totalSeats: 46 },
      { prefix: "B", count: 8, className: "AC_3TIER",       totalSeats: 64 },
    ],
    stops: [
      { code: "NDLS", seq: 1,               dep: "06:00", dist: 0   },
      { code: "AGC",  seq: 2, arr: "08:15", dep: "08:20", dist: 187 },
      { code: "GWL",  seq: 3, arr: "09:15", dep: "09:20", dist: 302 },
      { code: "JHS",  seq: 4, arr: "11:05", dep: "11:10", dist: 403 },
      { code: "BPL",  seq: 5, arr: "14:00",               dist: 702 },
    ],
  },
  // ── 11. NE Express ───────────────────────────────────────────────────────
  {
    number: "12505", name: "North East Express", type: "EXPRESS",
    coaches: [
      { prefix: "H", count: 1, className: "AC_FIRST_CLASS", totalSeats: 18 },
      { prefix: "A", count: 2, className: "AC_2TIER",       totalSeats: 46 },
      { prefix: "B", count: 4, className: "AC_3TIER",       totalSeats: 64 },
      { prefix: "S", count: 10, className: "SLEEPER",       totalSeats: 72 },
    ],
    stops: [
      { code: "NDLS", seq: 1,                  dep: "18:00", dist: 0    },
      { code: "CNB",  seq: 2, arr: "23:30",    dep: "23:35", dist: 441  },
      { code: "LKO",  seq: 3, arr: "01:45",    dep: "01:50", dist: 562  },
      { code: "GKP",  seq: 4, arr: "06:00",    dep: "06:05", dist: 811  },
      { code: "PNBE", seq: 5, arr: "10:00",    dep: "10:05", dist: 1085 },
      { code: "BGP",  seq: 6, arr: "13:30",    dep: "13:35", dist: 1268 },
      { code: "NJP",  seq: 7, arr: "22:30",    dep: "22:35", dist: 1700 },
      { code: "GHY",  seq: 8, arr: "05:00",                  dist: 2000 },
    ],
  },
  // ── 12. Rajasthan Express ────────────────────────────────────────────────
  {
    number: "14311", name: "Rajasthan Express", type: "SUPERFAST",
    coaches: [
      { prefix: "H", count: 1, className: "AC_FIRST_CLASS", totalSeats: 18 },
      { prefix: "A", count: 2, className: "AC_2TIER",       totalSeats: 46 },
      { prefix: "B", count: 3, className: "AC_3TIER",       totalSeats: 64 },
      { prefix: "S", count: 5, className: "SLEEPER",        totalSeats: 72 },
    ],
    stops: [
      { code: "NDLS", seq: 1,               dep: "07:00", dist: 0   },
      { code: "JP",   seq: 2, arr: "10:20", dep: "10:25", dist: 303 },
      { code: "AII",  seq: 3, arr: "12:00", dep: "12:05", dist: 439 },
      { code: "ADI",  seq: 4, arr: "17:30",               dist: 936 },
    ],
  },
  // ── 13. Poorva Express ───────────────────────────────────────────────────
  {
    number: "12303", name: "Poorva Express", type: "SUPERFAST",
    coaches: [
      { prefix: "H", count: 1, className: "AC_FIRST_CLASS", totalSeats: 18 },
      { prefix: "A", count: 2, className: "AC_2TIER",       totalSeats: 46 },
      { prefix: "B", count: 4, className: "AC_3TIER",       totalSeats: 64 },
      { prefix: "S", count: 8, className: "SLEEPER",        totalSeats: 72 },
    ],
    stops: [
      { code: "NDLS", seq: 1,                  dep: "08:30", dist: 0    },
      { code: "ALD",  seq: 2, arr: "14:30",    dep: "14:35", dist: 634  },
      { code: "DDU",  seq: 3, arr: "16:55",    dep: "17:00", dist: 810  },
      { code: "PNBE", seq: 4, arr: "20:30",    dep: "20:35", dist: 1000 },
      { code: "ASN",  seq: 5, arr: "23:45",    dep: "23:50", dist: 1250 },
      { code: "HWH",  seq: 6, arr: "03:30",                  dist: 1447 },
    ],
  },
  // ── 14. Lalbagh Express ──────────────────────────────────────────────────
  {
    number: "12607", name: "Lalbagh Express", type: "EXPRESS",
    coaches: [
      { prefix: "A", count: 2, className: "AC_2TIER",  totalSeats: 46 },
      { prefix: "B", count: 3, className: "AC_3TIER",  totalSeats: 64 },
      { prefix: "S", count: 8, className: "SLEEPER",   totalSeats: 72 },
    ],
    stops: [
      { code: "MAS", seq: 1,               dep: "06:10", dist: 0   },
      { code: "SBC", seq: 2, arr: "11:30", dep: "11:35", dist: 362 },
      { code: "MYS", seq: 3, arr: "13:00",               dist: 495 },
    ],
  },
  // ── 15. Duronto Express ───────────────────────────────────────────────────
  {
    number: "12213", name: "Mumbai Duronto Express", type: "EXPRESS",
    coaches: [
      { prefix: "H", count: 2, className: "AC_FIRST_CLASS", totalSeats: 18 },
      { prefix: "A", count: 4, className: "AC_2TIER",       totalSeats: 46 },
      { prefix: "B", count: 6, className: "AC_3TIER",       totalSeats: 64 },
    ],
    stops: [
      { code: "CSMT", seq: 1,               dep: "17:05", dist: 0    },
      { code: "NGP",  seq: 2, arr: "23:00", dep: "23:05", dist: 835  },
      { code: "GAYA", seq: 3, arr: "08:30", dep: "08:35", dist: 1400 },
      { code: "HWH",  seq: 4, arr: "13:30",               dist: 1700 },
    ],
  },
  // ── 16. Punjab Mail ──────────────────────────────────────────────────────
  {
    number: "12137", name: "Punjab Mail", type: "SUPERFAST",
    coaches: [
      { prefix: "H", count: 1, className: "AC_FIRST_CLASS", totalSeats: 18 },
      { prefix: "A", count: 2, className: "AC_2TIER",       totalSeats: 46 },
      { prefix: "B", count: 4, className: "AC_3TIER",       totalSeats: 64 },
      { prefix: "S", count: 8, className: "SLEEPER",        totalSeats: 72 },
    ],
    stops: [
      { code: "CSMT", seq: 1,                  dep: "19:05", dist: 0    },
      { code: "BPL",  seq: 2, arr: "04:00",    dep: "04:05", dist: 782  },
      { code: "JHS",  seq: 3, arr: "07:30",    dep: "07:35", dist: 1082 },
      { code: "AGC",  seq: 4, arr: "10:30",    dep: "10:35", dist: 1298 },
      { code: "NDLS", seq: 5, arr: "13:30",    dep: "13:35", dist: 1485 },
      { code: "UMB",  seq: 6, arr: "16:00",    dep: "16:05", dist: 1698 },
      { code: "LDH",  seq: 7, arr: "18:00",    dep: "18:05", dist: 1800 },
      { code: "AMR",  seq: 8, arr: "19:50",                  dist: 1875 },
    ],
  },
  // ── 17. Gujarat Express ──────────────────────────────────────────────────
  {
    number: "19019", name: "Gujarat Express", type: "SUPERFAST",
    coaches: [
      { prefix: "H", count: 1, className: "AC_FIRST_CLASS", totalSeats: 18 },
      { prefix: "A", count: 2, className: "AC_2TIER",       totalSeats: 46 },
      { prefix: "B", count: 3, className: "AC_3TIER",       totalSeats: 64 },
      { prefix: "S", count: 5, className: "SLEEPER",        totalSeats: 72 },
    ],
    stops: [
      { code: "PUNE", seq: 1,               dep: "07:00", dist: 0   },
      { code: "SUR",  seq: 2, arr: "12:00", dep: "12:05", dist: 380 },
      { code: "ST",   seq: 3, arr: "13:30", dep: "13:35", dist: 500 },
      { code: "BRC",  seq: 4, arr: "15:30", dep: "15:35", dist: 660 },
      { code: "ADI",  seq: 5, arr: "17:15",               dist: 760 },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Standard Indian railway berth cycle (6 main + 2 side) — same as repository
const BERTH_CYCLE: BerthType[] = [
  BerthType.LOWER, BerthType.MIDDLE, BerthType.UPPER,
  BerthType.LOWER, BerthType.MIDDLE, BerthType.UPPER,
  BerthType.SIDE_LOWER, BerthType.SIDE_UPPER,
];

function generateSeats(totalSeats: number) {
  return Array.from({ length: totalSeats }, (_, i) => ({
    seatNumber: i + 1,
    berthType: BERTH_CYCLE[i % BERTH_CYCLE.length],
  }));
}

async function seedTrain(
  cfg: TrainCfg,
  stationMap: Map<string, string>,
  seatClassMap: Map<SeatClassName, string>,
) {
  const train = await prisma.train.upsert({
    where:  { trainNumber: cfg.number },
    update: { name: cfg.name, type: cfg.type },
    create: { trainNumber: cfg.number, name: cfg.name, type: cfg.type },
  });

  // Only create stops + coaches on first run
  const existingCoaches = await prisma.coach.findMany({ where: { trainId: train.id } });
  if (existingCoaches.length > 0) {
    return train; // already seeded
  }

  // Route stops (delete+create so re-running after clearing coaches is safe)
  await prisma.trainRouteStop.deleteMany({ where: { trainId: train.id } });
  await prisma.trainRouteStop.createMany({
    data: cfg.stops.map(s => {
      const stationId = stationMap.get(s.code);
      if (!stationId) throw new Error(`Station code not found: ${s.code}`);
      return {
        trainId: train.id,
        stationId,
        sequence:     s.seq,
        arrivalTime:  s.arr ?? null,
        departureTime: s.dep ?? null,
        distanceKm:   s.dist,
      };
    }),
  });

  // Coaches + seats
  for (const coachCfg of cfg.coaches) {
    const seatClassId = seatClassMap.get(coachCfg.className);
    if (!seatClassId) throw new Error(`SeatClass not found: ${coachCfg.className}`);

    for (let i = 0; i < coachCfg.count; i++) {
      const coachNumber = `${coachCfg.prefix}${i + 1}`;
      const coach = await prisma.coach.create({
        data: {
          trainId: train.id,
          coachNumber,
          seatClassId,
          totalSeats: coachCfg.totalSeats,
        },
      });
      await prisma.seat.createMany({
        data: generateSeats(coachCfg.totalSeats).map(s => ({ ...s, coachId: coach.id })),
      });
    }
  }

  return train;
}

async function seedSchedules(trainId: string, days: number) {
  const coaches = await prisma.coach.findMany({ where: { trainId } });
  const stops   = await prisma.trainRouteStop.findMany({
    where: { trainId },
    orderBy: { sequence: "asc" },
  });

  let created = 0;
  for (let i = 0; i < days; i++) {
    const journeyDate = new Date();
    journeyDate.setDate(journeyDate.getDate() + i);
    journeyDate.setHours(0, 0, 0, 0);

    const existing = await prisma.trainSchedule.findUnique({
      where: { trainId_journeyDate: { trainId, journeyDate } },
    });
    if (existing) continue;

    const schedule = await prisma.trainSchedule.create({
      data: { trainId, journeyDate, status: ScheduleStatus.SCHEDULED },
    });

    const availabilityRows = [];
    for (const coach of coaches) {
      for (let si = 0; si < stops.length - 1; si++) {
        for (let sj = si + 1; sj < stops.length; sj++) {
          availabilityRows.push({
            scheduleId:    schedule.id,
            coachId:       coach.id,
            fromStationId: stops[si].stationId,
            toStationId:   stops[sj].stationId,
            availableCount: coach.totalSeats,
          });
        }
      }
    }

    await prisma.seatAvailability.createMany({ data: availabilityRows });
    created++;
  }

  return created;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting seed...\n");

  // 1. Seat Classes
  console.log("Seeding seat classes...");
  const seatClasses = await Promise.all([
    prisma.seatClass.upsert({
      where: { name: "SLEEPER" }, update: {},
      create: { name: "SLEEPER", displayName: "Sleeper", priceMultiplier: 1.0 },
    }),
    prisma.seatClass.upsert({
      where: { name: "AC_3TIER" }, update: {},
      create: { name: "AC_3TIER", displayName: "AC 3 Tier", priceMultiplier: 2.0 },
    }),
    prisma.seatClass.upsert({
      where: { name: "AC_2TIER" }, update: {},
      create: { name: "AC_2TIER", displayName: "AC 2 Tier", priceMultiplier: 2.5 },
    }),
    prisma.seatClass.upsert({
      where: { name: "AC_FIRST_CLASS" }, update: {},
      create: { name: "AC_FIRST_CLASS", displayName: "AC First Class", priceMultiplier: 3.5 },
    }),
  ]);
  const seatClassMap = new Map<SeatClassName, string>(
    seatClasses.map(sc => [sc.name, sc.id])
  );
  console.log(`  ✓ ${seatClasses.length} seat classes\n`);

  // 2. Stations
  console.log("Seeding stations...");
  const stationRecords = await Promise.all(
    STATIONS.map(s =>
      prisma.station.upsert({
        where: { code: s.code }, update: {},
        create: s,
      })
    )
  );
  const stationMap = new Map<string, string>(stationRecords.map(s => [s.code, s.id]));
  console.log(`  ✓ ${stationRecords.length} stations\n`);

  // 3. Trains + coaches + route stops
  console.log("Seeding trains (coaches + route stops)...");
  const trainRecords: Array<{ id: string; number: string }> = [];
  for (const cfg of TRAINS) {
    const train = await seedTrain(cfg, stationMap, seatClassMap);
    trainRecords.push({ id: train.id, number: cfg.number });
    console.log(`  ✓ ${cfg.number} ${cfg.name}`);
  }
  console.log();

  // 4. Schedules + SeatAvailability (14 days)
  const SCHEDULE_DAYS = 14;
  console.log(`Seeding ${SCHEDULE_DAYS}-day schedules + SeatAvailability...`);
  for (const t of trainRecords) {
    const created = await seedSchedules(t.id, SCHEDULE_DAYS);
    if (created > 0) {
      console.log(`  ✓ ${t.number}: ${created} new schedules`);
    } else {
      console.log(`  - ${t.number}: schedules already exist`);
    }
  }
  console.log();

  // 5. Users
  console.log("Seeding users...");
  const { hash } = await import("bcrypt");

  await prisma.user.upsert({
    where: { email: "admin@irtc.com" },
    update: {},
    create: {
      email:        "admin@irtc.com",
      passwordHash: await hash("admin123", 12),
      name:         "IRCTC Admin",
      role:         "ADMIN",
    },
  });
  await prisma.user.upsert({
    where: { email: "passenger@test.com" },
    update: {},
    create: {
      email:        "passenger@test.com",
      passwordHash: await hash("test1234", 12),
      name:         "Test Passenger",
      phone:        "9999999999",
      role:         "PASSENGER",
    },
  });
  console.log("  ✓ admin@irtc.com / admin123");
  console.log("  ✓ passenger@test.com / test1234");
  console.log();

  console.log("✅ Seed complete!");
  console.log("\nQuick test pairs:");
  console.log("  NDLS → CSMT  (Mumbai Rajdhani 12951, Punjab Mail 12137)");
  console.log("  NDLS → HWH   (Howrah Rajdhani 12301, Poorva Express 12303)");
  console.log("  NZM  → MAS   (Tamil Nadu Express 12621)");
  console.log("  NDLS → SBC   (Karnataka Express 12627)");
  console.log("  HWH  → MAS   (Coromandel Express 12841)");
  console.log("  CSMT → AMR   (Golden Temple Mail 12903)");
  console.log("  NDLS → TVC   (Kerala Express 12625)");
  console.log("  CSMT → PUNE  (Deccan Queen 12123)");
  console.log("  NDLS → GHY   (North East Express 12505)");
  console.log("  NDLS → ADI   (Rajasthan Express 14311)");
}

main()
  .catch(e => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
