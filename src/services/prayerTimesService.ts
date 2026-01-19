// Al-Furqan - Prayer Times Service (API-based)
// Provides prayer times from aladhan.com API

const ALADHAN_API_BASE = "https://api.aladhan.com/v1";

export interface PrayerTimings {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
    Imsak: string;
    Midnight: string;
    Firstthird: string;
    Lastthird: string;
}

export interface PrayerTimesData {
    timings: PrayerTimings;
    date: {
        readable: string;
        timestamp: string;
        gregorian: {
            date: string;
            day: string;
            weekday: { en: string };
            month: { en: string; number: number };
            year: string;
        };
        hijri: {
            date: string;
            day: string;
            weekday: { en: string; ar: string };
            month: { en: string; ar: string; number: number };
            year: string;
        };
    };
    meta: {
        latitude: number;
        longitude: number;
        timezone: string;
        method: {
            id: number;
            name: string;
        };
    };
}

export interface PrayerTimesResponse {
    code: number;
    status: string;
    data: PrayerTimesData;
}

export async function fetchPrayerTimes(
    city: string,
    country: string = "UK",
    method: number = 2 // Islamic Society of North America
): Promise<PrayerTimesData | null> {
    try {
        const url = `${ALADHAN_API_BASE}/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;

        console.log(`Fetching prayer times for ${city}, ${country} from: ${url}`);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch prayer times`);
        }

        const json: PrayerTimesResponse = await response.json();
        return json.data;
    } catch (error) {
        console.error("Error fetching prayer times:", error);
        return null;
    }
}

// Available calculation methods
export const CALCULATION_METHODS = [
    { id: 1, name: "University of Islamic Sciences, Karachi" },
    { id: 2, name: "Islamic Society of North America (ISNA)" },
    { id: 3, name: "Muslim World League (MWL)" },
    { id: 4, name: "Umm al-Qura University, Makkah" },
    { id: 5, name: "Egyptian General Authority of Survey" },
    { id: 7, name: "Institute of Geophysics, University of Tehran" },
    { id: 8, name: "Gulf Region" },
    { id: 9, name: "Kuwait" },
    { id: 10, name: "Qatar" },
    { id: 11, name: "Majlis Ugama Islam Singapura, Singapore" },
    { id: 12, name: "Union des Organisations Islamiques de France" },
    { id: 13, name: "Diyanet İşleri Başkanlığı, Turkey" },
    { id: 14, name: "Spiritual Administration of Muslims of Russia" }
];
