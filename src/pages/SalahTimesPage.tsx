import { useState } from "react";
import salahData from "../data/salah-times.json";
import SEO from "../components/SEO";

export default function SalahTimesPage() {
    const [location, setLocation] = useState("London");

    // Type assertion or simple access
    const times = (salahData.times as any)[location];
    const availableLocations = salahData.locations;

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <SEO title="Salah Times" description="Effective prayer times" />

            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Salah Times</h1>
                <p className="text-gray-500 dark:text-gray-400">{times?.date}</p>
            </div>

            {/* Location Selector */}
            <div className="flex justify-center mb-8">
                <select
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="p-3 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white text-lg"
                >
                    {availableLocations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                    ))}
                </select>
            </div>

            {/* Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-emerald-600 p-4 text-center">
                    <h2 className="text-white text-xl font-bold">{location}</h2>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {times && Object.entries(times).map(([key, value]) => {
                        if (key === 'date') return null;
                        return (
                            <div key={key} className="flex justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750">
                                <span className="capitalize font-medium text-gray-700 dark:text-gray-300">{key}</span>
                                <span className="font-bold text-gray-900 dark:text-emerald-400">
                                    {value as string}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
