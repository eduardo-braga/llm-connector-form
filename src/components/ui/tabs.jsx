import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

export function Tabs({ children, className = "", ...props }) {
  return <TabsPrimitive.Root className={className} {...props}>{children}</TabsPrimitive.Root>;
}

export function TabsList({ children, className = "", ...props }) {
  return (
    <TabsPrimitive.List
      className={`inline-flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({ children, className = "", ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-primary data-[state=active]:bg-white data-[state=active]:text-black ${className}`}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({ children, className = "", ...props }) {
  return (
    <TabsPrimitive.Content className={`mt-2 ${className}`} {...props}>
      {children}
    </TabsPrimitive.Content>
  );
}
