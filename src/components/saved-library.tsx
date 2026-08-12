"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ContentState from "./content-state";
import { readLocalBookmarks, removeLocalBookmark } from "@/lib/local-bookmarks";
import type { LocalBookmark, LocalBookmarkType } from "@/lib/local-bookmarks";
import styles from "./saved-library.module.css";

const labels: Record<LocalBookmarkType, string> = { quran: "Quran", sunnah: "Sunnah", dua: "Dua" };

export default function SavedLibrary() {
  const [items, setItems] = useState<LocalBookmark[]>([]);
  const [filter, setFilter] = useState<"all" | LocalBookmarkType>("all");
  useEffect(() => setItems(readLocalBookmarks()), []);
  const visible = useMemo(() => items.filter(item => filter === "all" || item.type === filter).sort((a,b) => b.savedAt.localeCompare(a.savedAt)), [items, filter]);
  return <main className={styles.main}>
    <header><p>Saved locally</p><h1>Saved Library</h1><span>Your Quran, Sunnah, and Dua bookmarks stay on this device.</span></header>
    <div className={styles.filters} role="tablist" aria-label="Filter saved content">{(["all","quran","sunnah","dua"] as const).map(value => <button type="button" role="tab" aria-selected={filter===value} onClick={()=>setFilter(value)} key={value}>{value === "all" ? "All" : labels[value]}</button>)}</div>
    {!visible.length ? <ContentState kind="empty" title="Nothing saved here yet" message={filter === "all" ? "Use the bookmark icon while reading to keep something for later." : `No ${labels[filter as LocalBookmarkType]} bookmarks are saved on this device.`}/> : <section className={styles.list}>{visible.map(item => <article key={item.id}><div><span>{labels[item.type]}</span><h2><Link href={item.url}>{item.label}</Link></h2><p>{item.reference}</p></div><button aria-label={`Remove ${item.label} from saved items`} onClick={()=>setItems(removeLocalBookmark(item.id))}>Remove</button></article>)}</section>}
  </main>;
}
