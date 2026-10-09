"use client";
import {useEffect,useMemo,useState} from "react";
import LocationPrompt,{type LocationControls} from "./location-prompt";
import page from "./feature-pages.module.css";
import styles from "./masjid-finder.module.css";

type Mosque={id:string;name:string;address:string|null;distanceKm:number;latitude:number;longitude:number;phone:string|null;website:string|null;congregationTimes:Record<string,string|string[]>|null};
type MasjidResponse={items:Mosque[];partial:boolean;total:number};
type Origin={latitude:number;longitude:number;label:string};
const RADII=[10,20,50],BANDS=[[0,1,"Within 1 km"],[1,5,"1 to 5 km"],[5,10,"5 to 10 km"],[10,20,"10 to 20 km"],[20,Infinity,"Beyond 20 km"]] as const;
const COMPASS_POINTS=["N","NE","E","SE","S","SW","W","NW"],COMPASS_NAMES=["north","northeast","east","southeast","south","southwest","west","northwest"];
const prayerLabel=(key:string)=>key==="dhuhr"?"Dhuhr":key==="jummah"?"Jumu’ah":key[0].toUpperCase()+key.slice(1);
const formatKm=(km:number)=>km<1?`${Math.round(km*1000)} m`:`${km.toFixed(km<10?1:0)} km`;
const directionsUrl=(item:Mosque)=>`https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`;
const bearing=(from:Origin,to:Mosque)=>{const rad=Math.PI/180,y=Math.sin((to.longitude-from.longitude)*rad)*Math.cos(to.latitude*rad),x=Math.cos(from.latitude*rad)*Math.sin(to.latitude*rad)-Math.sin(from.latitude*rad)*Math.cos(to.latitude*rad)*Math.cos((to.longitude-from.longitude)*rad);return(Math.atan2(y,x)/rad+360)%360};
const compassPoint=(degrees:number)=>COMPASS_POINTS[Math.round(degrees/45)%8],compassName=(degrees:number)=>COMPASS_NAMES[Math.round(degrees/45)%8];

function Times({times}:{times:NonNullable<Mosque["congregationTimes"]>}){return <div className={styles.times} aria-label="Verified congregation times">{Object.entries(times).map(([prayer,time])=><span key={prayer}><small>{prayerLabel(prayer)}</small><strong>{Array.isArray(time)?time.join(" · "):time}</strong></span>)}</div>}

function Nearest({item,origin}:{item:Mosque;origin:Origin}){
  return <section className={styles.nearest} aria-labelledby="nearest-name">
    <div><p className={styles.nearestLabel}>Nearest masjid</p><h2 id="nearest-name">{item.name}</h2><p className={styles.nearestMeta}>{item.address??"Address not listed"}</p></div>
    <div className={styles.nearestFoot}>
      <div><div className={styles.nearestDistance}>{formatKm(item.distanceKm).split(" ")[0]}<small>{formatKm(item.distanceKm).split(" ")[1]}</small></div><p className={styles.nearestLabel}>to the {compassName(bearing(origin,item))}</p></div>
      <div className={styles.nearestActions}><a className={styles.primaryLink} href={directionsUrl(item)} target="_blank" rel="noreferrer">Get directions ↗</a>{item.phone?<a className={styles.secondaryLink} href={`tel:${item.phone}`}>Call</a>:null}{item.website?<a className={styles.secondaryLink} href={item.website} target="_blank" rel="noreferrer">Website ↗</a>:null}</div>
    </div>
    {item.congregationTimes?<Times times={item.congregationTimes}/>:null}
  </section>;
}

// Positions use a square-root distance scale so close masjids do not collapse into the centre.
function Compass({items,origin,radiusKm,activeId,onSelect}:{items:Mosque[];origin:Origin;radiusKm:number;activeId:string|null;onSelect:(id:string)=>void}){
  const size=300,center=size/2,outer=center-14,scale=(km:number)=>outer*Math.sqrt(Math.min(km,radiusKm)/radiusKm),rings=[1,5,10,20,50].filter(km=>km<=radiusKm);
  return <section className={styles.compass} aria-labelledby="compass-title">
    <div className={styles.compassHead}><h2 id="compass-title">Around you</h2><span>{radiusKm} km radius</span></div>
    <svg viewBox={`0 0 ${size} ${size}`} role="group" aria-label={`${items.length} masjids plotted by direction and distance`}>
      <line className={styles.axis} x1={center} y1={center-outer} x2={center} y2={center+outer}/><line className={styles.axis} x1={center-outer} y1={center} x2={center+outer} y2={center}/>
      {rings.map(km=><g key={km}><circle className={styles.ring} cx={center} cy={center} r={scale(km)}/><text className={styles.ringLabel} x={center+4} y={center-scale(km)+11}>{km} km</text></g>)}
      <text className={styles.north} x={center} y={6} textAnchor="middle">N</text>
      <circle className={styles.youHalo} cx={center} cy={center} r={11}/><circle className={styles.you} cx={center} cy={center} r={4.5}/>
      {items.map((item,index)=>{const angle=(bearing(origin,item)-90)*Math.PI/180,r=scale(item.distanceKm);return <circle key={item.id} className={`${styles.dot} ${activeId===item.id?styles.dotActive:""}`} style={{animationDelay:`${Math.min(index,40)*18}ms`}} cx={center+r*Math.cos(angle)} cy={center+r*Math.sin(angle)} r={5} tabIndex={0} role="button" aria-label={`${item.name}, ${formatKm(item.distanceKm)} ${compassPoint(bearing(origin,item))}`} onClick={()=>onSelect(item.id)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();onSelect(item.id)}}}><title>{item.name}</title></circle>})}
    </svg>
    <p className={styles.compassNote}>Tap a dot to find it in the list</p>
  </section>;
}

function Row({item,origin,active}:{item:Mosque;origin:Origin;active:boolean}){
  return <li id={`masjid-${item.id}`} className={`${styles.row} ${active?styles.rowActive:""}`}>
    <div className={styles.distance}>{formatKm(item.distanceKm)}<small>{compassPoint(bearing(origin,item))}</small></div>
    <div><h4>{item.name}</h4><p className={styles.address}>{item.address??"Address not listed"}</p>{item.congregationTimes?<Times times={item.congregationTimes}/>:null}{item.phone||item.website?<div className={styles.links}>{item.phone?<a href={`tel:${item.phone}`}>Call</a>:null}{item.website?<a href={item.website} target="_blank" rel="noreferrer">Website ↗</a>:null}</div>:null}</div>
    <div className={styles.rowAction}><a className={styles.directions} href={directionsUrl(item)} target="_blank" rel="noreferrer" aria-label={`Directions to ${item.name}`}>Directions ↗</a></div>
  </li>;
}

function Results({location,controls}:{location:Origin;controls:LocationControls}){
  const[items,setItems]=useState<Mosque[]>([]),[error,setError]=useState<string|null>(null),[partial,setPartial]=useState(false),[total,setTotal]=useState(0),[loading,setLoading]=useState(true),[radiusKm,setRadiusKm]=useState(20),[query,setQuery]=useState(""),[activeId,setActiveId]=useState<string|null>(null),[attempt,setAttempt]=useState(0);
  useEffect(()=>{
    const key=`af-masjids-v6:${location.latitude.toFixed(3)}:${location.longitude.toFixed(3)}:${radiusKm}`,cached=sessionStorage.getItem(key);
    setError(null);setLoading(true);setActiveId(null);
    if(cached){const data=JSON.parse(cached) as MasjidResponse;setItems(data.items);setPartial(data.partial);setTotal(data.total??data.items.length);setLoading(false);return}
    fetch(`/api/masjids?latitude=${location.latitude}&longitude=${location.longitude}&radius=${radiusKm*1000}`).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);const result={items:data.items as Mosque[],partial:Boolean(data.partial),total:Number(data.total)||data.items.length};sessionStorage.setItem(key,JSON.stringify(result));setItems(result.items);setPartial(result.partial);setTotal(result.total)}).catch(reason=>setError(reason.message)).finally(()=>setLoading(false));
  },[location,radiusKm,attempt]);
  const filtered=useMemo(()=>{const needle=query.trim().toLowerCase();return needle?items.filter(item=>`${item.name} ${item.address??""}`.toLowerCase().includes(needle)):items},[items,query]);
  const select=(id:string)=>{setQuery("");setActiveId(id);requestAnimationFrame(()=>document.getElementById(`masjid-${id}`)?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"}))};
  const countText=total>items.length?`Showing the nearest ${items.length} of ${total} found`:`${items.length} found within ${radiusKm} km`;
  return <>
    <div className={styles.toolbar}>
      <div className={styles.place}><span className={styles.pin} aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg></span><div><strong>{controls.status==="loading"?"Updating your location…":location.label}</strong><div className={styles.placeActions}><button type="button" className={styles.textButton} onClick={controls.detect} disabled={controls.status==="loading"}>Use my current location</button><button type="button" className={styles.textButton} onClick={controls.clear}>Change location</button></div></div></div>
      <div className={styles.radius}><span id="radius-label">Search within</span><div className={styles.segments} role="group" aria-labelledby="radius-label">{RADII.map(km=><button key={km} type="button" aria-pressed={radiusKm===km} onClick={()=>setRadiusKm(km)}>{km} km</button>)}</div></div>
      {controls.status==="denied"?<p className={styles.blocked}>Location access is blocked. Allow it in your browser settings, or choose Change location.</p>:null}
    </div>
    {loading?<p className={styles.status} role="status">Finding masjids near {location.label}…</p>:null}
    {!loading&&error?<div className={styles.empty} role="alert"><p className={styles.error}>{error}</p><button type="button" className={styles.textButton} onClick={()=>setAttempt(value=>value+1)}>Try again</button></div>:null}
    {!loading&&!error&&items.length===0?<div className={styles.empty}><p>No mapped masjids within {radiusKm} km.</p>{radiusKm<50?<button type="button" className={styles.textButton} onClick={()=>setRadiusKm(50)}>Search within 50 km</button>:null}</div>:null}
    {!loading&&!error&&items.length>0?<>
      {partial?<p className={styles.coverage}>One directory is temporarily unavailable, so this list may be shorter than usual.</p>:null}
      <div className={styles.overview}><Nearest item={items[0]} origin={location}/><Compass items={items} origin={location} radiusKm={radiusKm} activeId={activeId} onSelect={select}/></div>
      <div className={styles.listHead}><div><h2>All nearby masjids</h2><p>{countText}</p></div><label className={styles.filter}>Filter by name or street<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="e.g. Al-Noor"/></label></div>
      {filtered.length===0?<div className={styles.empty}><p>No masjids match “{query}”.</p><button type="button" className={styles.textButton} onClick={()=>setQuery("")}>Clear filter</button></div>:null}
      {BANDS.map(([min,max,label])=>{const band=filtered.filter(item=>item.distanceKm>=min&&item.distanceKm<max);return band.length?<section className={styles.band} key={label} aria-label={label}><h3><span>{label}</span><span className={styles.bandRule}/><span>{band.length}</span></h3><ol>{band.map(item=><Row key={item.id} item={item} origin={location} active={activeId===item.id}/>)}</ol></section>:null})}
    </>:null}
    <p className={styles.source}>Listings combine OpenStreetMap contributors, Takbeer Time and Overture Maps Foundation data and may be incomplete or change over time. Missing a masjid? <a href="https://www.openstreetmap.org/" target="_blank" rel="noreferrer">Add it to OpenStreetMap ↗</a></p>
  </>;
}

export default function MasjidFinderPage(){return <main className={page.page}><header className={page.pageHeader}><div><span className={page.eyebrow}>Community map</span><h1>Masjid Finder</h1><p>See the masjids around you, how far each one is, and open directions in your maps app.</p></div></header><LocationPrompt live>{(location,controls)=><Results location={location} controls={controls}/>}</LocationPrompt></main>}
