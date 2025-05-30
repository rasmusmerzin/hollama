import { ModalWindowElement } from "../elements/ModalWindowElement";
import { ModalWindowEntryElement } from "../elements/ModalWindowEntryElement";
import { ModalWindowHeaderElement } from "../elements/ModalWindowHeaderElement";
import { PreferencesSubject } from "../Preferences";
import { SwitchElement } from "../elements/SwitchElement";

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
          onclick: () =>
            PreferencesSubject.update((state) => ({
              ...state,
              darkMode: !state.darkMode,
            })),
        },
        (darkModeSwitch = createElement(SwitchElement)),
      ),
      createElement(
        ModalWindowEntryElement,
        {
          label: "Smooth Corners",
          join: "top",
          onclick: () =>
            PreferencesSubject.update((state) => ({
              ...state,
              smoothCorners: !state.smoothCorners,
            })),
        },
        (smoothCornersSwitch = createElement(SwitchElement)),
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
