import type { Metadata } from "next";
import SalahTimesPage from "@/components/salah-times-page";
export const metadata:Metadata={title:"Salah Times — Daily Prayer Schedule & Calendar",description:"See Fajr, Dhuhr, Asr, Maghrib and Isha times, the next-prayer countdown, calculation settings and monthly prayer calendar.",alternates:{canonical:"/salah-times"}};
export default function Page(){return <SalahTimesPage/>}
