import "./ImageThumbnailElement.css";
import { ICON_CLOSE } from "../icons";

@tag("image-thumbnail-element")
export class ImageThumbnailElement extends HTMLElement {
  #src = "";
  get src(): string {
    return this.#src;
  }
  set src(src: string) {
    this.#src = src;
    this.style.setProperty("--image", `url(${src})`);
  }
  get deletable() {
    return this.hasAttribute("deletable");
  }
  set deletable(value: boolean) {
    if (value) this.setAttribute("deletable", "");
    else this.removeAttribute("deletable");
  }

  constructor() {
    super();
    this.replaceChildren(
      createElement("button", {
        className: "delete",
        innerHTML: ICON_CLOSE,
        onclick: this.remove.bind(this),
      }),
    );
  }
}
