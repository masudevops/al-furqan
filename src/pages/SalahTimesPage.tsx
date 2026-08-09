import { useState, useEffect, useMemo, useRef } from "react";
import SEO from "../components/SEO";
import { fetchPrayerTimes, fetchMonthlyPrayerTimes, type PrayerTimesData, CALCULATION_METHODS } from "../services/prayerTimesService";
import { FaClock, FaMapMarkerAlt, FaCalendarAlt, FaCog } from "react-icons/fa";

export default function SalahTimesPage() {
    const [city, setCity] = useState("London");
    const [country, setCountry] = useState("UK");
    const [method, setMethod] = useState(3); // Default to MWL
    const [school, setSchool] = useState<0 | 1>(0);
    const [prayerData, setPrayerData] = useState<PrayerTimesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [monthly, setMonthly] = useState<PrayerTimesData[]>([]);
    const [view, setView] = useState<"today" | "month">("today");
    const [now, setNow] = useState(() => new Date());
    const [adhanPrayers, setAdhanPrayers] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem("alFurqan.adhanPrayers") || "[]"); } catch { return []; } });
    const notifiedRef = useRef("");

    useEffect(() => {
        loadPrayerTimes();
    }, [city, country, method, school]);

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 30_000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => { localStorage.setItem("alFurqan.adhanPrayers", JSON.stringify(adhanPrayers)); }, [adhanPrayers]);

    useEffect(() => {
        if (!prayerData) return;
        const current = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const prayer = prayerOrder.find((name) => adhanPrayers.includes(name) && String((prayerData.timings as unknown as Record<string, string>)[name]).startsWith(current));
        const eventKey = `${prayerData.date.gregorian.date}:${prayer || ""}:${current}`;
        if (!prayer || notifiedRef.current === eventKey) return;
        notifiedRef.current = eventKey;
        if (Notification.permission === "granted") new Notification(`${prayer} prayer time`, { body: `${prayer} is at ${current} in ${city}.` });
        void new Audio("https://cdn.aladhan.com/audio/adhans/a9.mp3").play().catch(() => undefined);
    }, [now, prayerData, adhanPrayers, city]);

    useEffect(() => {
        if (view !== "month") return;
        void fetchMonthlyPrayerTimes(city, country, now.getFullYear(), now.getMonth() + 1, method, school)
            .then(setMonthly)
            .catch(() => setError("Could not load the monthly calendar."));
    }, [view, city, country, method, school, now]);

    const loadPrayerTimes = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchPrayerTimes(city, country, method, school);
            if (data) {
                setPrayerData(data);
            } else {
                setError("Could not retrieve prayer times for this location.");
            }
        } catch (err) {
            setError("An error occurred while fetching prayer times.");
        } finally {
            setLoading(false);
        }
    };

    const handleLocationChange = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setCity(formData.get('city') as string);
        setCountry(formData.get('country') as string);
    };

    const detectLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const { fetchPrayerTimesByCoords, reverseGeocode } = await import("../services/prayerTimesService");

                    // Fetch both in parallel
                    const [prayerData, geoResult] = await Promise.all([
                        fetchPrayerTimesByCoords(latitude, longitude, method, school),
                        reverseGeocode(latitude, longitude)
                    ]);

                    if (prayerData) {
                        setPrayerData(prayerData);
                        if (geoResult) {
                            setCity(geoResult.city);
                            setCountry(geoResult.country);
                        } else {
                            setCity(`Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`);
                            setCountry("");
                        }
                    } else {
                        setError("Could not retrieve prayer times for your current position.");
                    }
                } catch (err) {
                    setError("Failed to fetch timings for your position.");
                } finally {
                    setLoading(false);
                }
            },
            () => {
                setError("Unable to retrieve your location. Please check your permissions.");
                setLoading(false);
            }
        );
    };

    const prayerOrder = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const nextPrayer = useMemo(() => {
        if (!prayerData) return null;
        const candidates = prayerOrder.filter((name) => name !== "Sunrise").map((name) => {
            const [hours, minutes] = String((prayerData.timings as unknown as Record<string, string>)[name]).split(":").map(Number);
            const at = new Date(now); at.setHours(hours, minutes, 0, 0);
            return { name, at };
        });
        const upcoming = candidates.find((item) => item.at.getTime() > now.getTime());
        if (!upcoming) return { name: "Fajr", seconds: 0, tomorrow: true };
        return { name: upcoming.name, seconds: Math.max(0, Math.floor((upcoming.at.getTime() - now.getTime()) / 1000)), tomorrow: false };
    }, [prayerData, now]);
    const ramadanCountdown = useMemo(() => {
        if (!prayerData || prayerData.date.hijri.month.number !== 9) return null;
        const targetName = now.getHours() < 12 ? "Fajr" : "Maghrib";
        const [hours, minutes] = String((prayerData.timings as unknown as Record<string, string>)[targetName]).split(":").map(Number);
        const target = new Date(now); target.setHours(hours, minutes, 0, 0);
        if (target <= now) return null;
        const seconds = Math.floor((target.getTime() - now.getTime()) / 1000);
        return { label: targetName === "Fajr" ? "Sehri ends" : "Iftar", hours: Math.floor(seconds / 3600), minutes: Math.floor((seconds % 3600) / 60) };
    }, [prayerData, now]);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <SEO title="Prayer Times" description="Accurate Islamic prayer times based on your location" />

            {/* Header */}
            <div className="text-center mb-10">
                <div className="flex justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                    <FaClock size={48} />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Prayer Times</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                    Daily prayer timings for your location
                </p>
                {nextPrayer && <p className="mt-4 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100">Next: {nextPrayer.name}{nextPrayer.tomorrow ? " tomorrow" : ` in ${Math.floor(nextPrayer.seconds / 3600)}h ${Math.floor((nextPrayer.seconds % 3600) / 60)}m`}</p>}
                {ramadanCountdown && <p className="mx-auto mt-3 w-fit rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-950 dark:bg-amber-200/10 dark:text-amber-100">{ramadanCountdown.label} in {ramadanCountdown.hours}h {ramadanCountdown.minutes}m</p>}
            </div>

            <div className="mb-6 flex justify-center gap-2" role="tablist" aria-label="Prayer schedule view"><button role="tab" aria-selected={view === "today"} onClick={() => setView("today")} className={`rounded-full px-5 py-2 text-sm font-semibold ${view === "today" ? "bg-emerald-700 text-white" : "border border-stone-300"}`}>Today</button><button role="tab" aria-selected={view === "month"} onClick={() => setView("month")} className={`rounded-full px-5 py-2 text-sm font-semibold ${view === "month" ? "bg-emerald-700 text-white" : "border border-stone-300"}`}>Monthly calendar</button></div>

            {/* Location & Settings Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Search Form */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <form onSubmit={handleLocationChange} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">City</label>
                            <input
                                name="city"
                                key={`city-${city}`} // Add key to force re-render when city changes via geolocation
                                defaultValue={city}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                                placeholder="e.g. London"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Country</label>
                            <input
                                name="country"
                                key={`country-${country}`} // Add key to force re-render when country changes
                                defaultValue={country}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                                placeholder="e.g. UK"
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold text-sm shadow-sm"
                            >
                                Search City
                            </button>
                            <button
                                type="button"
                                onClick={detectLocation}
                                className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all font-semibold text-sm flex items-center justify-center gap-2 border border-emerald-100 dark:border-emerald-800 shadow-sm"
                                title="Use my current location"
                            >
                                <FaMapMarkerAlt />
                                <span className="hidden sm:inline">Auto-detect</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Quick Info / Settings Toggle */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <FaMapMarkerAlt />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Current Location</p>
                                <p className="font-bold text-gray-900 dark:text-gray-100">{city}, {country}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-3 rounded-xl transition-all ${showSettings ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                        >
                            <FaCog />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calculation Method Selection (Collapsible) */}
            {showSettings && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-emerald-100 dark:border-emerald-900/30 mb-8 animate-in slide-in-from-top duration-300">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <FaCog className="text-emerald-600" /> Calculation Settings
                    </h3>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Calculation Method</label>
                        <select
                            value={method}
                            onChange={(e) => setMethod(parseInt(e.target.value))}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        >
                            {CALCULATION_METHODS.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Asr juristic method</label>
                        <select value={school} onChange={(event) => setSchool(Number(event.target.value) as 0 | 1)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl">
                            <option value={0}>Standard (Shafi‘i, Maliki, Hanbali)</option>
                            <option value={1}>Hanafi</option>
                        </select>
                    </div>
                    <fieldset className="mt-5"><legend className="text-sm font-semibold text-gray-700 dark:text-gray-300">Adhan while Al-Furqan is running</legend><p className="mt-1 text-xs text-gray-500">Browser scheduling cannot be guaranteed after the app is fully closed.</p><div className="mt-3 flex flex-wrap gap-3">{["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((name) => <label key={name} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={adhanPrayers.includes(name)} onChange={async (event) => { if (event.target.checked && "Notification" in window && Notification.permission === "default") await Notification.requestPermission(); setAdhanPrayers((current) => event.target.checked ? [...new Set([...current, name])] : current.filter((item) => item !== name)); }} className="h-4 w-4 accent-emerald-600" />{name}</label>)}</div><button type="button" onClick={() => void new Audio("https://cdn.aladhan.com/audio/adhans/a9.mp3").play()} className="secondary-action mt-4 !min-h-10 !px-4 !py-2">Preview adhan</button></fieldset>
                </div>
            )}

            {view === "month" && (
                <div className="mb-8 overflow-x-auto rounded-2xl border border-stone-200 bg-white dark:border-white/10 dark:bg-white/5">
                    <table className="w-full min-w-[680px] text-sm"><caption className="p-5 text-left text-xl font-bold">{now.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</caption><thead className="bg-stone-100 dark:bg-white/5"><tr>{["Date", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"].map((label) => <th key={label} scope="col" className="px-4 py-3 text-left">{label}</th>)}</tr></thead><tbody>{monthly.map((day) => <tr key={day.date.gregorian.date} className="border-t border-stone-100 dark:border-white/5"><th scope="row" className="px-4 py-3 text-left font-medium">{day.date.gregorian.day} {day.date.gregorian.weekday.en.slice(0, 3)}</th>{prayerOrder.map((name) => <td key={name} className="px-4 py-3 tabular-nums">{(day.timings as unknown as Record<string, string>)[name]}</td>)}</tr>)}</tbody></table>
                </div>
            )}

            {view === "today" && (loading ? (
                <div className="py-20 flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                    <p className="mt-4 text-gray-500">Retrieving timings...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-8 rounded-2xl border border-red-100 dark:border-red-900/30 text-center shadow-sm">
                    <p className="font-bold text-lg mb-2">Location Not Found</p>
                    <p>{error}</p>
                </div>
            ) : prayerData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Main Timings Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
                            <h2 className="font-bold text-xl flex items-center gap-2">
                                <FaClock /> Today's Timings
                            </h2>
                            <div className="text-xs bg-white/20 px-2 py-1 rounded backdrop-blur-sm">
                                {prayerData.meta.method.name}
                            </div>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {prayerOrder.map((name) => (
                                <div key={name} className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                    <span className="font-bold text-gray-700 dark:text-gray-300 text-lg">{name}</span>
                                    <span className="font-black text-2xl text-emerald-600 dark:text-emerald-400 tracking-tight">
                                        {(prayerData.timings as any)[name]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Date & Additional Info */}
                    <div className="space-y-6">
                        {/* Dates Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                <FaCalendarAlt className="text-emerald-600" /> Current Date
                            </h3>
                            <div className="mb-4">
                                <p className="text-3xl font-black text-gray-900 dark:text-gray-100 leading-tight">
                                    {prayerData.date.readable}
                                </p>
                                <p className="text-lg text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                                    {prayerData.date.gregorian.weekday.en}
                                </p>
                            </div>
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-sm text-gray-500 mb-1">Hijri Date</p>
                                <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                    {prayerData.date.hijri.day} {prayerData.date.hijri.month.en} {prayerData.date.hijri.year} AH
                                </p>
                            </div>
                        </div>

                        {/* Location Details Card */}
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-8 border border-emerald-100 dark:border-emerald-900/30">
                            <h3 className="text-emerald-800 dark:text-emerald-400 text-xs font-black uppercase tracking-widest mb-4">
                                Network Details
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-emerald-700/60 dark:text-emerald-400/60">Timezone</span>
                                    <span className="font-bold text-emerald-900 dark:text-emerald-200">{prayerData.meta.timezone}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-emerald-700/60 dark:text-emerald-400/60">Latitude</span>
                                    <span className="font-bold text-emerald-900 dark:text-emerald-200">{prayerData.meta.latitude}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-emerald-700/60 dark:text-emerald-400/60">Longitude</span>
                                    <span className="font-bold text-emerald-900 dark:text-emerald-200">{prayerData.meta.longitude}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Footer Note */}
            <p className="mt-12 text-center text-gray-400 text-xs tracking-wide">
                Timings provided by Aladhan.com for educational and awareness purposes.
            </p>
        </div>
    );
}
