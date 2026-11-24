import * as React from "react";
import { cn } from "@/lib/utils";

/** Responsive table: the wrapper scrolls horizontally instead of breaking the page. */
export const Table = React.forwardRef(function Table({ className, ...props }, ref) {
  return (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
});
export const TableHeader = React.forwardRef(function TableHeader({ className, ...props }, ref) {
  return <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />;
});
export const TableBody = React.forwardRef(function TableBody({ className, ...props }, ref) {
  return <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
});
export const TableFooter = React.forwardRef(function TableFooter({ className, ...props }, ref) {
  return <tfoot ref={ref} className={cn("border-t bg-subtle font-medium", className)} {...props} />;
});
export const TableRow = React.forwardRef(function TableRow({ className, ...props }, ref) {
  return <tr ref={ref} className={cn("border-b transition-colors hover:bg-subtle", className)} {...props} />;
});
export const TableHead = React.forwardRef(function TableHead({ className, ...props }, ref) {
  return <th ref={ref} scope="col" className={cn("h-control px-3 text-start align-middle font-medium text-muted-foreground", className)} {...props} />;
});
export const TableCell = React.forwardRef(function TableCell({ className, ...props }, ref) {
  return <td ref={ref} className={cn("p-3 align-middle", className)} {...props} />;
});
export const TableCaption = React.forwardRef(function TableCaption({ className, ...props }, ref) {
  return <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />;
});
