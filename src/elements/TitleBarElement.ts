import "./TitleBarElement.css";
import { ICON_CLOSE, ICON_DOCK_TO_RIGHT } from "../icons";
import { SelectElement } from "./SelectElement";
import { SideBarSubject } from "../state/SideBarSubject";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onDoubleClick } from "../utils/onDoubleClick";
import { InstalledModelsSubject } from "../state/ModelsSubject";
import { SelectedModelSubject } from "../state/SelectedModelSubject";

@tag("title-bar-element")
export class TitleBarElement extends HTMLElement {
  private dockButton: HTMLButtonElement;
  private selectElement: SelectElement;
  private appWindow = getCurrentWindow();
  private control?: AbortController;

  constructor() {
    super();
    this.onmousedown = (event) =>
      !event.button && this.appWindow.startDragging();
    this.replaceChildren(
      createElement("div", { className: "left" }, [
        (this.dockButton = createElement("button", {
          innerHTML: ICON_DOCK_TO_RIGHT,
          onmousedown: stopPropagation,
          onclick: () =>
            SideBarSubject.update((state) => ({ ...state, open: !state.open })),
        })),
      ]),
      createElement("div", { className: "center" }, [
        (this.selectElement = createElement(SelectElement, {
          onmousedown: stopPropagation,
          onchange: () =>
            SelectedModelSubject.next(this.selectElement.selected),
        })),
      ]),
      createElement("div", { className: "right" }, [
        createElement("button", {
          className: "active circle",
          innerHTML: ICON_CLOSE,
          onmousedown: stopPropagation,
          onclick: () => this.appWindow.close(),
        }),
      ]),
    );
  }

  connectedCallback() {
    this.control?.abort();
    this.control = new AbortController();
    SideBarSubject.subscribe(({ open }) => {
      if (open) this.dockButton.classList.add("active");
      else this.dockButton.classList.remove("active");
    }, this.control);
    InstalledModelsSubject.subscribe((instances) => {
      this.selectElement.options = instances.map((instance) => ({
        label: instance.name,
        value: instance.name,
      }));
    }, this.control);
    SelectedModelSubject.subscribe((selected) => {
      this.selectElement.selected = selected;
    }, this.control);
    onDoubleClick(
      this,
      () => this.appWindow.toggleMaximize(),
      this.control.signal,
    );
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
  }
}

function stopPropagation(event: Event) {
  event.stopPropagation();
}
