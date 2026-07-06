"use client";

import { X } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type CloseButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function CloseButton({ className = "", ...props }: CloseButtonProps) {
  return (
    <button
      type="button"
      aria-label="Close"
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-accent ${className}`}
      {...props}
    >
      <X className="h-4 w-4" />
    </button>
  );
}