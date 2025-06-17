import "./AlertModal.css";
import { ModalWindowElement } from "../elements/ModalWindowElement";

export function AlertModal() {
  return createElement(
    ModalWindowElement,
    {
      className: "alert",
      width: 360,
      height: 180,
    },
    [
      createElement("h2", { innerText: "Notice" }),
      createElement("p", {
        innerText: history.state.message || "An alert has been triggered.",
      }),
      createElement("button", {
        onclick: () => history.back(),
        innerText: "Close",
      }),
    ],
  );
}
