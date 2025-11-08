import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "primary" | "secondary" | "muted"
  className?: string
  showOverlay?: boolean
  label?: string
}

export default function LoadingSpinner({
  size = "md",
  variant = "primary",
  className,
  showOverlay = false,
  label
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  }

  const variantClasses = {
    primary: "border-slate-300 border-t-blue-600",
    secondary: "border-slate-300 border-t-emerald-600",
    muted: "border-slate-200 border-t-slate-400",
  }

  const spinner = (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2",
          sizeClasses[size],
          variantClasses[variant]
        )}
        aria-hidden="true"
      />
      {label && (
        <p className={cn(
          "text-sm animate-pulse",
          size === "sm" ? "text-xs" : size === "xl" ? "text-base" : "text-sm"
        )}>
          {label}
        </p>
      )}
    </div>
  )

  if (showOverlay) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          {spinner}
        </div>
      </div>
    )
  }

  return spinner
}
