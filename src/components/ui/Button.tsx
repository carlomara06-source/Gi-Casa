import { ButtonHTMLAttributes } from "react";

type Variant = "accent" | "navy" | "outline" | "ghost" | "sun";

const base =
  "inline-flex items-center justify-center gap-2 font-heading font-semibold text-sm tracking-[0.05em] uppercase px-4 py-3.5 transition-colors disabled:cursor-default disabled:opacity-60";

const variants: Record<Variant, string> = {
  accent: "bg-accent-600 text-white hover:bg-accent-700",
  navy: "bg-accent-900 text-white hover:bg-blue-800",
  outline: "border border-blue-600 text-blue-700 hover:bg-blue-100",
  ghost: "border border-divider text-neutral-700 hover:bg-accent-100",
  sun: "bg-sun text-accent-900 hover:brightness-95",
};

export function Button({
  variant = "accent",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
