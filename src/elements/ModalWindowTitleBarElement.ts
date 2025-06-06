import "./ModalWindowTitleBarElement.css";
import { ICON_CHEVRON_LEFT, ICON_CLOSE, ICON_SEARCH } from "../icons";
import { TextInputElement } from "./TextInputElement";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onDoubleClick } from "../onDoubleClick";
import { stripObject } from "../stripObject";

@tag("modal-window-title-bar-element")
export class ModalWindowTitleBarElement extends HTMLElement {
  private appWindow = getCurrentWindow();
  private centerElement: HTMLDivElement;
  private searchButton: HTMLButtonElement;
  private submodalElement: HTMLElement;
  private searchInput: TextInputElement;
  private control?: AbortController;

  onsearch: ((value: string | null) => any) | null = null;

  get label() {
    return this.centerElement.innerText;
  }
  set label(value: string) {
    this.centerElement.innerText = value;
  }
  get searchable() {
    return this.hasAttribute("searchable");
  }
  set searchable(value: boolean) {
    if (value) this.setAttribute("searchable", "");
    else this.removeAttribute("searchable");
  }
  get search() {
    return this.getAttribute("searching");
  }

  constructor() {
    super();
    this.replaceChildren(
      createElement("div", { className: "left" }, [
        (this.searchButton = createElement("button", {
          className: "search",
          innerHTML: ICON_SEARCH,
          onmousedown: stopPropagation,
          onclick: this.toggleSearch.bind(this),
        })),
        createElement("button", {
          className: "back",
          innerHTML: ICON_CHEVRON_LEFT,
          onmousedown: stopPropagation,
          onclick: () => history.back(),
        }),
      ]),
      (this.centerElement = createElement("div", {
        className: "center",
      })),
      createElement("div", { className: "search" }, [
        (this.searchInput = createElement(TextInputElement, {
          icon: ICON_SEARCH,
          placeholder: "Search models",
          onmousedown: stopPropagation,
          onblur: () =>
            history.state.searching != null &&
            setTimeout(() => this.searchInput.focus()),
          oninput: () =>
            history.replaceState(
              {
                ...history.state,
                searching: this.searchInput.value,
              },
              "",
            ),
        })),
      ]),
      createElement("div", { className: "right" }, [
        createElement("button", {
          className: "active circle",
          innerHTML: ICON_CLOSE,
          onmousedown: stopPropagation,
          onclick: () => history.go(-1 - (history.state.modalIndex || 0)),
        }),
      ]),
      (this.submodalElement = createElement("div", { className: "submodal" })),
    );
  }

  connectedCallback() {
    this.control?.abort();
    this.control = new AbortController();
    this.addEventListener(
      "mousedown",
      (event) => !event.button && this.appWindow.startDragging(),
      this.control,
    );
    onDoubleClick(
      this,
      () => this.appWindow.toggleMaximize(),
      this.control.signal,
    );
    addEventListener(
      "statechange",
      this.onStateChange.bind(this),
      this.control,
    );
    this.onStateChange();
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
  }

  private toggleSearch() {
    if (history.state.searching != null) history.back();
    else {
      const modalIndex = (history.state.modalIndex || 0) + 1;
      history.pushState(
        { ...stripObject(history.state), searching: "", modalIndex },
        "",
      );
    }
  }

  private onStateChange() {
    const { searching, submodal } = history.state;
    if (submodal != null) {
      this.setAttribute("submodal", submodal);
      this.submodalElement.innerText = submodal;
    } else this.removeAttribute("submodal");
    if (searching != null) {
      this.setAttribute("searching", searching);
      this.searchInput.value = searching;
      this.searchInput.focus();
      this.searchButton.classList.add("active");
    } else {
      this.removeAttribute("searching");
      this.searchInput.value = "";
      this.searchButton.classList.remove("active");
    }
    this.onsearch?.(searching || null);
  }
}

function stopPropagation(event: Event) {
  event.stopPropagation();
}
