import "./ModelsModal.css";
import { ModalWindowBodyElement } from "../elements/ModalWindowBodyElement";
import { ModalWindowElement } from "../elements/ModalWindowElement";
import { ModalWindowEntryElement } from "../elements/ModalWindowEntryElement";
import { ModalWindowHeaderElement } from "../elements/ModalWindowHeaderElement";
import { ModalWindowTitleBarElement } from "../elements/ModalWindowTitleBarElement";
import { getAvailableModels, getInstalledModels } from "../services/ollama";

export function ModelsModal() {
  let bodyElement: ModalWindowBodyElement;

  return createElement(ModalWindowElement, { className: "models", onconnect }, [
    createElement(ModalWindowTitleBarElement, { label: "Models" }),
    (bodyElement = createElement(ModalWindowBodyElement)),
  ]);

  function onconnect() {
    renderModels();
  }

  async function renderModels() {
    try {
      const [installed, available] = await Promise.all([
        getInstalledModels(),
        getAvailableModels(),
      ]);
      if (installed.length)
        bodyElement.niche.replaceChildren(
          createElement(ModalWindowHeaderElement, {
            label: "Installed",
          }),
          ...installed.map((model, i) =>
            createElement(ModalWindowEntryElement, {
              label: model.name,
              join: [
                ...(i > 0 ? ["top"] : []),
                ...(i < installed.length - 1 ? ["bottom"] : []),
              ].join(" "),
            }),
          ),
          createElement(ModalWindowHeaderElement, {
            label: "Available",
          }),
          ...available.map((model, i) =>
            createElement(ModalWindowEntryElement, {
              label: model.name,
              join: [
                ...(i > 0 ? ["top"] : []),
                ...(i < available.length - 1 ? ["bottom"] : []),
              ].join(" "),
            }),
          ),
        );
      else
        bodyElement.niche.replaceChildren(
          createElement("div", { className: "info" }, "No models installed."),
        );
    } catch (error) {
      bodyElement.niche.replaceChildren(
        createElement("div", { className: "info" }, [
          createElement("p", {}, "Failed to load models."),
          createElement("p", {}, "Check your Ollama server connection."),
        ]),
      );
    }
  }
}
