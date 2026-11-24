/* eslint-disable react-refresh/only-export-components -- exports helpers beside components by design */
import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * One labelled form control with hint and error, wired for screen readers.
 * The child control receives `id`, `aria-invalid` and `aria-describedby`.
 *
 *   <Field label="موبایل" error={errors.phone} hint="مثلاً ۰۹۱۲…">
 *     <Input name="phone" />
 *   </Field>
 */
export function Field({ label, hint, error, required, className, children }) {
  const id = React.useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = React.isValidElement(children)
    ? React.cloneElement(children, {
        id: children.props.id ?? id,
        "aria-invalid": error ? true : children.props["aria-invalid"],
        "aria-describedby": describedBy,
        required: children.props.required ?? required,
      })
    : children;
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label ? (
        <Label htmlFor={React.isValidElement(children) ? (children.props.id ?? id) : id}>
          {label}
          {required ? <span aria-hidden="true" className="ms-1 text-destructive">*</span> : null}
        </Label>
      ) : null}
      {control}
      {hint && !error ? <p id={hintId} className="text-sm text-muted-foreground">{hint}</p> : null}
      {error ? <p id={errorId} role="alert" className="text-sm text-destructive" data-testid="form-error">{error}</p> : null}
    </div>
  );
}

/**
 * Validate form values against a schema-like object. `schema.safeParse` (Zod)
 * or a plain `(values) => ({ field: message })` function both work. Returns a
 * `{ field: message }` map; empty means valid.
 */
export function validateValues(schema, values) {
  if (typeof schema === "function") return schema(values) || {};
  const result = schema.safeParse(values);
  if (result.success) return {};
  const errors = {};
  for (const issue of result.error?.issues ?? []) {
    const key = issue.path?.[0] != null ? String(issue.path[0]) : "_form";
    errors[key] ??= issue.message;
  }
  return errors;
}

/**
 * Small controlled-form state: values, errors, per-field setters, submit
 * handling with a pending flag. Server errors thrown by the SDK
 * (`error.details`) are mapped onto fields when they look like `{ field: msg }`.
 */
export function useFormState({ initialValues = {}, schema, onSubmit }) {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const [pending, setPending] = React.useState(false);
  const [submitError, setSubmitError] = React.useState(null);
  const setValue = React.useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }, []);
  const bind = (name) => ({
    name,
    value: values[name] ?? "",
    onChange: (event) => setValue(name, event?.target ? event.target.value : event),
  });
  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    const found = schema ? validateValues(schema, values) : {};
    setErrors(found);
    if (Object.keys(found).length) return;
    setPending(true);
    setSubmitError(null);
    try {
      await onSubmit?.(values);
    } catch (error) {
      const details = error?.details;
      if (details && typeof details === "object" && !Array.isArray(details)) {
        const fieldErrors = Object.fromEntries(
          Object.entries(details).filter(([, v]) => typeof v === "string"),
        );
        if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      }
      setSubmitError(error?.message || "ارسال انجام نشد.");
    } finally {
      setPending(false);
    }
  };
  return { values, errors, pending, submitError, setValue, setValues, bind, handleSubmit, reset: () => { setValues(initialValues); setErrors({}); setSubmitError(null); } };
}
