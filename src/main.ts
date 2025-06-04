import "./styles.css";
import "@merzin/element";
import { AboutModal } from "./modals/AboutModal";
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
  if (key === "Escape") history.back();
});

defineRoute("#preferences", PreferencesModal);
defineRoute("#about", AboutModal);

startRouter({ viewRoot: main, modalRoot: root });
