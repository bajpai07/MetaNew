// src/components/ThemeToggle.js
import React from "react";
import useStore from "../store/useStore";

export default function ThemeToggle() {
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);

  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      {theme === "dark" ? "🌙 Dark" : "🌞 Light"}
    </button>
  );
}
