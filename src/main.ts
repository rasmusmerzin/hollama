import "./styles.css";
import "@merzin/element";
import { AboutModal } from "./modals/AboutModal";
import { AlertModal } from "./modals/AlertModal";
import { ChatView } from "./views/ChatView";
import { ImageModal } from "./modals/ImageModal";
import { LandingView } from "./views/LandingView";
import { ModelsModal } from "./modals/ModelsModal";
import { PreferencesModal } from "./modals/PreferencesModal";
import { SideBarElement } from "./elements/SideBarElement";
import { TitleBarElement } from "./elements/TitleBarElement";
import { defineRoute, startRouter } from "@merzin/router";
import { getCurrentWindow } from "@tauri-apps/api/window";

const root = document.getElementById("root")!;
const titleBar = new TitleBarElement();
const sideBar = new SideBarElement();
const main = createElement("main");
const appWindow = getCurrentWindow();

root.append(sideBar, createElement("div", {}, [titleBar, main]));

appWindow.onResized(async () => {
  const maximized = await appWindow.isMaximized();
  if (maximized) document.documentElement.setAttribute("maximized", "");
  else document.documentElement.removeAttribute("maximized");
});

addEventListener("keydown", ({ key }) => {
  const { activeElement } = document;
  if (key === "Escape") {
    if (activeElement instanceof HTMLInputElement) {
      activeElement.blur();
      const check = () =>
        document.activeElement == activeElement && history.back();
      setTimeout(check, 1);
    } else history.back();
  } else if (key === "Enter") {
    if (activeElement instanceof HTMLInputElement) activeElement.blur();
  }
});

addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

defineRoute("/", LandingView);
defineRoute("/chat/:chatId", ChatView);
defineRoute("#preferences", PreferencesModal);
defineRoute("#about", AboutModal);
defineRoute("#models", ModelsModal);
defineRoute("#alert", AlertModal);
defineRoute("#image", ImageModal);

startRouter({ viewRoot: main, modalRoot: root });

Object.assign(globalThis, {
  alert: (message?: unknown) =>
    history.pushState(
      { ...history.state, message: String(message ?? "") },
      "",
      location.hash + "#alert",
    ),
});
