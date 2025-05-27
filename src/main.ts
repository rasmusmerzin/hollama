import "./styles.css";
import "@merzin/element";

const app = document.getElementById("app")!;

let counter = 0;
const button = createElement("button", {
  innerText: `Counter: ${counter}`,
  onclick: () => (button.innerText = `Counter: ${++counter}`),
});

app.append(button);
