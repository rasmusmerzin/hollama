import { Subject } from "./Subject";

export interface Preferences {
  darkMode: boolean;
  smoothCorners: boolean;
  instanceAddress: string;
}

export const PREFERENCES: Preferences = Object.freeze({
  darkMode: false,
  smoothCorners: true,
  instanceAddress: "http://localhost:11434",
});

export const PreferencesSubject = new Subject<Preferences>(
  (() => {
    const stored = localStorage.getItem("preferences");
    if (stored) return { ...PREFERENCES, ...JSON.parse(stored) };
    return { ...PREFERENCES };
  })(),
);

setTimeout(() => {
  PreferencesSubject.subscribe((preferences) => {
    localStorage.setItem("preferences", JSON.stringify(preferences));
    const { darkMode, smoothCorners } = preferences;
    if (darkMode) document.documentElement.setAttribute("dark", "");
    else document.documentElement.removeAttribute("dark");
    if (smoothCorners)
      document.documentElement.setAttribute("smooth-corners", "");
    else document.documentElement.removeAttribute("smooth-corners");
  }, null);
});
