import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm" | "icon";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent-solid text-on-accent hover:opacity-90",
  secondary: "border border-line bg-surface text-text hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-text",
  danger: "border border-danger/40 bg-surface text-danger hover:bg-surface-2",
};

// Alvos de toque >= 44px no celular (min-h-11); compactos a partir de lg.
const SIZES: Record<ButtonSize, string> = {
  md: "min-h-11 px-4 text-sm lg:min-h-10",
  sm: "min-h-11 px-3 text-xs lg:min-h-8",
  icon: "size-11 lg:size-8",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-control font-medium transition-opacity",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pending?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, pending = false, disabled, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  );
});
