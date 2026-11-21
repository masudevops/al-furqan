// Built per render (like the shell's Icon) so importing this module never evaluates JSX.
const iconPaths = () => ({
  play: <path d="M8 5.5v13l10.5-6.5Z" />,
  pause: <><path d="M8.5 5.5v13" /><path d="M15.5 5.5v13" /></>,
  bookmark: <path d="M6.5 3.5h11v17l-5.5-3.8-5.5 3.8Z" />,
  copy: <><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" /></>,
  share: <><circle cx="17.5" cy="5.5" r="2.5" /><circle cx="6.5" cy="12" r="2.5" /><circle cx="17.5" cy="18.5" r="2.5" /><path d="m8.7 10.7 6.6-3.9" /><path d="m8.7 13.3 6.6 3.9" /></>,
  more: <><circle cx="5.5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="18.5" cy="12" r="1.2" /></>,
  book: <><path d="M12 6.5c-2-1.6-4.6-2-8-2v13.5c3.4 0 6 .4 8 2 2-1.6 4.6-2 8-2V4.5c-3.4 0-6 .4-8 2Z" /><path d="M12 6.5V20" /></>,
  scroll: <><path d="M6.5 4.5h10a2 2 0 0 1 2 2v13h-10a2 2 0 0 1-2-2Z" /><path d="M9.5 9h6" /><path d="M9.5 12.5h6" /><path d="M9.5 16h3.5" /></>,
  answer: <><path d="M4.5 5.5h15v10h-8l-4.5 3.5v-3.5h-2.5Z" /><path d="M10 9.2a2 2 0 1 1 2.6 1.9c-.4.2-.6.5-.6.9" /><path d="M12 13.4v.1" /></>,
  chevron: <path d="m7 10 5 5 5-5" />,
  settings: <><path d="M4.5 7.5h9" /><path d="M17.5 7.5h2" /><circle cx="15.5" cy="7.5" r="2" /><path d="M4.5 16.5h2" /><path d="M10.5 16.5h9" /><circle cx="8.5" cy="16.5" r="2" /></>,
  verses: <><path d="M5 6.5h14" /><path d="M5 12h14" /><path d="M5 17.5h9" /></>,
  page: <><path d="M6.5 3.5h8l3 3v14h-11Z" /><path d="M9.5 10h5" /><path d="M9.5 13.5h5" /><path d="M9.5 17h3" /></>,
  tools: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></>,
  back: <path d="M14.5 6.5 9 12l5.5 5.5" />,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5" /><path d="M12 7.8v.1" /></>,
  close: <><path d="m6.5 6.5 11 11" /><path d="m17.5 6.5-11 11" /></>,
  gear: <><path d="M18.96 9.49 L21.36 9.86 L21.36 14.14 L18.96 14.51 L18.70 15.15 L20.13 17.11 L17.11 20.13 L15.15 18.70 L14.51 18.96 L14.14 21.36 L9.86 21.36 L9.49 18.96 L8.85 18.70 L6.89 20.13 L3.87 17.11 L5.30 15.15 L5.04 14.51 L2.64 14.14 L2.64 9.86 L5.04 9.49 L5.30 8.85 L3.87 6.89 L6.89 3.87 L8.85 5.30 L9.49 5.04 L9.86 2.64 L14.14 2.64 L14.51 5.04 L15.15 5.30 L17.11 3.87 L20.13 6.89 L18.70 8.85Z" /><circle cx="12" cy="12" r="3.2" /></>,
  minus: <path d="M6 12h12" />,
  plus: <><path d="M6 12h12" /><path d="M12 6v12" /></>,
  check: <path d="m5.5 12.5 4 4 9-9" />,
  arrowRight: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
});

export type ReaderIconName = keyof ReturnType<typeof iconPaths>;

export function ReaderIcon({ name }: { name: ReaderIconName }) {
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">{iconPaths()[name]}</svg>;
}
