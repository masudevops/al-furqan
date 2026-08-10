import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<div style={{ alignItems: "center", background: "#1f604b", color: "#fffdf8", display: "flex", fontFamily: "serif", fontSize: 74, fontWeight: 700, height: "100%", justifyContent: "center", width: "100%" }}>AF</div>, size);
}
