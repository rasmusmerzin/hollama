import "./ModelsModal.css";
import { ICON_DELETE, ICON_DOWNLOAD, ICON_SPINNER } from "../icons";
import { ModalWindowBodyElement } from "../elements/ModalWindowBodyElement";
import { ModalWindowElement } from "../elements/ModalWindowElement";
import { ModalWindowEntryElement } from "../elements/ModalWindowEntryElement";
import { ModalWindowHeaderElement } from "../elements/ModalWindowHeaderElement";
import { ModalWindowTitleBarElement } from "../elements/ModalWindowTitleBarElement";
import { Model } from "../services/ollama";
import {
  ModelsSubject,
  removeModel,
  startModelDownload,
  syncModelDetails,
} from "../subjects/ModelsSubject";
import { TagElement } from "../elements/TagElement";
import { stripObject } from "../stripObject";
import { throttle } from "../throttle";
import { formatByteCount } from "../formatByteCount";

export function ModelsModal() {
  let listBody: ModalWindowBodyElement;
  let detailsBody: ModalWindowBodyElement;
  let titleBar: ModalWindowTitleBarElement;
  let control: AbortController | undefined;

  const renderThrottled = throttle(render, 100);

  return createElement(
    ModalWindowElement,
    { className: "models", onconnect, ondisconnect, height: 1080 },
    [
      (titleBar = createElement(ModalWindowTitleBarElement, {
        label: "Models",
        searchable: true,
        onsearch: renderThrottled,
      })),
      createElement("div", { className: "container" }, [
        (listBody = createElement(ModalWindowBodyElement)),
        (detailsBody = createElement(ModalWindowBodyElement, {
          className: "details hidden",
        })),
      ]),
    ],
  );

  function onconnect() {
    control?.abort();
    control = new AbortController();
    onStateChange();
    ModelsSubject.subscribe(renderThrottled, control);
    addEventListener("statechange", onStateChange, control);
  }

  function ondisconnect() {
    control?.abort();
    control = undefined;
  }

  function onStateChange() {
    const { submodal } = history.state;
    if (submodal == null) detailsBody.classList.add("hidden");
    else {
      detailsBody.classList.remove("hidden");
      syncModelDetails(submodal);
    }
    renderThrottled();
  }

  function render() {
    if (history.state.submodal == null) renderList();
    else renderDetails();
  }

  function renderList() {
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
    const downloading: Model[] = [];
    const installed: Model[] = [];
    const available: Model[] = [];
    for (const model of models) {
      if (model.tags.some((tag) => tag.downloading)) downloading.push(model);
      else if (model.tags.some((tag) => tag.installed)) installed.push(model);
      else available.push(model);
    }
    if (installed.length || available.length)
      listBody.niche.replaceChildren(
        ...(downloading.length
          ? [
              createElement(ModalWindowHeaderElement, { label: "Downloading" }),
              ...constructModelEntries(downloading),
            ]
          : []),
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
      listBody.niche.replaceChildren(
        createElement("div", { className: "center" }, "No models found."),
      );
  }

  function renderDetails() {
    const { submodal } = history.state;
    const model = ModelsSubject.current()[submodal];
    if (!model)
      return detailsBody.niche.replaceChildren(
        createElement("div", { className: "center" }, "Model not found."),
      );
    detailsBody.niche.replaceChildren(
      createElement("h2", { className: "name" }, [
        createElement("span", {}, model.name),
        ...model.categories.map((category) =>
          createElement(TagElement, {}, category),
        ),
      ]),
      createElement("p", {}, model.description),
      ...(model.tags.length
        ? [
            createElement(ModalWindowHeaderElement, { label: "Tags" }),
            ...model.tags.map((tag, i) =>
              createElement(
                ModalWindowEntryElement,
                {
                  height: 64,
                  label: `${model.name}:${tag.label}`,
                  description: [
                    tag.size && tag.completed != null
                      ? `${formatByteCount(tag.completed)}/${tag.size}`
                      : tag.size,
                    tag.context,
                    tag.input?.join(", "),
                  ]
                    .filter(Boolean)
                    .join(" • "),
                  join: [
                    ...(i > 0 ? ["top"] : []),
                    ...(i < model.tags.length - 1 ? ["bottom"] : []),
                  ].join(" "),
                },
                tag.downloading
                  ? createElement("div", {
                      className: "spinner",
                      innerHTML: ICON_SPINNER,
                    })
                  : tag.installed
                    ? createElement("button", {
                        className: "action",
                        innerHTML: ICON_DELETE,
                        onclick: () =>
                          removeModel(`${model.name}:${tag.label}`),
                      })
                    : createElement("button", {
                        className: "action",
                        innerHTML: ICON_DOWNLOAD,
                        onclick: () =>
                          startModelDownload(`${model.name}:${tag.label}`),
                      }),
              ),
            ),
          ]
        : []),
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
                { disabled: !tag.installed },
                tag.label,
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
        onclick: () =>
          history.pushState(
            {
              ...stripObject(history.state),
              submodal: model.name,
              modalIndex: (history.state.modalIndex || 0) + 1,
            },
            "",
          ),
      }),
    );
  }
}
