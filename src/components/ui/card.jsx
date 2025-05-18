import * as React from "react";

export function Card({ children, className = "", ...props }) {
  return <div className={`rounded-2xl border bg-white text-card-foreground shadow ${className}`} {...props}>{children}</div>;
}

export function CardContent({ children, className = "", ...props }) {
  return <div className={`p-4 ${className}`} {...props}>{children}</div>;
}
