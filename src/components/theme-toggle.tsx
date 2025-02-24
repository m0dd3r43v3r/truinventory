"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative rounded-md p-2 hover:bg-primary/10"
    >
      <div className="relative h-5 w-5">
        <Sun className="absolute inset-0 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute inset-0 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
} 