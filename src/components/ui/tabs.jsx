import * as React from "react";

export function Tabs({ children, ...props }) {
  return <div {...props}>{children}</div>;
}

export function TabsList({ children, className = "", ...props }) {
  return <div className={`inline-flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`} {...props}>{children}</div>;
}

export function TabsTrigger({ children, value, className = "", ...props }) {
  return (
    <button className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-primary data-[state=active]:bg-white data-[state=active]:text-black ${className}`} {...props}>
      {children}
    </button>
  );
}

export function TabsContent({ children, value, className = "", ...props }) {
  return <div className={`mt-2 ${className}`} {...props}>{children}</div>;
}
