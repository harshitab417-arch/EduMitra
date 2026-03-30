import { useEffect, useMemo, useState } from "react";
import { Moon, Sun } from "lucide-react";

function getInitialTheme(): "light" | "dark" {
  const saved = typeof window !== "undefined" ? window.localStorage.getItem("theme") : null;
  if (saved === "light" || saved === "dark") return saved;

  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const isDark = theme === "dark";
  const title = useMemo(() => (isDark ? "Switch to light mode" : "Switch to dark mode"), [isDark]);

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={() => {
        const next: "light" | "dark" = isDark ? "light" : "dark";
        setTheme(next);
        document.documentElement.classList.toggle("dark", next === "dark");
        window.localStorage.setItem("theme", next);
      }}
      className="fixed top-4 right-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-background/70 text-foreground shadow-sm backdrop-blur hover:bg-accent/40 transition-colors"
    >
      {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
}

