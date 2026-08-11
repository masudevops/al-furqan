import { ImageResponse } from "next/og";
import { enabledFeatureLabels } from "@/lib/features";

export const alt = "Al-Furqan — The Noble Quran, without the noise";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const features = ["Tajweed", "Translations", "Tafsir", "Audio", ...enabledFeatureLabels()].join(" · ");
  return new ImageResponse(
    <div style={{ alignItems: "stretch", background: "#f6f2e8", color: "#17231c", display: "flex", height: "100%", padding: 56, width: "100%" }}>
      <div style={{ border: "2px solid #d8cfbb", display: "flex", flex: 1, flexDirection: "column", justifyContent: "space-between", padding: "46px 54px" }}>
        <div style={{ alignItems: "center", display: "flex", gap: 20 }}>
          <div style={{ alignItems: "center", background: "#1f604b", borderRadius: 22, color: "#fffdf8", display: "flex", fontSize: 31, fontWeight: 700, height: 68, justifyContent: "center", width: 68 }}>AF</div>
          <div style={{ display: "flex", flexDirection: "column" }}><span style={{ fontFamily: "serif", fontSize: 35, fontWeight: 700 }}>Al-Furqan</span><span style={{ color: "#52675d", fontSize: 17, letterSpacing: 3, textTransform: "uppercase" }}>Quran & Sunnah Companion</span></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
          <span style={{ color: "#1f604b", fontSize: 18, fontWeight: 700, letterSpacing: 4, marginBottom: 18, textTransform: "uppercase" }}>Free · Private · Ad-free</span>
          <span style={{ fontFamily: "serif", fontSize: 68, fontWeight: 500, letterSpacing: -2, lineHeight: 1.05 }}>The Noble Quran, without the noise.</span>
          <span style={{ color: "#52675d", fontSize: 24, lineHeight: 1.5, marginTop: 22 }}>{features}</span>
        </div>
        <div style={{ color: "#1f604b", display: "flex", fontSize: 19, fontWeight: 700 }}>al-furqan.app</div>
      </div>
    </div>,
    size,
  );
}
