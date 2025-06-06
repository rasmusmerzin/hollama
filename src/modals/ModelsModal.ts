import "./ModelsModal.css";
import { ModalWindowBodyElement } from "../elements/ModalWindowBodyElement";
import { ModalWindowElement } from "../elements/ModalWindowElement";
import { ModalWindowEntryElement } from "../elements/ModalWindowEntryElement";
import { ModalWindowHeaderElement } from "../elements/ModalWindowHeaderElement";
import { ModalWindowTitleBarElement } from "../elements/ModalWindowTitleBarElement";
import { Model, ModelsSubject } from "../subjects/ModelsSubject";
import { TagElement } from "../elements/TagElement";

export function ModelsModal() {
  let bodyElement: ModalWindowBodyElement;
  let titleBar: ModalWindowTitleBarElement;
  let control: AbortController | undefined;

  return createElement(
    ModalWindowElement,
    { className: "models", onconnect, ondisconnect, height: 1080 },
    [
      (titleBar = createElement(ModalWindowTitleBarElement, {
        label: "Models",
        searchable: true,
        onsearch: renderModels,
      })),
      (bodyElement = createElement(ModalWindowBodyElement)),
    ],
  );

  function onconnect() {
    control?.abort();
    control = new AbortController();
    ModelsSubject.subscribe(renderModels, control);
  }

  function ondisconnect() {
    control?.abort();
    control = undefined;
  }

  async function renderModels() {
    let models = Object.values(ModelsSubject.current());
    const search = (titleBar.search || "").split(" ").filter(Boolean);
    models = models.filter((model) => {
      for (const term of search) {
        if (
          !model.name.toLowerCase().includes(term.toLowerCase()) &&
          !model.description.toLowerCase().includes(term.toLowerCase())
        ) {
          return false;
        }
      }
      return true;
    });
    const installed = models.filter((model) => model.installed?.length);
    const available = models.filter((model) => !model.installed?.length);
    if (installed.length || available.length)
      bodyElement.niche.replaceChildren(
        ...(installed.length
          ? [
              createElement(ModalWindowHeaderElement, { label: "Installed" }),
              ...constructModelEntries(installed),
            ]
          : []),
        ...(available.length
          ? [
              createElement(ModalWindowHeaderElement, { label: "Available" }),
              ...constructModelEntries(available),
            ]
          : []),
      );
    else
      bodyElement.niche.replaceChildren(
        createElement("div", { className: "info" }, "No models found."),
      );
  }

  function constructModelEntries(models: Model[]) {
    return models.map((model, i) =>
      createElement(ModalWindowEntryElement, {
        label: createElement(
          "div",
          { style: "display: flex; align-items: center; gap: 4px;" },
          [
            createElement(
              "span",
              { className: "name", style: "margin-right: 4px" },
              model.name,
            ),
            ...model.tags.map((tag) =>
              createElement(
                TagElement,
                { disabled: !model.installed?.includes(tag) },
                tag,
              ),
            ),
          ],
        ),
        description: model.description,
        height: 64,
        join: [
          ...(i > 0 ? ["top"] : []),
          ...(i < models.length - 1 ? ["bottom"] : []),
        ].join(" "),
      }),
    );
  }
}
