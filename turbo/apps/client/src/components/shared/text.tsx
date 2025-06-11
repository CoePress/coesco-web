import React from "react";

type TextProps = {
  as?: "h1" | "h2" | "h3" | "h4" | "p";
  children: React.ReactNode;
  className?: string;
};

const Text = ({ as = "p", children, className = "" }: TextProps) => {
  const baseStyles: {
    [key in NonNullable<TextProps["as"]>]: string;
  } = {
    h1: "text-text font-bold text-4xl",
    h2: "text-text font-semibold text-3xl",
    h3: "text-text font-semibold text-2xl",
    h4: "text-text font-medium text-xl",
    p: "text-text-muted text-base",
  };

  const Component = as;

  return (
    <Component className={`${baseStyles[as]} ${className}`}>
      {children}
    </Component>
  );
};

export default Text;
