import * as React from "react"
import { useEffect, useCallback, useRef } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <div data-slot="dialog" data-state={open ? "open" : "closed"}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
            open,
            onOpenChange,
          })
        }
        return child
      })}
    </div>
  )
}

function DialogTrigger({
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  open,
  onOpenChange,
  ...props
}: React.ComponentProps<"button"> & { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  return (
    <button
      data-slot="dialog-trigger"
      type="button"
      onClick={() => onOpenChange?.(true)}
      {...props}
    >
      {children}
    </button>
  )
}

function DialogOverlay({
  className,
  onOpenChange,
  ...props
}: React.ComponentProps<"div"> & { onOpenChange?: (open: boolean) => void }) {
  return (
    <div
      data-slot="dialog-overlay"
      data-state="open"
      className={cn(className)}
      onClick={() => onOpenChange?.(false)}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  open,
  onOpenChange,
  showCloseButton = true,
  ...props
}: React.ComponentProps<"div"> & {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showCloseButton?: boolean
}) {
  const contentRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange?.(false)
      }
    },
    [onOpenChange]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div data-slot="dialog-portal">
      <DialogOverlay onOpenChange={onOpenChange} />
      <div
        ref={contentRef}
        data-slot="dialog-content"
        role="dialog"
        aria-modal="true"
        className={cn(className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <Button
            data-slot="dialog-close"
            variant="ghost"
            className="absolute top-2 right-2"
            size="icon-sm"
            onClick={() => onOpenChange?.(false)}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </Button>
        )}
      </div>
    </div>
  )
}

function DialogClose({
  onOpenChange,
  onClick,
  ...props
}: React.ComponentProps<"button"> & { onOpenChange?: (open: boolean) => void }) {
  return (
    <button
      data-slot="dialog-close"
      type="button"
      onClick={(e) => {
        onClick?.(e)
        onOpenChange?.(false)
      }}
      {...props}
    />
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(className)}
      {...props}
    >
      {children}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="dialog-title"
      className={cn(className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="dialog-description"
      className={cn(className)}
      {...props}
    />
  )
}

function DialogPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
