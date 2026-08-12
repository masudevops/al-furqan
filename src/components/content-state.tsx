import styles from "./content-state.module.css";

export default function ContentState({ kind = "loading", title, message }: { kind?: "loading" | "empty" | "error"; title?: string; message: string }) {
  return <section className={`${styles.state} ${styles[kind]}`} role={kind === "error" ? "alert" : "status"} aria-live="polite">
    {kind === "loading" ? <span className={styles.spinner} aria-hidden="true"/> : null}
    {title ? <h2>{title}</h2> : null}
    <p>{message}</p>
  </section>;
}
