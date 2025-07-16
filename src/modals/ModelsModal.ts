import "./ModelsModal.css";
import {
  ICON_DELETE,
  ICON_DOWNLOAD,
  ICON_SPINNER,
  iconProgress,
} from "../icons";
import { ModalWindowBodyElement } from "../elements/ModalWindowBodyElement";
import { ModalWindowElement } from "../elements/ModalWindowElement";
import { ModalWindowEntryElement } from "../elements/ModalWindowEntryElement";
import { ModalWindowHeaderElement } from "../elements/ModalWindowHeaderElement";
import { ModalWindowTitleBarElement } from "../elements/ModalWindowTitleBarElement";
import { Model } from "../fetch/ollamaHub";
import { ModelsSubject } from "../state/ModelsSubject";
import { TagElement } from "../elements/TagElement";
import { formatBytes } from "../utils/bytes";
import {
  removeModelInstance,
  startModelDownload,
  syncModelDetails,
} from "../services/models";
import { capitalize } from "../utils/capitalize";

export function ModelsModal() {
  let infoElement: HTMLElement;
  let downloadsElement: HTMLElement;
  let installedElement: HTMLElement;
  let availableElement: HTMLElement;
  let detailsBody: ModalWindowBodyElement;
  let titleBar: ModalWindowTitleBarElement;
  let control: AbortController | undefined;

  return createElement(
    ModalWindowElement,
    { className: "models", onconnect, ondisconnect, height: 1080 },
    [
      (titleBar = createElement(ModalWindowTitleBarElement, {
        label: "Models",
        searchable: true,
        onsearch: render,
      })),
      createElement("div", { className: "container" }, [
        createElement(ModalWindowBodyElement, {}, [
          (infoElement = createElement("div", { className: "info" })),
          (downloadsElement = createElement("div")),
          (installedElement = createElement("div")),
          (availableElement = createElement("div")),
        ]),
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
    ModelsSubject.subscribe(render, control);
    addEventListener("statechange", onStateChange, control);
    addEventListener("keydown", onKeyDown, control);
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
    render();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key.length !== 1) return;
    if (ModelsSubject.current()[history.state.submodal]) return;
    titleBar.focusSearch();
  }

  function render() {
    if (history.state.submodal == null) renderList();
    else renderDetails();
  }

  function renderList() {
    let models = Object.values(ModelsSubject.current());
    const search = (titleBar.search || "")
      .toLowerCase()
      .split(" ")
      .filter(Boolean);
    models = models.filter((model) => {
      const categories = model.categories.join(" ").toLowerCase();
      for (const term of search) {
        if (
          !model.name.toLowerCase().includes(term) &&
          !model.description.toLowerCase().includes(term) &&
          !categories.includes(term)
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
      if (model.tags.some((tag) => tag.downloaded != null))
        downloading.push(model);
      else if (model.tags.some((tag) => tag.installed)) installed.push(model);
      else available.push(model);
    }
    if (installed.length || available.length) {
      downloadsElement.replaceChildren(
        ...(downloading.length
          ? [
              createElement(ModalWindowHeaderElement, { label: "Downloading" }),
              ...constructModelEntries(downloading),
            ]
          : []),
      );
      const installedKeys = installed.map((model) => model.name).join(",");
      if (installedElement.getAttribute("keys") !== installedKeys) {
        installedElement.setAttribute("keys", installedKeys);
        installedElement.replaceChildren(
          ...(installed.length
            ? [
                createElement(ModalWindowHeaderElement, { label: "Installed" }),
                ...constructModelEntries(installed),
              ]
            : []),
        );
      }
      const availableKeys = available.map((model) => model.name).join(",");
      if (availableElement.getAttribute("keys") !== availableKeys) {
        availableElement.setAttribute("keys", availableKeys);
        availableElement.replaceChildren(
          ...(available.length
            ? [
                createElement(ModalWindowHeaderElement, { label: "Available" }),
                ...constructModelEntries(available),
              ]
            : []),
        );
      }
      infoElement.replaceChildren();
    } else {
      downloadsElement.replaceChildren();
      installedElement.replaceChildren();
      installedElement.removeAttribute("keys");
      availableElement.replaceChildren();
      availableElement.removeAttribute("keys");
      infoElement.replaceChildren(
        createElement("div", { className: "center" }, "No models found."),
      );
    }
  }

  function renderDetails() {
    const model = ModelsSubject.current()[history.state.submodal];
    if (!model)
      return detailsBody.niche.replaceChildren(
        createElement("div", { className: "center" }, "Model not found."),
      );
    const tags = model.tags.filter((tag) => tag.label !== "latest");
    detailsBody.niche.replaceChildren(
      createElement("h2", { className: "name" }, [
        createElement("span", {}, model.name),
        ...model.categories.map((category) =>
          createElement(TagElement, {}, category),
        ),
      ]),
      createElement("p", {}, model.description),
      ...(tags.length
        ? [
            createElement(ModalWindowHeaderElement, { label: "Tags" }),
            ...tags.map((tag, i) => {
              const progress =
                tag.downloaded != null
                  ? tag.downloaded / (tag.size || 1)
                  : null;
              return createElement(
                ModalWindowEntryElement,
                {
                  height: 64,
                  label: `${model.name}:${tag.label}`,
                  description: [
                    tag.size && tag.downloaded != null
                      ? `${formatBytes(tag.downloaded)}/${formatBytes(tag.size)}`
                      : tag.size && formatBytes(tag.size),
                    tag.context,
                    tag.input?.map(capitalize).join(", "),
                  ]
                    .filter(Boolean)
                    .join(" • "),
                  join: [
                    ...(i > 0 ? ["top"] : []),
                    ...(i < tags.length - 1 ? ["bottom"] : []),
                  ].join(" "),
                },
                progress != null
                  ? createElement("div", {
                      className: "spinner",
                      innerHTML: progress
                        ? iconProgress(progress)
                        : ICON_SPINNER,
                    })
                  : tag.installed
                    ? createElement("button", {
                        className: "action",
                        innerHTML: ICON_DELETE,
                        onclick: () =>
                          removeModelInstance(model.name, tag.label).catch(
                            (error) =>
                              alert(
                                `Couldn't connect to Ollama instance.\n${error}`,
                              ),
                          ),
                      })
                    : createElement("button", {
                        className: "action",
                        innerHTML: ICON_DOWNLOAD,
                        onclick: () =>
                          startModelDownload(
                            `${model.name}:${tag.label}`,
                          ).catch((error) =>
                            alert(
                              `Couldn't connect to Ollama instance.\n${error}`,
                            ),
                          ),
                      }),
              );
            }),
          ]
        : []),
    );
  }

  function constructModelEntries(models: Model[]) {
    return models.map(constructModelEntry);
  }

  function constructModelEntry(model: Model, i: number, models: Model[]) {
    const inProgressTags = model.tags.filter(
      (tag) => tag.downloaded != null && tag.size != null,
    ) as { downloaded: number; size: number }[];
    const progress = inProgressTags.length
      ? (() => {
          const totalSize = inProgressTags.reduce(
            (state, item) => state + item.size,
            0,
          );
          const totalDownloaded = inProgressTags.reduce(
            (state, item) => state + item.downloaded,
            0,
          );
          return totalDownloaded / (totalSize || 1);
        })()
      : null;
    return createElement(
      ModalWindowEntryElement,
      {
        label: createElement(
          "div",
          { style: "display: flex; align-items: center; gap: 4px;" },
          [
            createElement(
              "span",
              { className: "name", style: "margin-right: 4px" },
              model.name,
            ),
            ...model.categories.map((category) =>
              createElement(TagElement, {}, category),
            ),
            ...model.tags
              .filter(
                (tag) =>
                  (tag.label !== "latest" && tag.installed) ||
                  tag.downloaded != null,
              )
              .map((tag) =>
                createElement(TagElement, { disabled: true }, tag.label),
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
              ...history.state,
              submodal: model.name,
              modalIndex: (history.state.modalIndex || 0) + 1,
            },
            "",
          ),
      },
      progress != null &&
        createElement("div", {
          className: "spinner",
          innerHTML: progress ? iconProgress(progress) : ICON_SPINNER,
        }),
    );
  }
}
