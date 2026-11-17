"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Collapsible = React.forwardRef<
  HTMLDivElement,
  {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultOpen?: boolean;
    disabled?: boolean;
    className?: string;
    children?: React.ReactNode;
  } & React.HTMLAttributes<HTMLDivElement>
>(({ open: controlledOpen, onOpenChange, defaultOpen, disabled, className, children, ...props }, ref) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen ?? false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (newValue: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(newValue);
    }
    onOpenChange?.(newValue);
  };

  return (
    <CollapsibleContext.Provider value={{ open: !!open, setOpen, disabled }}>
      <div
        ref={ref}
        data-state={open ? "open" : "closed"}
        className={cn(className)}
        {...props}
      >
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
})
Collapsible.displayName = "Collapsible"

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, onClick, ...props }, ref) => {
  const { open, setOpen, disabled } = useCollapsible();

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        setOpen(!open);
      }}
      data-state={open ? "open" : "closed"}
      className={cn(className)}
      {...props}
    >
      {children}
    </button>
  )
})
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open } = useCollapsible();

  if (!open) return null;

  return (
    <div
      ref={ref}
      data-state="open"
      className={cn("overflow-hidden", className)}
      {...props}
    >
      {children}
    </div>
  )
})
CollapsibleContent.displayName = "CollapsibleContent"

/* Context */
interface CollapsibleContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  disabled?: boolean;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | undefined>(undefined);

function useCollapsible() {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error("useCollapsible must be used within a Collapsible");
  }
  return context;
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
