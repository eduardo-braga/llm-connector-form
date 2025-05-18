import * as React from "react";

export function Textarea({ className = "", ...props }) {
  return <textarea className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ${className}`} {...props} />;
}
