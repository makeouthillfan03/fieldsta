import { useCallback, useEffect, useState } from "react";

// Shared across every page that needs to react to or toggle the theme --
// previously duplicated inline in DemoLanding.jsx; LiveDemo.jsx needs the
// same thing and duplicating it a second time isn't worth it.
export function useIsDarkTheme() {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark"
  );
  useEffect(() => {
    const handler = (e) => setDark(e.detail === "dark");
    window.addEventListener("fieldsta-theme", handler);
    return () => window.removeEventListener("fieldsta-theme", handler);
  }, []);
  return dark;
}

export function ThemeToggle() {
  const dark = useIsDarkTheme();

  const toggle = useCallback(() => {
    const next = !dark;
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch (e) {}
    window.dispatchEvent(new CustomEvent("fieldsta-theme", { detail: next ? "dark" : "light" }));
  }, [dark]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(var(--text-rgb),0.15)] text-[var(--text)] hover:border-[rgba(var(--text-rgb),0.4)]"
    >
      {dark ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
