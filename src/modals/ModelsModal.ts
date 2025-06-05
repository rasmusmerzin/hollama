import { ModalWindowBodyElement } from "../elements/ModalWindowBodyElement";
import { ModalWindowElement } from "../elements/ModalWindowElement";
import { ModalWindowEntryElement } from "../elements/ModalWindowEntryElement";
import { ModalWindowHeaderElement } from "../elements/ModalWindowHeaderElement";
import { ModalWindowTitleBarElement } from "../elements/ModalWindowTitleBarElement";
import { TagElement } from "../elements/TagElement";
import { Model, ModelsSubject } from "../subjects/ModelsSubject";

export function ModelsModal() {
  let bodyElement: ModalWindowBodyElement;
  let control: AbortController | undefined;

  return createElement(
    ModalWindowElement,
    { className: "models", onconnect, ondisconnect, height: 1080 },
    [
      createElement(ModalWindowTitleBarElement, { label: "Models" }),
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

  async function renderModels(models: Record<string, Model>) {
    const installed = Object.values(models).filter(
      (model) => model.installed?.length,
    );
    const available = Object.values(models).filter(
      (model) => !model.installed?.length,
    );
    bodyElement.niche.replaceChildren(
      createElement(ModalWindowHeaderElement, {
        label: "Installed",
      }),
      ...constructModelEntries(installed),
      createElement(ModalWindowHeaderElement, {
        label: "Available",
      }),
      ...constructModelEntries(available),
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
