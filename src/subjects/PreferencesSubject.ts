import { Subject } from "../Subject";

export interface Preferences {
  darkMode: boolean;
  smoothCorners: boolean;
}

export const PREFERENCES: Preferences = Object.freeze({
  darkMode: false,
  smoothCorners: true,
});

export const PreferencesSubject = new Subject<Preferences>(
  (() => {
    const stored = localStorage.getItem("preferences");
    if (stored) return { ...PREFERENCES, ...JSON.parse(stored) };
    return { ...PREFERENCES };
  })(),
);

PreferencesSubject.subscribe((preferences) => {
  localStorage.setItem("preferences", JSON.stringify(preferences));
  const { darkMode, smoothCorners } = preferences;
  if (darkMode) document.documentElement.setAttribute("dark", "");
  else document.documentElement.removeAttribute("dark");
  if (smoothCorners)
    document.documentElement.setAttribute("smooth-corners", "");
  else document.documentElement.removeAttribute("smooth-corners");
}, null);
