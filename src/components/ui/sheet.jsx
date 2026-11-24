import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

/**
 * Bottom/side sheet built on vaul (drag to dismiss on touch). `direction`:
 * "bottom" (default), "right" or "left" — pick the side that matches the
 * reading direction for navigation drawers.
 */
export function Sheet({ direction = "bottom", ...props }) {
  return <DrawerPrimitive.Root direction={direction} {...props} />;
}
export const SheetTrigger = DrawerPrimitive.Trigger;
export const SheetClose = DrawerPrimitive.Close;
export const SheetOverlay = React.forwardRef(function SheetOverlay({ className, ...props }, ref) {
  return <DrawerPrimitive.Overlay ref={ref} className={cn("fixed inset-0 z-50 bg-foreground/70", className)} {...props} />;
});
export const SheetContent = React.forwardRef(function SheetContent({ className, children, ...props }, ref) {
  return (
    <DrawerPrimitive.Portal>
      <SheetOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 flex flex-col gap-4 border bg-background p-surface text-foreground shadow-lg outline-none",
          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:max-h-[85dvh] data-[vaul-drawer-direction=bottom]:rounded-t-surface",
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-4/5 data-[vaul-drawer-direction=right]:max-w-sm",
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-4/5 data-[vaul-drawer-direction=left]:max-w-sm",
          className,
        )}
        {...props}
      >
        {children}
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  );
});
export function SheetHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5 text-start", className)} {...props} />;
}
export function SheetFooter({ className, ...props }) {
  return <div className={cn("mt-auto flex flex-col gap-2", className)} {...props} />;
}
export const SheetTitle = React.forwardRef(function SheetTitle({ className, ...props }, ref) {
  return <DrawerPrimitive.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />;
});
export const SheetDescription = React.forwardRef(function SheetDescription({ className, ...props }, ref) {
  return <DrawerPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />;
});
