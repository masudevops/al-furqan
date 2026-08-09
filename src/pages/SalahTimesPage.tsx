import { useState, useEffect } from "react";
import SEO from "../components/SEO";
import { fetchPrayerTimes, type PrayerTimesData, CALCULATION_METHODS } from "../services/prayerTimesService";
import { FaClock, FaMapMarkerAlt, FaCalendarAlt, FaCog } from "react-icons/fa";

export default function SalahTimesPage() {
    const [city, setCity] = useState("London");
    const [country, setCountry] = useState("UK");
    const [method, setMethod] = useState(3); // Default to MWL
    const [prayerData, setPrayerData] = useState<PrayerTimesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        loadPrayerTimes();
    }, [city, country, method]);

    const loadPrayerTimes = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchPrayerTimes(city, country, method);
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
                        fetchPrayerTimesByCoords(latitude, longitude, method),
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
            </div>

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
                </div>
            )}

            {loading ? (
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
            )}

            {/* Footer Note */}
            <p className="mt-12 text-center text-gray-400 text-xs tracking-wide">
                Timings provided by Aladhan.com for educational and awareness purposes.
            </p>
        </div>
    );
}
