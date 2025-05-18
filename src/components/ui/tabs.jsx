import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

export function Tabs({ children, className = "", ...props }) {
  return <TabsPrimitive.Root className={"w-full " + className} {...props}>{children}</TabsPrimitive.Root>;
}

export function TabsList({ children, className = "", ...props }) {
  return (
    <TabsPrimitive.List
      className={
        "flex w-full items-center justify-start border-b border-gray-200 " + className
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
        "px-4 py-2 -mb-px border-b-2 text-sm font-medium text-gray-600 " +
        "data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 " +
        "hover:text-blue-500 hover:border-blue-300 " +
        "transition-colors duration-200 ease-in-out " +
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
