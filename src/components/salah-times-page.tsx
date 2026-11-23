"use client";

import { useEffect, useMemo, useState } from "react";
import LocationPrompt, { LocationChip } from "./location-prompt";
import { Button, Icon, IconButton, Page, PageHeader } from "@/components/ui";
import { buildPrayerCalendar } from "@/lib/prayer-calendar";
import { getNextPrayer } from "./prayer-times";
import styles from "./salah-times.module.css";

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
const METHODS = [{id:3,name:"Muslim World League"},{id:2,name:"ISNA"},{id:4,name:"Umm al-Qura"},{id:5,name:"Egyptian Authority"},{id:1,name:"Karachi"}];
type Day = { date:string; gregorian:string; hijri:string; timings:Record<string,string> };
type Today = Day & { error:null; timezone:string };
type RamadanDay = { date:string; day:number; dayName:string; fajr:string; hijriDate:string; iftar:string; isha:string; suhoorEnds:string };
type RamadanPayload = { calculationMethod:string; days:RamadanDay[]; end:string; error:null; hijriYear:number; madhab:string; start:string; timezone:string; year:number };
type HijriPayload = { error:string|null; formatted?:string };

function SalahContent({ location }: { location: { latitude:number; longitude:number; label:string } }) {
  const [today,setToday]=useState<Today|null>(null); const [days,setDays]=useState<Day[]>([]); const [error,setError]=useState<string|null>(null);
  const [method,setMethod]=useState(2); const [school,setSchool]=useState(0); const [highLatitude,setHighLatitude]=useState("0"); const [tick,setTick]=useState(Date.now());
  const [monthDate,setMonthDate]=useState(()=>new Date());
  const [ramadanYear,setRamadanYear]=useState(()=>new Date().getFullYear()); const [ramadan,setRamadan]=useState<RamadanPayload|null>(null); const [ramadanError,setRamadanError]=useState<string|null>(null);
  const [hijriAdjustment,setHijriAdjustment]=useState(0); const [adjustedHijri,setAdjustedHijri]=useState<string|null>(null);
  useEffect(()=>{setMethod(Number(localStorage.getItem("af-prayer-method"))||2);setSchool(Number(localStorage.getItem("af-prayer-school"))||0);setHighLatitude(localStorage.getItem("af-prayer-high-latitude")||"0");setHijriAdjustment(Math.max(-2,Math.min(2,Number(localStorage.getItem("af-hijri-adjustment"))||0)))},[]);
  useEffect(()=>{const id=setInterval(()=>setTick(Date.now()),1000);return()=>clearInterval(id)},[]);
  useEffect(()=>{
    const base={latitude:String(location.latitude),longitude:String(location.longitude),method:String(method),school:String(school),highLatitude};
    const daily=new URLSearchParams(base); const monthly=new URLSearchParams({...base,month:String(monthDate.getMonth()+1),year:String(monthDate.getFullYear())});
    setError(null);
    Promise.all([fetch(`/api/prayer-times?${daily}`),fetch(`/api/prayer-times?${monthly}`)]).then(async([a,b])=>{
      const [dailyData,monthlyData]=await Promise.all([a.json(),b.json()]); if(!a.ok||!b.ok) throw new Error(dailyData.error??monthlyData.error);
      setToday(dailyData);setDays(monthlyData.days??[]);
    }).catch(reason=>setError(reason instanceof Error?reason.message:"Salah times are unavailable."));
  },[location,method,school,highLatitude,monthDate]);
  // Ramadan times must use the location's own timezone (from the daily source), not the browser's; otherwise a city in
  // another timezone shows shifted Suhoor and Iftar times.
  const locationTimezone=today?.timezone;
  useEffect(()=>{if(!locationTimezone)return;const params=new URLSearchParams({latitude:String(location.latitude),longitude:String(location.longitude),year:String(ramadanYear),method:String(method),school:String(school),highLatitude:highLatitude==="0"?"recommended":highLatitude==="1"?"MiddleOfNight":highLatitude==="2"?"SeventhOfNight":"TwilightAngle",timezone:locationTimezone});setRamadanError(null);fetch(`/api/ramadan?${params}`).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);setRamadan(data)}).catch(reason=>{setRamadan(null);setRamadanError(reason instanceof Error?reason.message:"Ramadan timetable is unavailable.")})},[location,method,school,highLatitude,ramadanYear,locationTimezone]);
  useEffect(()=>{const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()+hijriAdjustment);const key=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;fetch(`/api/hijri-date?date=${key}`).then(async response=>{const data:HijriPayload=await response.json();if(!response.ok||!data.formatted)throw new Error(data.error??"Hijri date unavailable");setAdjustedHijri(data.formatted)}).catch(()=>setAdjustedHijri(null))},[hijriAdjustment]);
  const next=useMemo(()=>getNextPrayer(today,new Date(tick)),[today,tick]);
  const countdown=next?`${String(Math.floor(next.ms/3_600_000)).padStart(2,"0")}:${String(Math.floor(next.ms%3_600_000/60_000)).padStart(2,"0")}:${String(Math.floor(next.ms%60_000/1000)).padStart(2,"0")}`:"--:--:--";
  const update=(kind:"method"|"school",value:number)=>{localStorage.setItem(`af-prayer-${kind}`,String(value));kind==="method"?setMethod(value):setSchool(value)};
  const updateHighLatitude=(value:string)=>{localStorage.setItem("af-prayer-high-latitude",value);setHighLatitude(value)};
  const updateHijriAdjustment=(value:number)=>{localStorage.setItem("af-hijri-adjustment",String(value));setHijriAdjustment(value)};
  const progress=useMemo(()=>prayerProgress(today,next,new Date(tick)),[today,next,tick]);
  return <>
    <section className={styles.nextCard} aria-labelledby="next-prayer">
      <div className={styles.nextMain}>
        <p className={styles.nextLabel}>Next prayer</p>
        <h2 id="next-prayer">{next?.name??"Salah Times"}</h2>
        <p className={styles.nextMeta}>{[today?.date,adjustedHijri??today?.hijri,hijriAdjustment!==0?`Hijri ${hijriAdjustment>0?"+":""}${hijriAdjustment} day${Math.abs(hijriAdjustment)===1?"":"s"}`:null].filter(Boolean).join(" · ")}</p>
      </div>
      <div className={styles.countdownBlock}>
        <span className={styles.countdown} aria-live="off">{countdown}</span>
        <span className={styles.countdownLabel}>{next?`until ${next.name}${today?.timings[next.name]?` · ${clockTime(today.timings[next.name])}`:""}`:"Loading…"}</span>
      </div>
      <span className={styles.progress} aria-hidden="true"><i style={{width:`${Math.round(progress*100)}%`}}/></span>
    </section>
    {today?<section className={styles.timeline} aria-label="Today's five prayer times">{PRAYERS.map(name=><div className={next?.name===name?styles.activePrayer:""} aria-current={next?.name===name?"true":undefined} key={name}><Icon name={name==="Fajr"||name==="Isha"||name==="Maghrib"?"moon":"sun"}/><span>{name}</span><strong>{clockTime(today.timings[name])}</strong>{name==="Fajr"&&today.timings.Sunrise?<small>Sunrise {clockTime(today.timings.Sunrise)}</small>:null}</div>)}</section>:<div className={styles.timelineLoading} role="status" aria-label="Loading prayer times"><i/><i/><i/><i/><i/></div>}
    {error?<p className={styles.errorText} role="alert">{error}</p>:null}
    <CalendarReminders location={location} method={method} school={school} highLatitude={highLatitude} timezone={today?.timezone}/>
    <details className={styles.panel}>
      <summary><span><strong>Calculation settings</strong><small>{METHODS.find(item=>item.id===method)?.name??"Method"} · {school===1?"Hanafi":"Shafi"} Asr{today?.timezone?` · ${today.timezone}`:""}</small></span><Icon name="chevron"/></summary>
      <div className={styles.settingGrid}>
        <label>Method<select value={method} onChange={e=>update("method",Number(e.target.value))}>{METHODS.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label>Asr school<select value={school} onChange={e=>update("school",Number(e.target.value))}><option value={0}>Shafi</option><option value={1}>Hanafi</option></select></label>
        <label>High-latitude adjustment<select value={highLatitude} onChange={e=>updateHighLatitude(e.target.value)}><option value="0">Automatic / standard</option><option value="1">Middle of the night</option><option value="2">One-seventh of the night</option><option value="3">Twilight angle</option></select></label>
        <label>Hijri date adjustment<select value={hijriAdjustment} onChange={e=>updateHijriAdjustment(Number(e.target.value))}><option value={-2}>−2 days</option><option value={-1}>−1 day</option><option value={0}>No adjustment</option><option value={1}>+1 day</option><option value={2}>+2 days</option></select></label>
      </div>
      <p className={styles.sourceNote}>High-latitude adjustments affect Fajr and Isha where twilight may not occur normally. The Hijri adjustment changes only the displayed date so it can match your local moon-sighting authority. Calculated times may differ from your local mosque timetable. Daily and monthly source: AlAdhan.</p>
    </details>
    <section className={styles.panel} aria-labelledby="month-title">
      <div className={styles.panelHead}><h2 id="month-title">Monthly calendar</h2><div className={styles.stepper}><IconButton icon="back" label="Previous month" onClick={()=>setMonthDate(value=>new Date(value.getFullYear(),value.getMonth()-1,1))}/><strong>{monthDate.toLocaleDateString(undefined,{month:"long",year:"numeric"})}</strong><IconButton icon="arrowRight" label="Next month" onClick={()=>setMonthDate(value=>new Date(value.getFullYear(),value.getMonth()+1,1))}/></div></div>
      <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Date</th>{PRAYERS.map(name=><th key={name}>{name}</th>)}</tr></thead><tbody>{days.map(day=><tr key={day.gregorian} className={day.gregorian===today?.gregorian?styles.today:""} aria-current={day.gregorian===today?.gregorian?"date":undefined}><td>{day.date}<small>{day.hijri}</small></td>{PRAYERS.map(name=><td key={name}>{clockTime(day.timings[name])}</td>)}</tr>)}</tbody></table></div>
    </section>
    <section className={styles.panel} aria-labelledby="ramadan-title">
      <div className={styles.panelHead}><div><h2 id="ramadan-title">Ramadan timetable</h2>{ramadan?<p className={styles.panelSubtitle}>{ramadan.start}–{ramadan.end} · {ramadan.hijriYear} AH</p>:null}</div><div className={styles.stepper}><IconButton icon="back" label="Previous Ramadan year" onClick={()=>setRamadanYear(value=>value-1)}/><strong>{ramadanYear}</strong><IconButton icon="arrowRight" label="Next Ramadan year" onClick={()=>setRamadanYear(value=>value+1)}/></div></div>
      {ramadanError?<p className={styles.errorText} role="alert">{ramadanError}</p>:null}
      {ramadan?<div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Day</th><th>Date</th><th>Suhoor ends</th><th>Fajr</th><th>Iftar</th><th>Isha</th></tr></thead><tbody>{ramadan.days.map(day=><tr key={day.date}><td>{day.day}<small>{day.hijriDate}</small></td><td>{day.dayName}<small>{day.date}</small></td><td>{day.suhoorEnds}</td><td>{day.fajr}</td><td>{day.iftar}</td><td>{day.isha}</td></tr>)}</tbody></table></div>:null}
      <p className={styles.sourceNote}>Ramadan dates and times are calculated and may differ from local moon-sighting decisions and mosque timetables.</p>
    </section>
  </>;
}

const REMINDER_DAYS=30;
// Reminders come from the device calendar: the next 30 days of prayer times are downloaded as an .ics file
// with an alert at each prayer. Nothing is stored on a server and no notification permission is needed.
function CalendarReminders({location,method,school,highLatitude,timezone}:{location:{latitude:number;longitude:number;label:string};method:number;school:number;highLatitude:string;timezone?:string}){
  const [status,setStatus]=useState<{kind:"idle"|"busy"|"done"|"error";message?:string}>({kind:"idle"});
  const download=async()=>{
    if(!timezone)return;
    setStatus({kind:"busy"});
    try{
      const now=new Date();
      const months=[0,1].map(offset=>new Date(now.getFullYear(),now.getMonth()+offset,1));
      const responses=await Promise.all(months.map(month=>fetch(`/api/prayer-times?${new URLSearchParams({latitude:String(location.latitude),longitude:String(location.longitude),method:String(method),school:String(school),highLatitude,month:String(month.getMonth()+1),year:String(month.getFullYear())})}`).then(async response=>{const value=await response.json();if(!response.ok)throw new Error(value.error??"Prayer times are unavailable.");return value.days as Day[];})));
      const settings=`${METHODS.find(item=>item.id===method)?.name??"Calculated"} method, ${school===1?"Hanafi":"Shafi"} Asr`;
      const {ics,events}=buildPrayerCalendar({days:responses.flat(),timezone,label:location.label,settings,from:now,count:REMINDER_DAYS,now});
      const url=URL.createObjectURL(new Blob([ics],{type:"text/calendar;charset=utf-8"}));
      const link=document.createElement("a");link.href=url;link.download="al-furqan-prayer-times.ics";document.body.append(link);link.click();link.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),1000);
      setStatus({kind:"done",message:`${events} prayer times saved to a calendar file. Open it to add them to your calendar.`});
    }catch(error){setStatus({kind:"error",message:error instanceof Error?error.message:"Prayer times are unavailable right now."});}
  };
  return <section className={`${styles.panel} ${styles.reminders}`} aria-labelledby="reminders-title">
    <div className={styles.remindersText}><h2 id="reminders-title">Prayer reminders</h2><p>Add the next {REMINDER_DAYS} days of prayer times to your phone or computer calendar, with an alert at each prayer. Works offline; download again next month or after changing settings.</p></div>
    <Button variant="primary" icon="calendar" onClick={()=>void download()} disabled={!timezone||status.kind==="busy"}>{status.kind==="busy"?"Preparing…":"Add to calendar"}</Button>
    {status.message?<p className={status.kind==="error"?styles.errorText:styles.sourceNote} role="status">{status.message}</p>:null}
  </section>;
}

export default function SalahTimesPage(){return <Page><LocationPrompt header={(location,controls)=><PageHeader kicker="Daily worship" kickerIcon="salah" title="Salah Times" description="Your next prayer, today's schedule, and a monthly view for your location." actions={location?<LocationChip label={location.label} onChange={controls.clear}/>:undefined}/>}>{location=><SalahContent location={location}/>}</LocationPrompt></Page>}

// The source appends the zone abbreviation, e.g. "05:20 (GMT)"; the zone is already shown in the settings summary.
export const clockTime=(value:string|undefined)=>(value??"").replace(/\s*\(.+\)$/,"");

// How far we are between the previous prayer and the next one, for the progress bar.
export function prayerProgress(today:{timings:Record<string,string>}|null,next:{name:string;ms:number}|null,now:Date){
  if(!today||!next) return 0;
  const minutes=(value:string)=>{const [h,m]=value.replace(/\s*\(.+\)$/,"").split(":").map(Number);return h*60+m};
  const index=PRAYERS.indexOf(next.name as typeof PRAYERS[number]);
  const previous=index>0?PRAYERS[index-1]:"Isha";
  const nowMinutes=now.getHours()*60+now.getMinutes()+now.getSeconds()/60;
  let start=minutes(today.timings[previous]); const end=nowMinutes+next.ms/60000;
  if(start>nowMinutes) start-=24*60;
  return end>start?Math.min(1,Math.max(0,(nowMinutes-start)/(end-start))):0;
}
