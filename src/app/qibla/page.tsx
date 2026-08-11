import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QiblaPage from "@/components/qibla-page";
import { publicFeatures } from "@/lib/features";
export const metadata:Metadata={title:"Qibla Finder — Find the Direction of the Kaaba",description:"Find the Qibla direction from your location with a compass-style display and a numeric bearing from North.",alternates:{canonical:"/qibla"}};
export default function Page(){if(!publicFeatures.qibla)notFound();return <QiblaPage/>}
