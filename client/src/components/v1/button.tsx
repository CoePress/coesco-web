import React from "react";
import { Link } from "react-router-dom";

type ButtonProps = {
  onClick?: () => void;
  variant?:
    | "primary"
    | "secondary"
    | "primary-outline"
    | "secondary-outline"
    | "ghost"
    | "destructive"
    | "disabled";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  disabled?: boolean;
  as?: "button" | "a";
  href?: string;
};

const Button = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  as = "button",
  href = "#",
}: ButtonProps) => {
  const variantStyles: {
    [key in NonNullable<ButtonProps["variant"]>]: string;
  } = {
    primary:
      "border-primary bg-primary text-foreground hover:bg-primary/80 hover:border-primary/80 cursor-pointer",
    secondary:
      "border-text bg-text text-foreground hover:bg-text/80 hover:border-text/80 cursor-pointer",
    "primary-outline":
      "border-primary text-primary hover:bg-primary/15 hover:border-primary/15 cursor-pointer",
    "secondary-outline":
      "border-border bg-transparent text-text/75 hover:bg-text/15 hover:border-text/15 cursor-pointer",
    ghost:
      "border-transparent bg-transparent text-text-muted hover:bg-surface cursor-pointer",
    destructive:
      "border-error bg-error text-foreground hover:bg-error/80 hover:border-error/80 cursor-pointer",
    disabled: "border-border bg-surface text-text-muted cursor-not-allowed",
  };

  const sizeStyles: {
    [key in NonNullable<ButtonProps["size"]>]: string;
  } = {
    sm: "px-2 py-1 text-sm",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const baseStyles =
    "border rounded justify-center text-sm flex items-center gap-2 transition-all duration-300";

  const finalStyles = `${baseStyles} ${
    variantStyles[disabled ? "disabled" : variant]
  } ${sizeStyles[size]}`;

  if (as === "a") {
    return (
      <Link
        to={href}
        onClick={disabled ? undefined : onClick}
        className={finalStyles}
        aria-disabled={disabled}>
        {children}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={finalStyles}
      type="button">
      {children}
    </button>
  );
};

export default Button;
