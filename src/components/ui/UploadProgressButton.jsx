import React from "react";
import { Check, LoaderCircle } from "lucide-react";
import { Button } from "./button.jsx";
import { cn } from "@/lib/utils";

/**
 * Upload action with byte progress drawn around its perimeter. Pass `null` when
 * Content-Length is unavailable; pass `100` while awaiting server processing.
 */
export function UploadProgressButton({
  idleLabel,
  idleIcon,
  pending = false,
  progress = null,
  uploadLabel = "Uploading",
  processingLabel = "Processing…",
  complete = false,
  completeLabel = "Complete",
  locale,
  className,
  disabled,
  ...props
}) {
  const safeProgress =
    progress == null ? null : Math.max(0, Math.min(100, Math.round(progress)));
  const processing = pending && safeProgress === 100;
  const label = complete
    ? completeLabel
    : processing
      ? processingLabel
      : pending
        ? uploadLabel
        : idleLabel;
  const valueText =
    safeProgress == null
      ? undefined
      : `${safeProgress.toLocaleString(locale)}%`;

  return (
    <Button
      {...props}
      className={cn("relative isolate gap-2 overflow-hidden", className)}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
    >
      {(pending || complete) && (
        <svg
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-px z-10 size-[calc(100%-2px)] overflow-visible",
            safeProgress == null && pending && "motion-safe:animate-pulse",
          )}
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
        >
          <rect
            x="1"
            y="1"
            width="98"
            height="38"
            rx="7"
            pathLength="100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="100"
            strokeDashoffset={complete ? 0 : 100 - (safeProgress ?? 24)}
            className={cn(
              "text-brand-600 transition-[stroke-dashoffset] duration-200 ease-out",
              complete && "text-state-success",
            )}
          />
        </svg>
      )}
      {complete ? (
        <Check className="relative z-10 size-4" aria-hidden="true" />
      ) : pending ? (
        <LoaderCircle
          className="relative z-10 size-4 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      ) : (
        idleIcon
      )}
      <span className="relative z-10">{label}</span>
      {pending && safeProgress != null && !processing && (
        <span
          className="relative z-10 min-w-9 text-end text-xs tabular-nums"
          aria-hidden="true"
        >
          {valueText}
        </span>
      )}
      {pending && (
        <span
          className="sr-only"
          role="progressbar"
          aria-label={String(uploadLabel)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={safeProgress ?? undefined}
          aria-valuetext={processing ? processingLabel : valueText}
        />
      )}
      <span className="sr-only" aria-live="polite">
        {complete ? completeLabel : processing ? processingLabel : ""}
      </span>
    </Button>
  );
}

export default UploadProgressButton;
