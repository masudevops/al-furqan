"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

type PopoverProps = {
  className?: string;
  summaryClassName?: string;
  label: string;
  summary: ReactNode;
  children: (close: () => void) => ReactNode;
};

// A <details> disclosure that also closes on outside press and Escape, returning focus to its trigger.
export default function Popover({ className, summaryClassName, label, summary, children }: PopoverProps) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => { if (ref.current) ref.current.open = false; };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) close(); };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      close();
      ref.current?.querySelector("summary")?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  return <details ref={ref} className={className} onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary className={summaryClassName} aria-label={label} title={label}>{summary}</summary>
    {open ? <div>{children(close)}</div> : null}
  </details>;
}
