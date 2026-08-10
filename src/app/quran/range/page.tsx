import { Suspense } from "react";

import { QuranRangeReader } from "@/components/quran-structure";

export default function Page() {
  return <Suspense fallback={<main><p>Loading Quran range…</p></main>}><QuranRangeReader /></Suspense>;
}
