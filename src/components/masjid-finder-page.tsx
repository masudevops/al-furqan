"use client";
import {useEffect,useState} from "react";
import LocationPrompt from "./location-prompt";
import styles from "./feature-pages.module.css";

type Mosque={id:string;name:string;address:string|null;distanceKm:number;latitude:number;longitude:number;phone:string|null;website:string|null;congregationTimes:Record<string,string|string[]>|null};
type MasjidResponse={items:Mosque[];partial:boolean};
const prayerLabel=(key:string)=>key==="dhuhr"?"Dhuhr":key==="jummah"?"Jumu’ah":key[0].toUpperCase()+key.slice(1);

function Results({location}:{location:{latitude:number;longitude:number;label:string}}){
  const[items,setItems]=useState<Mosque[]>([]),[error,setError]=useState<string|null>(null),[partial,setPartial]=useState(false),[loading,setLoading]=useState(true),[radiusKm,setRadiusKm]=useState(20);
  useEffect(()=>{
    const key=`af-masjids-v4:${location.latitude.toFixed(3)}:${location.longitude.toFixed(3)}:${radiusKm}`,cached=sessionStorage.getItem(key);
    setError(null);setLoading(true);
    if(cached){const data=JSON.parse(cached) as MasjidResponse;setItems(data.items);setPartial(data.partial);setLoading(false);return}
    fetch(`/api/masjids?latitude=${location.latitude}&longitude=${location.longitude}&radius=${radiusKm*1000}`).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);const result={items:data.items as Mosque[],partial:Boolean(data.partial)};sessionStorage.setItem(key,JSON.stringify(result));setItems(result.items);setPartial(result.partial)}).catch(reason=>setError(reason.message)).finally(()=>setLoading(false));
  },[location,radiusKm]);
  return <>
    <section className={styles.panel}><div className={styles.panelTitle}><div><span className={styles.eyebrow}>{location.label}</span><h2>Nearby mosques</h2></div><div className={styles.resultControls}><label>Search radius<select value={radiusKm} onChange={event=>setRadiusKm(Number(event.target.value))}><option value={10}>10 km</option><option value={20}>20 km</option><option value={50}>50 km</option></select></label><strong>{loading?"Searching…":`${items.length} found`}</strong></div></div>{partial&&!loading?<p className={styles.coverageNotice}>Showing available listings. One directory is temporarily unavailable.</p>:null}</section>
    {error?<p className={styles.errorText}>{error}</p>:null}
    <section className={styles.mosqueList}>{items.map(item=><article className={styles.mosqueCard} key={item.id}><div><h2>{item.name}</h2><p>{item.distanceKm.toFixed(1)} km away</p><p>{item.address??"Address unavailable"}</p>{item.congregationTimes?<div className={styles.iqamahTimes}>{Object.entries(item.congregationTimes).map(([prayer,time])=><span key={prayer}><small>{prayerLabel(prayer)}</small><strong>{Array.isArray(time)?time.join(" · "):time}</strong></span>)}</div>:null}<div className={styles.mosqueLinks}>{item.phone?<a href={`tel:${item.phone}`}>Call</a>:null}{item.website?<a href={item.website} target="_blank" rel="noreferrer">Website ↗</a>:null}</div></div><a className={styles.directions} href={`https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`} target="_blank" rel="noreferrer">Directions ↗</a></article>)}</section>
    {!loading&&!error&&items.length===0?<p className={styles.notice}>No mapped mosques were found within {radiusKm} km. Try a wider search radius.</p>:null}
    <p className={styles.sourceNote}>Listings may be incomplete or change over time. Missing a mosque? <a href="https://www.openstreetmap.org/" target="_blank" rel="noreferrer">Contribute to OpenStreetMap ↗</a></p>
  </>;
}

export default function MasjidFinderPage(){return <main className={styles.page}><header className={styles.pageHeader}><div><span className={styles.eyebrow}>Community map</span><h1>Masjid Finder</h1><p>Find nearby mosques and open turn-by-turn directions in your maps app.</p></div></header><LocationPrompt>{location=><Results location={location}/>}</LocationPrompt></main>}
