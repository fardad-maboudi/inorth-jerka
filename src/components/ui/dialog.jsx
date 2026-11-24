import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;
export const DialogOverlay = React.forwardRef(function DialogOverlay({ className, ...props }, ref) { return <DialogPrimitive.Overlay ref={ref} className={cn("fixed inset-0 z-50 bg-foreground/70", className)} {...props} />; });
export const DialogContent = React.forwardRef(function DialogContent({ className, children, ...props }, ref) { return <DialogPortal><DialogOverlay /><DialogPrimitive.Content ref={ref} className={cn("fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-surface shadow-lg sm:rounded-surface", className)} {...props}>{children}<DialogPrimitive.Close className="absolute end-4 top-4 rounded-sm opacity-70 hover:opacity-100"><X className="h-4 w-4" /><span className="sr-only">Close</span></DialogPrimitive.Close></DialogPrimitive.Content></DialogPortal>; });
export function DialogHeader({ className, ...props }) { return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-start", className)} {...props} />; }
export function DialogFooter({ className, ...props }) { return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />; }
export const DialogTitle = React.forwardRef(function DialogTitle({ className, ...props }, ref) { return <DialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />; });
export const DialogDescription = React.forwardRef(function DialogDescription({ className, ...props }, ref) { return <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />; });
