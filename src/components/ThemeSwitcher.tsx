import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";
const options = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor },
] as const;
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem("aigraph-theme");
      if (saved === "light" || saved === "dark" || saved === "system")
        return saved;
    } catch {
      /* Storage can be unavailable in private contexts. */
    }
    return "system";
  });
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
    };
    apply();
    try {
      localStorage.setItem("aigraph-theme", theme);
    } catch {
      /* The theme still works without persistence. */
    }
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  return (
    <div className="theme-switcher" role="group" aria-label="页面风格">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          aria-label={`${label}风格`}
          title={`${label}风格`}
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
