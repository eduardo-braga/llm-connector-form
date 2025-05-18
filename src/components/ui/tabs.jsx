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
      className={\`
        inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium
        ring-offset-background transition-all
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        disabled:pointer-events-none disabled:opacity-50
        data-[state=active]:bg-white data-[state=active]:text-black
        hover:bg-muted hover:text-foreground
        \${className}
      \`}
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
