import React from "react";

export function Tabs({ children, ...props }) {
  return <div {...props}>{children}</div>;
}

export function TabsList({ children, ...props }) {
  return <div className="flex border-b" {...props}>{children}</div>;
}

export function TabsTrigger({ children, value, ...props }) {
  return (
    <button className="px-4 py-2 text-sm font-medium" data-value={value} {...props}>
      {children}
    </button>
  );
}

export function TabsContent({ children, value, ...props }) {
  return (
    <div className="py-4" data-value={value} {...props}>
      {children}
    </div>
  );
}
