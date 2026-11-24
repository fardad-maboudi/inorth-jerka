import * as React from "react";
import { cn } from "@/lib/utils";

/** Accessible on/off toggle. Controlled (`checked` + `onCheckedChange`) or uncontrolled (`defaultChecked`). */
export const Switch = React.forwardRef(function Switch(
  { className, checked, defaultChecked = false, onCheckedChange, disabled, ...props },
  ref,
) {
  const [inner, setInner] = React.useState(defaultChecked);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : inner;
  const toggle = () => {
    if (disabled) return;
    if (!isControlled) setInner(!on);
    onCheckedChange?.(!on);
  };
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={on}
      data-state={on ? "checked" : "unchecked"}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        "inline-flex h-6 w-11 shrink-0 items-center rounded-pill border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none block size-5 rounded-pill bg-background shadow-sm transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 rtl:data-[state=checked]:-translate-x-5"
        data-state={on ? "checked" : "unchecked"}
      />
    </button>
  );
});

export default Switch;
