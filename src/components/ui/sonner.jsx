/* eslint-disable react-refresh/only-export-components -- exports helpers beside components by design */
import { Toaster as Sonner, toast } from "sonner";

/** Mount once near the app root: `<Toaster />`; then `toast.success("ذخیره شد")`. RTL-aware via `dir`. */
export function Toaster(props) {
  return (
    <Sonner
      dir={typeof document === "undefined" ? "rtl" : document.documentElement.dir || "rtl"}
      toastOptions={{
        classNames: {
          toast: "rounded-surface border bg-background text-foreground shadow-md",
          description: "text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { toast };
