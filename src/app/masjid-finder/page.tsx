import type { Metadata } from "next";
import MasjidFinderPage from "@/components/masjid-finder-page";
export const metadata:Metadata={title:"Masjid Finder — Find Mosques Near You",description:"Find nearby masjids using community-contributed OpenStreetMap data and open directions in your preferred maps application.",alternates:{canonical:"/masjid-finder"}};
export default function Page(){return <MasjidFinderPage/>}
