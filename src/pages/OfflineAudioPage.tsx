import { useEffect, useMemo, useState } from "react";
import { HardDriveDownload, Trash2 } from "lucide-react";
import SEO from "../components/SEO";
import { listDownloadedAudio, removeDownloadedAudio, type DownloadedAudio } from "../platform/web/audioDownloads";

export default function OfflineAudioPage() {
  const [items, setItems] = useState<DownloadedAudio[]>([]);
  const [loading, setLoading] = useState(true);
  const load = () => void listDownloadedAudio().then(setItems).finally(() => setLoading(false));
  useEffect(load, []);
  const bytes = useMemo(() => items.reduce((total, item) => total + item.blob.size, 0), [items]);
  const groups = useMemo(() => Object.entries(items.reduce<Record<string, DownloadedAudio[]>>((result, item) => { const key = `${item.track.surahNumber}. ${item.track.surahName}`; (result[key] ||= []).push(item); return result; }, {})), [items]);

  return <div className="mx-auto max-w-4xl px-5 py-12"><SEO title="Offline audio" description="Manage Quran audio saved on this device." /><div className="section-icon"><HardDriveDownload /></div><h1 className="mt-5 text-4xl font-semibold">Offline audio</h1><p className="mt-3 text-stone-500">{items.length} ayahs · {(bytes / 1024 / 1024).toFixed(1)} MB stored privately in this browser.</p>{loading ? <p className="mt-10">Loading downloads…</p> : groups.length === 0 ? <div className="surface-card mt-8 text-center"><p>No audio downloaded yet.</p><p className="mt-2 text-sm text-stone-500">Use the download button in the audio player to save an ayah.</p></div> : <div className="mt-8 space-y-4">{groups.map(([name, tracks]) => <section key={name} className="surface-card"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">{name}</h2><p className="text-sm text-stone-500">{tracks.length} ayahs · {(tracks.reduce((sum, item) => sum + item.blob.size, 0) / 1024 / 1024).toFixed(1)} MB</p></div><button type="button" onClick={() => void Promise.all(tracks.map((item) => removeDownloadedAudio(item.key))).then(load)} className="icon-button text-red-600" aria-label={`Delete offline audio for ${name}`}><Trash2 /></button></div></section>)}</div>}</div>;
}
