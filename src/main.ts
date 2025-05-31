import "./styles.css";
import "@merzin/element";
import { PreferencesModal } from "./modals/PreferencesModal";
import {
  SIDE_BAR_BREAKPOINT,
  SideBarElement,
  SideBarSubject,
} from "./elements/SideBarElement";
import { TitleBarElement } from "./elements/TitleBarElement";
import { defineRoute, startRouter } from "@merzin/router";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { AboutModal } from "./modals/AboutModal";

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
  if (key === "Escape") {
    if (history.stack.index) history.back();
    else if (innerWidth < SIDE_BAR_BREAKPOINT && SideBarSubject.current().open)
      SideBarSubject.update((state) => ({ ...state, open: false }));
  }
});

defineRoute("#preferences", PreferencesModal);
defineRoute("#about", AboutModal);

startRouter(main);
