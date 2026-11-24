import * as React from "react";
import { cn } from "@/lib/utils";

const PopoverContext = React.createContext(null);

/**
 * Click-to-open floating panel. Closes on outside click and Escape; focus
 * returns to the trigger. Controlled (`open` + `onOpenChange`) or uncontrolled.
 */
export function Popover({ open, defaultOpen = false, onOpenChange, children }) {
  const [inner, setInner] = React.useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : inner;
  const rootRef = React.useRef(null);
  const triggerRef = React.useRef(null);
  const id = React.useId();
  const setOpen = React.useCallback(
    (next) => {
      if (!isControlled) setInner(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );
  React.useEffect(() => {
    if (!isOpen) return undefined;
    const onPointer = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, setOpen]);
  const value = React.useMemo(() => ({ isOpen, setOpen, triggerRef, id }), [isOpen, setOpen, id]);
  return (
    <PopoverContext.Provider value={value}>
      <div ref={rootRef} className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  );
}

function usePopover() {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) throw new Error("PopoverTrigger/PopoverContent must be inside <Popover>");
  return ctx;
}

export const PopoverTrigger = React.forwardRef(function PopoverTrigger({ onClick, ...props }, ref) {
  const { isOpen, setOpen, triggerRef, id } = usePopover();
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-controls={isOpen ? id : undefined}
      {...props}
      ref={(node) => {
        triggerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(!isOpen);
      }}
    />
  );
});

/** `align`: "start" | "end" relative to the trigger (logical, so RTL-safe). */
export const PopoverContent = React.forwardRef(function PopoverContent({ className, align = "start", ...props }, ref) {
  const { isOpen, id } = usePopover();
  if (!isOpen) return null;
  return (
    <div
      ref={ref}
      id={id}
      role="dialog"
      className={cn(
        "absolute top-full z-50 mt-2 w-72 rounded-surface border bg-background p-surface text-foreground shadow-md outline-none",
        align === "end" ? "end-0" : "start-0",
        className,
      )}
      {...props}
    />
  );
});
