import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface SettingsState {
    reciter: string;
    translation: string;
    setReciter: (id: string) => void;
    setTranslation: (id: string) => void;
    uiLanguage: "en" | "ar";
    setUiLanguage: (language: "en" | "ar") => void;
    readableFont: boolean;
    setReadableFont: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsState | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    // Load from local storage or default
    const [reciter, setReciter] = useState(() => localStorage.getItem("reciter") || "ar.alafasy");
    const [translation, setTranslation] = useState(() => localStorage.getItem("translation") || "en.sahih");
    const [uiLanguage, setUiLanguage] = useState<"en" | "ar">(() => localStorage.getItem("uiLanguage") === "ar" ? "ar" : "en");
    const [readableFont, setReadableFont] = useState(() => localStorage.getItem("readableFont") === "true");

    // Persist changes
    useEffect(() => {
        localStorage.setItem("reciter", reciter);
    }, [reciter]);

    useEffect(() => {
        localStorage.setItem("translation", translation);
    }, [translation]);

    useEffect(() => {
        localStorage.setItem("uiLanguage", uiLanguage);
        document.documentElement.lang = uiLanguage;
        document.documentElement.dir = uiLanguage === "ar" ? "rtl" : "ltr";
    }, [uiLanguage]);

    useEffect(() => {
        localStorage.setItem("readableFont", String(readableFont));
        document.documentElement.classList.toggle("readable-font", readableFont);
    }, [readableFont]);

    // Sync logic (optional, if we wanted to sync across tabs)

    return (
        <SettingsContext.Provider value={{ reciter, translation, setReciter, setTranslation, uiLanguage, setUiLanguage, readableFont, setReadableFont }}>
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
