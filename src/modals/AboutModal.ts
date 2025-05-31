import "./AboutModal.css";
import { ModalWindowElement } from "../elements/ModalWindowElement";
import { getVersion } from "@tauri-apps/api/app";

export function AboutModal() {
  let versionButton = createElement("button", {
    className: "version",
    onclick: () => navigator.clipboard.writeText(versionButton.innerText),
  });
  getVersion().then((version) => (versionButton.innerText = version));
  return createElement(
    ModalWindowElement,
    { className: "about", width: 360, height: 360 },
    [
      createElement("div", { className: "head" }, [
        createElement("img", { src: "/icon.svg", height: 192 }),
        createElement("h1", {}, "Hollama"),
        createElement("p", {}, "Desktop client for Ollama"),
        versionButton,
      ]),
    ],
  );
}
