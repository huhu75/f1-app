"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

export const Button = ({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) => {
  const baseStyles = "relative inline-flex items-center justify-center font-bold uppercase tracking-wider transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none rounded-md";
  
  const variants = {
    primary: "bg-racing-red text-white hover:bg-[#ff1e00]",
    secondary: "bg-zinc-800 text-white hover:bg-zinc-700",
    outline: "border border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white",
    ghost: "text-zinc-400 hover:text-white hover:bg-zinc-900",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px]",
    md: "px-6 py-2.5 text-xs",
    lg: "px-8 py-3.5 text-sm",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
};
