import * as React from "react";
import { cn } from "@/lib/utils";

const MenuContext = React.createContext(null);

/**
 * Action menu: arrow keys move between items, Enter/Space selects, Escape and
 * outside click close it, and focus returns to the trigger.
 */
export function DropdownMenu({ children }) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  const triggerRef = React.useRef(null);
  const id = React.useId();
  React.useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);
  const value = React.useMemo(() => ({ open, setOpen, triggerRef, id }), [open, id]);
  return (
    <MenuContext.Provider value={value}>
      <div ref={rootRef} className="relative inline-block">{children}</div>
    </MenuContext.Provider>
  );
}

function useMenu() {
  const ctx = React.useContext(MenuContext);
  if (!ctx) throw new Error("DropdownMenu parts must be inside <DropdownMenu>");
  return ctx;
}

export const DropdownMenuTrigger = React.forwardRef(function DropdownMenuTrigger({ onClick, onKeyDown, ...props }, ref) {
  const { open, setOpen, triggerRef, id } = useMenu();
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? id : undefined}
      {...props}
      ref={(node) => {
        triggerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(!open);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.key === "ArrowDown" && !open) {
          event.preventDefault();
          setOpen(true);
        }
      }}
    />
  );
});

export const DropdownMenuContent = React.forwardRef(function DropdownMenuContent({ className, align = "start", onKeyDown, ...props }, ref) {
  const { open, setOpen, triggerRef, id } = useMenu();
  const listRef = React.useRef(null);
  React.useEffect(() => {
    if (open) listRef.current?.querySelector('[role="menuitem"]:not([aria-disabled="true"])')?.focus();
  }, [open]);
  if (!open) return null;
  const items = () => [...(listRef.current?.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])') ?? [])];
  const handleKeyDown = (event) => {
    onKeyDown?.(event);
    const list = items();
    const index = list.indexOf(document.activeElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      list[(index + 1) % list.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      list[(index - 1 + list.length) % list.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      list[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      list[list.length - 1]?.focus();
    } else if (event.key === "Escape" || event.key === "Tab") {
      setOpen(false);
      if (event.key === "Escape") triggerRef.current?.focus();
    }
  };
  return (
    <div
      ref={(node) => {
        listRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      id={id}
      role="menu"
      onKeyDown={handleKeyDown}
      className={cn(
        "absolute top-full z-50 mt-2 min-w-40 rounded-surface border bg-background p-1 text-foreground shadow-md",
        align === "end" ? "end-0" : "start-0",
        className,
      )}
      {...props}
    />
  );
});

export const DropdownMenuItem = React.forwardRef(function DropdownMenuItem({ className, disabled, onSelect, onClick, ...props }, ref) {
  const { setOpen, triggerRef } = useMenu();
  const select = (event) => {
    if (disabled) return;
    onClick?.(event);
    onSelect?.(event);
    setOpen(false);
    triggerRef.current?.focus();
  };
  return (
    <div
      ref={ref}
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      onClick={select}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select(event);
        }
      }}
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-subtle focus:text-subtle-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

export function DropdownMenuLabel({ className, ...props }) {
  return <div className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props} />;
}
export function DropdownMenuSeparator({ className, ...props }) {
  return <div role="separator" className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}
