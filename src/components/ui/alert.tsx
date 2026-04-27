import * as React from "react"

import { cn } from "@/lib/utils"

type AlertVariant = "default" | "destructive"

function Alert({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<"div"> & { variant?: AlertVariant }) {
  // Detect if any direct child is an SVG element (replaces CSS :has(> svg) for Firefox < 121)
  const hasIcon = React.Children.toArray(children).some(
    (child) => React.isValidElement(child) && (child.type === 'svg' || typeof child.type !== 'string')
  )

  return (
    <div
      data-slot="alert"
      data-variant={variant}
      data-has-icon={hasIcon || undefined}
      role="alert"
      className={cn(className)}
      {...props}
    >
      {children}
    </div>
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(className)}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn(className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
