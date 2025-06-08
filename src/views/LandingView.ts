import "./LandingView.css";
import { MessageInputElement } from "../elements/MessageInputElement";

@tag("landing-view")
export class LandingView extends HTMLElement {
  constructor() {
    super();
    this.replaceChildren(
      createElement("h1", {}, "What's on your mind?"),
      createElement(MessageInputElement),
    );
  }
}
