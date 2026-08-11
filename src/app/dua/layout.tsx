import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { publicFeatures } from "@/lib/features";

export default function DuaLayout({ children }: { children: ReactNode }) {
  if (!publicFeatures.dua) notFound();
  return children;
}
