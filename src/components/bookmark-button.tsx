import styles from "./bookmark-button.module.css";

export default function BookmarkButton({ saved, label, onClick }: { saved: boolean; label: string; onClick: () => void }) {
  return <button type="button" className={styles.button} aria-label={`${saved ? "Remove bookmark from" : "Bookmark"} ${label}`} aria-pressed={saved} title={saved ? "Remove bookmark" : "Bookmark"} onClick={onClick}>
    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h12v19l-6-4-6 4Z"/></svg>
  </button>;
}
