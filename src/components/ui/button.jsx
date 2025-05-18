import React from "react";

export function Button({ children, variant = "default", size = "md", ...props }) {
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 text-gray-800 bg-white hover:bg-gray-100",
    ghost: "bg-transparent text-gray-600 hover:text-gray-900"
  };

  const sizes = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    icon: "p-2"
  };

  return (
    <button className={`${variants[variant]} ${sizes[size]} rounded`} {...props}>
      {children}
    </button>
  );
}
