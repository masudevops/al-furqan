import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ margin: "0 auto", maxWidth: 760, padding: "clamp(5rem, 14vw, 10rem) 1.5rem", textAlign: "center" }}>
      <p style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", letterSpacing: ".12em", textTransform: "uppercase" }}>Page unavailable</p>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2.5rem, 7vw, 5rem)", margin: "1rem 0" }}>This page is not available.</h1>
      <p>The feature may be temporarily unavailable or the address may have changed.</p>
      <Link href="/" style={{ display: "inline-block", marginTop: "2rem" }}>Return home →</Link>
    </main>
  );
}
