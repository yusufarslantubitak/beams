import * as React from "react"

import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost"

interface BadgeProps extends React.ComponentProps<"span"> {
  variant?: BadgeVariant
}

function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(className)}
      {...props}
    />
  )
}

export { Badge }
export type { BadgeVariant }
