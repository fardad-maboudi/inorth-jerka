import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function Breadcrumb(props) {
  return <nav aria-label="breadcrumb" {...props} />;
}
export const BreadcrumbList = React.forwardRef(function BreadcrumbList({ className, ...props }, ref) {
  return <ol ref={ref} className={cn("flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground", className)} {...props} />;
});
export const BreadcrumbItem = React.forwardRef(function BreadcrumbItem({ className, ...props }, ref) {
  return <li ref={ref} className={cn("inline-flex items-center gap-1.5", className)} {...props} />;
});
export const BreadcrumbLink = React.forwardRef(function BreadcrumbLink({ className, ...props }, ref) {
  return <a ref={ref} className={cn("transition-colors hover:text-foreground", className)} {...props} />;
});
export function BreadcrumbPage({ className, ...props }) {
  return <span role="link" aria-disabled="true" aria-current="page" className={cn("font-normal text-foreground", className)} {...props} />;
}
/** Points toward the end of the line, so it reads correctly in RTL and LTR. */
export function BreadcrumbSeparator({ children, className, ...props }) {
  return (
    <li role="presentation" aria-hidden="true" className={cn("[&>svg]:size-3.5 ltr:[&>svg]:rotate-180", className)} {...props}>
      {children ?? <ChevronLeft />}
    </li>
  );
}
