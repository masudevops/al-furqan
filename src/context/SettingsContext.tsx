import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface SettingsState {
    reciter: string;
    translation: string;
    setReciter: (id: string) => void;
    setTranslation: (id: string) => void;
}

const SettingsContext = createContext<SettingsState | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    // Load from local storage or default
    const [reciter, setReciter] = useState(() => localStorage.getItem("reciter") || "ar.alafasy");
    const [translation, setTranslation] = useState(() => localStorage.getItem("translation") || "en.sahih");

    // Persist changes
    useEffect(() => {
        localStorage.setItem("reciter", reciter);
    }, [reciter]);

    useEffect(() => {
        localStorage.setItem("translation", translation);
    }, [translation]);

    // Sync logic (optional, if we wanted to sync across tabs)

    return (
        <SettingsContext.Provider value={{ reciter, translation, setReciter, setTranslation }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}
