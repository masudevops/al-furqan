import type { Metadata } from "next";
import SavedLibrary from "@/components/saved-library";

export const metadata: Metadata = { title: "Saved Library", description: "Open Quran, Sunnah, and Dua bookmarks saved privately on this device.", robots: { index: false, follow: true } };
export default function LibraryPage() { return <SavedLibrary/>; }
