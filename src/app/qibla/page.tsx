import type { Metadata } from "next";
import QiblaPage from "@/components/qibla-page";
export const metadata:Metadata={title:"Qibla Finder — Find the Direction of the Kaaba",description:"Find the Qibla direction from your location with a compass-style display and a numeric bearing from North.",alternates:{canonical:"/qibla"}};
export default function Page(){return <QiblaPage/>}
