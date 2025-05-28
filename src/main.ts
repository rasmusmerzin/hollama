import "./styles.css";
import "@merzin/element";
import {
  SIDE_BAR_BREAKPOINT,
  SideBarElement,
  SideBarSubject,
} from "./elements/SideBarElement";
import { TitleBarElement } from "./elements/TitleBarElement";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { hasBackHandlers, startRouter } from "@merzin/router";

const root = document.getElementById("root")!;
const titleBar = new TitleBarElement();
const sideBar = new SideBarElement();
const main = createElement("main");
const appWindow = getCurrentWindow();

root.append(sideBar, createElement("div", {}, [titleBar, main]));

document.documentElement.setAttribute("dark", "");

appWindow.onResized(async () => {
  const maximized = await appWindow.isMaximized();
  if (maximized) root.setAttribute("maximized", "");
  else root.removeAttribute("maximized");
});

addEventListener("keydown", ({ key }) => {
  if (key === "Escape") {
    if (
      !hasBackHandlers() &&
      innerWidth < SIDE_BAR_BREAKPOINT &&
      SideBarSubject.current().open
    )
      SideBarSubject.update((state) => ({ ...state, open: false }));
    else history.back();
  }
});

startRouter(root);
