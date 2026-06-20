import { useState, useEffect } from "react";
import { FaTimes, FaCog, FaMicrophone, FaBookOpen, FaSpinner } from "react-icons/fa";
import { useSettings } from "../context/SettingsContext";
import { fetchEditions, type Edition } from "../services/quranService";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { reciter, translation, setReciter, setTranslation } = useSettings();

    const [audioEditions, setAudioEditions] = useState<Edition[]>([]);
    const [textEditions, setTextEditions] = useState<Edition[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && audioEditions.length === 0) {
            loadEditions();
        }
    }, [isOpen]);

    const loadEditions = async () => {
        setLoading(true);
        try {
            // Fetch both in parallel
            const [audio, text] = await Promise.all([
                fetchEditions("audio", "versebyverse"), // versebyverse is standard for playback
                fetchEditions("text", "translation")
            ]);

            // Filter audio to only Arabic ones mostly or just sort
            // The API returns MANY. Let's filter for quality or just take all.
            // For now, let's just use the result.
            setAudioEditions(audio);

            // Filter texts to English/major languages to avoid 100s?
            // Or just let user scroll. Sort by language.
            const sortedText = text.sort((a, b) => a.language.localeCompare(b.language));
            setTextEditions(sortedText);
        } catch (e) {
            console.error("Failed to load editions", e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn p-4" onClick={onClose}>
            <div
                className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <FaCog size={18} />
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Settings</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <FaSpinner className="animate-spin text-emerald-500 text-2xl" />
                        </div>
                    ) : (
                        <>
                            {/* Reciter Selection */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <FaMicrophone className="text-emerald-500" /> Preferred Reciter
                                </label>
                                <select
                                    value={reciter}
                                    onChange={(e) => setReciter(e.target.value)}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                >
                                    <option value="ar.alafasy">Mishary Rashid Alafasy (Default)</option>
                                    {/* Fallback hardcoded popular ones if API list is overwhelming or empty */}
                                    {!audioEditions.find(e => e.identifier === "ar.alafasy") && (
                                        <>
                                            <option value="ar.sudais">Abdur-Rahman as-Sudais</option>
                                            <option value="ar.abdulbasitmurattal">Abdul Basit</option>
                                        </>
                                    )}
                                    {audioEditions.map(ed => (
                                        <option key={ed.identifier} value={ed.identifier}>
                                            {ed.englishName} ({ed.language})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Changes apply to all Surahs.</p>
                            </div>

                            {/* Translation Selection */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <FaBookOpen className="text-blue-500" /> Translation
                                </label>
                                <select
                                    value={translation}
                                    onChange={(e) => setTranslation(e.target.value)}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                >
                                    <option value="en.sahih">Saheeh International (Default)</option>
                                    {textEditions.map(ed => (
                                        <option key={ed.identifier} value={ed.identifier}>
                                            {ed.englishName} ({ed.language.toUpperCase()})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Save & Close
                    </button>
                </div>
            </div>
        </div>
    );
}
