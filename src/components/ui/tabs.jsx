import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

export function Tabs({ children, className = "", ...props }) {
  return <TabsPrimitive.Root className={"w-full " + className} {...props}>{children}</TabsPrimitive.Root>;
}

export function TabsList({ children, className = "", ...props }) {
  return (
    <TabsPrimitive.List
      className={
        "inline-flex items-center justify-start gap-2 rounded-md bg-gray-100 p-1 " +
        "text-muted-foreground shadow-inner " + className
      }
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({ children, className = "", ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium " +
        "transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
        "disabled:pointer-events-none disabled:opacity-50 " +
        "data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm " +
        "hover:bg-white hover:text-black " +
        className
      }
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({ children, className = "", ...props }) {
  return (
    <TabsPrimitive.Content className={"pt-4 " + className} {...props}>
      {children}
    </TabsPrimitive.Content>
  );
}
