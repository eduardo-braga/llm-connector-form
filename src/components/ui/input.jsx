import * as React from "react";

export function Input({ className = "", ...props }) {
  return <input className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ${className}`} {...props} />;
}
