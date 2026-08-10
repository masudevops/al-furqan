"use client";

import { useEffect, useMemo, useState } from "react";
import LocationPrompt from "./location-prompt";
import { getNextPrayer } from "./prayer-times";
import styles from "./feature-pages.module.css";

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
const METHODS = [{id:3,name:"Muslim World League"},{id:2,name:"ISNA"},{id:4,name:"Umm al-Qura"},{id:5,name:"Egyptian Authority"},{id:1,name:"Karachi"}];
type Day = { date:string; gregorian:string; hijri:string; timings:Record<string,string> };
type Today = Day & { error:null; timezone:string };

function SalahContent({ location }: { location: { latitude:number; longitude:number; label:string } }) {
  const [today,setToday]=useState<Today|null>(null); const [days,setDays]=useState<Day[]>([]); const [error,setError]=useState<string|null>(null);
  const [method,setMethod]=useState(2); const [school,setSchool]=useState(0); const [tick,setTick]=useState(Date.now());
  const [monthDate,setMonthDate]=useState(()=>new Date());
  useEffect(()=>{setMethod(Number(localStorage.getItem("af-prayer-method"))||2);setSchool(Number(localStorage.getItem("af-prayer-school"))||0)},[]);
  useEffect(()=>{const id=setInterval(()=>setTick(Date.now()),1000);return()=>clearInterval(id)},[]);
  useEffect(()=>{
    const base={latitude:String(location.latitude),longitude:String(location.longitude),method:String(method),school:String(school)};
    const daily=new URLSearchParams(base); const monthly=new URLSearchParams({...base,month:String(monthDate.getMonth()+1),year:String(monthDate.getFullYear())});
    setError(null);
    Promise.all([fetch(`/api/prayer-times?${daily}`),fetch(`/api/prayer-times?${monthly}`)]).then(async([a,b])=>{
      const [dailyData,monthlyData]=await Promise.all([a.json(),b.json()]); if(!a.ok||!b.ok) throw new Error(dailyData.error??monthlyData.error);
      setToday(dailyData);setDays(monthlyData.days??[]);
    }).catch(reason=>setError(reason instanceof Error?reason.message:"Salah times are unavailable."));
  },[location,method,school,monthDate]);
  const next=useMemo(()=>getNextPrayer(today,new Date(tick)),[today,tick]);
  const countdown=next?`${String(Math.floor(next.ms/3_600_000)).padStart(2,"0")}:${String(Math.floor(next.ms%3_600_000/60_000)).padStart(2,"0")}:${String(Math.floor(next.ms%60_000/1000)).padStart(2,"0")}`:"--:--:--";
  const update=(kind:"method"|"school",value:number)=>{localStorage.setItem(`af-prayer-${kind}`,String(value));kind==="method"?setMethod(value):setSchool(value)};
  return <>
    <section className={styles.heroCard}><div><p>{location.label}</p><h2>{next?.name??"Salah Times"}</h2><div className={styles.metaRow}><span>{today?.date}</span><span>{today?.hijri}</span><span>{today?.timezone}</span></div></div><div className={styles.countdown}>{countdown}</div></section>
    {today?<section className={styles.dailyTimes} aria-label="Today's five prayer times">{PRAYERS.map(name=><div className={next?.name===name?styles.activePrayer:""} key={name}><span>{name}</span><strong>{today.timings[name]}</strong></div>)}</section>:null}
    {error?<p className={styles.errorText} role="alert">{error}</p>:null}
    <section className={styles.panel}><div className={styles.panelTitle}><h2>Calculation settings</h2></div><div className={styles.settingGrid}><label>Method<select value={method} onChange={e=>update("method",Number(e.target.value))}>{METHODS.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Asr school<select value={school} onChange={e=>update("school",Number(e.target.value))}><option value={0}>Shafi</option><option value={1}>Hanafi</option></select></label></div><p className={styles.sourceNote}>Calculated times may differ from your local mosque timetable. Source: AlAdhan.</p></section>
    <section className={styles.panel}><div className={styles.panelTitle}><h2>Monthly calendar</h2><div className={styles.monthControls}><button aria-label="Previous month" onClick={()=>setMonthDate(value=>new Date(value.getFullYear(),value.getMonth()-1,1))}>←</button><strong>{monthDate.toLocaleDateString(undefined,{month:"long",year:"numeric"})}</strong><button aria-label="Next month" onClick={()=>setMonthDate(value=>new Date(value.getFullYear(),value.getMonth()+1,1))}>→</button></div></div><div className={styles.calendarWrap}><table className={styles.calendar}><thead><tr><th>Date</th>{PRAYERS.map(name=><th key={name}>{name}</th>)}</tr></thead><tbody>{days.map(day=><tr key={day.gregorian}><td>{day.date}<br/><small>{day.hijri}</small></td>{PRAYERS.map(name=><td key={name}>{day.timings[name]}</td>)}</tr>)}</tbody></table></div></section>
  </>;
}

export default function SalahTimesPage(){return <main className={styles.page}><header className={styles.pageHeader}><div><span className={styles.eyebrow}>Daily worship</span><h1>Salah Times</h1><p>Today’s prayer schedule, your next prayer, and a monthly view calculated for your location.</p></div></header><LocationPrompt>{location=><SalahContent location={location}/>}</LocationPrompt></main>}
