"use client";

import { useEffect, useMemo, useState } from "react";
import LocationPrompt from "./location-prompt";
import { getNextPrayer } from "./prayer-times";
import styles from "./feature-pages.module.css";

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
  useEffect(()=>{const params=new URLSearchParams({latitude:String(location.latitude),longitude:String(location.longitude),year:String(ramadanYear),method:String(method),school:String(school),highLatitude:highLatitude==="0"?"recommended":highLatitude==="1"?"MiddleOfNight":highLatitude==="2"?"SeventhOfNight":"TwilightAngle",timezone:Intl.DateTimeFormat().resolvedOptions().timeZone});setRamadanError(null);fetch(`/api/ramadan?${params}`).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);setRamadan(data)}).catch(reason=>{setRamadan(null);setRamadanError(reason instanceof Error?reason.message:"Ramadan timetable is unavailable.")})},[location,method,school,highLatitude,ramadanYear]);
  useEffect(()=>{const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()+hijriAdjustment);const key=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;fetch(`/api/hijri-date?date=${key}`).then(async response=>{const data:HijriPayload=await response.json();if(!response.ok||!data.formatted)throw new Error(data.error??"Hijri date unavailable");setAdjustedHijri(data.formatted)}).catch(()=>setAdjustedHijri(null))},[hijriAdjustment]);
  const next=useMemo(()=>getNextPrayer(today,new Date(tick)),[today,tick]);
  const countdown=next?`${String(Math.floor(next.ms/3_600_000)).padStart(2,"0")}:${String(Math.floor(next.ms%3_600_000/60_000)).padStart(2,"0")}:${String(Math.floor(next.ms%60_000/1000)).padStart(2,"0")}`:"--:--:--";
  const update=(kind:"method"|"school",value:number)=>{localStorage.setItem(`af-prayer-${kind}`,String(value));kind==="method"?setMethod(value):setSchool(value)};
  const updateHighLatitude=(value:string)=>{localStorage.setItem("af-prayer-high-latitude",value);setHighLatitude(value)};
  const updateHijriAdjustment=(value:number)=>{localStorage.setItem("af-hijri-adjustment",String(value));setHijriAdjustment(value)};
  return <>
    <section className={styles.heroCard}><div><p>{location.label}</p><h2>{next?.name??"Salah Times"}</h2><div className={styles.metaRow}><span>{today?.date}</span><span>{adjustedHijri??today?.hijri}</span>{hijriAdjustment!==0?<span>Local Hijri adjustment {hijriAdjustment>0?"+":""}{hijriAdjustment} day{Math.abs(hijriAdjustment)===1?"":"s"}</span>:null}<span>{today?.timezone}</span></div></div><div className={styles.countdown}>{countdown}</div></section>
    {today?<section className={styles.dailyTimes} aria-label="Today's five prayer times">{PRAYERS.map(name=><div className={next?.name===name?styles.activePrayer:""} key={name}><span>{name}</span><strong>{today.timings[name]}</strong></div>)}</section>:null}
    {error?<p className={styles.errorText} role="alert">{error}</p>:null}
    <section className={styles.panel}><div className={styles.panelTitle}><h2>Calculation settings</h2></div><div className={styles.settingGrid}><label>Method<select value={method} onChange={e=>update("method",Number(e.target.value))}>{METHODS.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Asr school<select value={school} onChange={e=>update("school",Number(e.target.value))}><option value={0}>Shafi</option><option value={1}>Hanafi</option></select></label><label>High-latitude adjustment<select value={highLatitude} onChange={e=>updateHighLatitude(e.target.value)}><option value="0">Automatic / standard</option><option value="1">Middle of the night</option><option value="2">One-seventh of the night</option><option value="3">Twilight angle</option></select></label><label>Hijri date adjustment<select value={hijriAdjustment} onChange={e=>updateHijriAdjustment(Number(e.target.value))}><option value={-2}>−2 days</option><option value={-1}>−1 day</option><option value={0}>No adjustment</option><option value={1}>+1 day</option><option value={2}>+2 days</option></select></label></div><p className={styles.sourceNote}>High-latitude adjustments affect Fajr and Isha where twilight may not occur normally. The Hijri adjustment changes only the displayed date so it can match your local moon-sighting authority. Calculated times may differ from your local mosque timetable. Daily and monthly source: AlAdhan.</p></section>
    <section className={styles.panel}><div className={styles.panelTitle}><h2>Monthly calendar</h2><div className={styles.monthControls}><button aria-label="Previous month" onClick={()=>setMonthDate(value=>new Date(value.getFullYear(),value.getMonth()-1,1))}>←</button><strong>{monthDate.toLocaleDateString(undefined,{month:"long",year:"numeric"})}</strong><button aria-label="Next month" onClick={()=>setMonthDate(value=>new Date(value.getFullYear(),value.getMonth()+1,1))}>→</button></div></div><div className={styles.calendarWrap}><table className={styles.calendar}><thead><tr><th>Date</th>{PRAYERS.map(name=><th key={name}>{name}</th>)}</tr></thead><tbody>{days.map(day=><tr key={day.gregorian}><td>{day.date}<br/><small>{day.hijri}</small></td>{PRAYERS.map(name=><td key={name}>{day.timings[name]}</td>)}</tr>)}</tbody></table></div></section>
    <section className={styles.panel}><div className={styles.panelTitle}><div><h2>Ramadan timetable</h2>{ramadan?<p className={styles.panelSubtitle}>{ramadan.start}–{ramadan.end} · {ramadan.hijriYear} AH</p>:null}</div><div className={styles.monthControls}><button aria-label="Previous Ramadan year" onClick={()=>setRamadanYear(value=>value-1)}>←</button><strong>{ramadanYear}</strong><button aria-label="Next Ramadan year" onClick={()=>setRamadanYear(value=>value+1)}>→</button></div></div>{ramadanError?<p className={styles.errorText} role="alert">{ramadanError}</p>:null}{ramadan?<div className={styles.calendarWrap}><table className={styles.calendar}><thead><tr><th>Day</th><th>Date</th><th>Suhoor ends</th><th>Fajr</th><th>Iftar</th><th>Isha</th></tr></thead><tbody>{ramadan.days.map(day=><tr key={day.date}><td>{day.day}<br/><small>{day.hijriDate}</small></td><td>{day.dayName}<br/><small>{day.date}</small></td><td>{day.suhoorEnds}</td><td>{day.fajr}</td><td>{day.iftar}</td><td>{day.isha}</td></tr>)}</tbody></table></div>:null}<p className={styles.sourceNote}>Ramadan dates and times are calculated and may differ from local moon-sighting decisions and mosque timetables.</p></section>
  </>;
}

export default function SalahTimesPage(){return <main className={styles.page}><header className={styles.pageHeader}><div><span className={styles.eyebrow}>Daily worship</span><h1>Salah Times</h1><p>Today’s prayer schedule, your next prayer, and a monthly view calculated for your location.</p></div></header><LocationPrompt>{location=><SalahContent location={location}/>}</LocationPrompt></main>}
