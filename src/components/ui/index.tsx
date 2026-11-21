import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Icon, type IconName } from "./icons";
import styles from "./ui.module.css";

export { Icon, type IconName } from "./icons";
export { styles as ui };

const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ");

type PageProps = { children: ReactNode; narrow?: boolean; className?: string };
export function Page({ children, narrow, className }: PageProps) {
  return <main className={cx(styles.page, narrow && styles.pageNarrow, className)}>{children}</main>;
}

type PageHeaderProps = { kicker?: string; kickerIcon?: IconName; title: ReactNode; titleArabic?: string; description?: ReactNode; back?: { href: string; label: string }; actions?: ReactNode };
// The compact header every section uses, matching the Quran reader's restrained hierarchy.
export function PageHeader({ kicker, kickerIcon, title, titleArabic, description, back, actions }: PageHeaderProps) {
  return <header className={styles.header}>
    <div className={styles.headerText}>
      {back ? <Link className={styles.back} href={back.href}><Icon name="back" />{back.label}</Link> : null}
      {kicker ? <p className={styles.kicker}>{kickerIcon ? <Icon name={kickerIcon} /> : null}{kicker}</p> : null}
      <h1 className={styles.title}>{title}{titleArabic ? <span className={styles.titleArabic} lang="ar" dir="rtl" translate="no">{titleArabic}</span> : null}</h1>
      {description ? <p className={styles.description}>{description}</p> : null}
    </div>
    {actions ? <div className={styles.headerActions}>{actions}</div> : null}
  </header>;
}

type Variant = "primary" | "secondary" | "ghost";
const buttonClass = (variant: Variant = "secondary", small?: boolean, className?: string) =>
  cx(styles.button, variant === "primary" && styles.primary, variant === "ghost" && styles.ghost, small && styles.small, className);

type ButtonProps = ComponentPropsWithoutRef<"button"> & { variant?: Variant; small?: boolean; icon?: IconName; trailingIcon?: IconName };
export function Button({ variant, small, icon, trailingIcon, className, children, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, small, className)} {...props}>{icon ? <Icon name={icon} /> : null}{children}{trailingIcon ? <Icon name={trailingIcon} /> : null}</button>;
}

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & { variant?: Variant; small?: boolean; icon?: IconName; trailingIcon?: IconName };
export function ButtonLink({ variant, small, icon, trailingIcon, className, children, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, small, className)} {...props}>{icon ? <Icon name={icon} /> : null}{children}{trailingIcon ? <Icon name={trailingIcon} /> : null}</Link>;
}

type IconButtonProps = ComponentPropsWithoutRef<"button"> & { icon: IconName; label: string };
export function IconButton({ icon, label, className, type = "button", ...props }: IconButtonProps) {
  return <button type={type} className={cx(styles.iconButton, className)} aria-label={label} title={label} {...props}><Icon name={icon} /></button>;
}

type ChipProps = ComponentPropsWithoutRef<"button"> & { icon?: IconName };
export function Chip({ icon, className, children, type = "button", ...props }: ChipProps) {
  return <button type={type} className={cx(styles.chip, className)} {...props}>{icon ? <Icon name={icon} /> : null}{children}</button>;
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx(styles.badge, className)}>{children}</span>;
}

export function Card({ children, className, as: Tag = "section" }: { children: ReactNode; className?: string; as?: "section" | "article" | "div" | "aside" }) {
  return <Tag className={cx(styles.card, className)}>{children}</Tag>;
}

export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return <div className={styles.sectionHeading}><h2>{title}</h2>{action}</div>;
}

export function Skeleton({ rows = 3, label = "Loading" }: { rows?: number; label?: string }) {
  return <div className={styles.skeleton} role="status" aria-label={label}>{Array.from({ length: rows }, (_, index) => <i key={index} />)}</div>;
}
