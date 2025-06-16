import { ModalWindowElement } from "../elements/ModalWindowElement";
import { ModalWindowEntryElement } from "../elements/ModalWindowEntryElement";
import { ModalWindowHeaderElement } from "../elements/ModalWindowHeaderElement";
import { PreferencesSubject } from "../state/PreferencesSubject";
import { SwitchElement } from "../elements/SwitchElement";
import { ModalWindowTitleBarElement } from "../elements/ModalWindowTitleBarElement";
import { ModalWindowBodyElement } from "../elements/ModalWindowBodyElement";

export function PreferencesModal() {
  let control: AbortController | undefined;
  let darkModeSwitch: SwitchElement;
  let smoothCornersSwitch: SwitchElement;
  let addressInput: HTMLInputElement;

  return createElement(
    ModalWindowElement,
    { label: "Preferences", onconnect, ondisconnect },
    [
      createElement(ModalWindowTitleBarElement, { label: "Preferences" }),
      createElement(ModalWindowBodyElement, {}, [
        createElement(ModalWindowHeaderElement, {
          title: "Connection",
          description: "Set the address of the Ollama instance.",
        }),
        createElement(
          ModalWindowEntryElement,
          { label: "Instance Address" },
          (addressInput = createElement("input", {
            style: "text-align: right",
            disabled: true,
            value: PreferencesSubject.current().instanceAddress,
          })),
        ),
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
      ]),
    ],
  );

  function onconnect() {
    control?.abort();
    control = new AbortController();
    PreferencesSubject.subscribe(
      ({ darkMode, smoothCorners, instanceAddress }) => {
        darkModeSwitch.checked = darkMode;
        smoothCornersSwitch.checked = smoothCorners;
        addressInput.value = instanceAddress;
      },
      control,
    );
  }

  function ondisconnect() {
    control?.abort();
    control = undefined;
  }
}
