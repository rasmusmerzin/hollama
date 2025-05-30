import { ModalWindowElement } from "../elements/ModalWindowElement";
import { ModalWindowEntryElement } from "../elements/ModalWindowEntryElement";
import { ModalWindowHeaderElement } from "../elements/ModalWindowHeaderElement";
import { Subject } from "../Subject";
import { SwitchElement } from "../elements/SwitchElement";

export const PreferencesSubject = new Subject({
  darkMode: false,
  smoothCorners: true,
});

PreferencesSubject.subscribe(({ darkMode, smoothCorners }) => {
  if (darkMode) document.documentElement.setAttribute("dark", "");
  else document.documentElement.removeAttribute("dark");
  if (smoothCorners)
    document.documentElement.setAttribute("smooth-corners", "");
  else document.documentElement.removeAttribute("smooth-corners");
}, null!);

export function PreferencesModal() {
  let control: AbortController | undefined;
  let darkModeSwitch: SwitchElement;
  let smoothCornersSwitch: SwitchElement;

  return createElement(
    ModalWindowElement,
    { label: "Preferences", onconnect, ondisconnect },
    [
      createElement(ModalWindowHeaderElement, {
        title: "Appearance",
        description: "Customize the look and feel of the application.",
      }),
      createElement(
        ModalWindowEntryElement,
        {
          label: "Dark Mode",
          join: "bottom",
        },
        (darkModeSwitch = createElement(SwitchElement, {
          onchange: () =>
            PreferencesSubject.update((state) => ({
              ...state,
              darkMode: darkModeSwitch.checked,
            })),
        })),
      ),
      createElement(
        ModalWindowEntryElement,
        {
          label: "Smooth Corners",
          join: "top",
        },
        (smoothCornersSwitch = createElement(SwitchElement, {
          onchange: () =>
            PreferencesSubject.update((state) => ({
              ...state,
              smoothCorners: smoothCornersSwitch.checked,
            })),
        })),
      ),
    ],
  );

  function onconnect() {
    control?.abort();
    control = new AbortController();
    PreferencesSubject.subscribe(({ darkMode, smoothCorners }) => {
      darkModeSwitch.checked = darkMode;
      smoothCornersSwitch.checked = smoothCorners;
    }, control);
  }

  function ondisconnect() {
    control?.abort();
    control = undefined;
  }
}
