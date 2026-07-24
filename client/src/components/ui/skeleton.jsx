import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-muted/60 relative overflow-hidden", className)}
      {...props}
    />
  )
}

export { Skeleton }
