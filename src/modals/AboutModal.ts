import "./AboutModal.css";
import { ModalWindowBodyElement } from "../elements/ModalWindowBodyElement";
import { ModalWindowElement } from "../elements/ModalWindowElement";
import { ModalWindowTitleBarElement } from "../elements/ModalWindowTitleBarElement";
import { getVersion } from "@tauri-apps/api/app";

export function AboutModal() {
  let versionButton = createElement("button", {
    className: "version",
    onclick: () => navigator.clipboard.writeText(versionButton.innerText),
  });
  getVersion().then((version) => (versionButton.innerText = version));
  return createElement(
    ModalWindowElement,
    { className: "about", width: 360, height: 400 },
    [
      createElement(ModalWindowTitleBarElement),
      createElement(ModalWindowBodyElement, {}, [
        createElement("div", { className: "head" }, [
          createElement("img", { src: "/icon.svg", height: 192 }),
          createElement("h1", {}, "Hollama"),
          createElement("p", {}, "Desktop client for Ollama"),
          versionButton,
        ]),
      ]),
    ],
  );
}
