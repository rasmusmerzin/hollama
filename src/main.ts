import "./styles.css";
import "@merzin/element";
import { TitleBarElement } from "./elements/TitleBarElement";
import { SideBarElement } from "./elements/SideBarElement";

const root = document.getElementById("root")!;
const titleBar = new TitleBarElement();
const sideBar = new SideBarElement();
const main = createElement("main");

root.append(sideBar, createElement("div", {}, [titleBar, main]));

document.documentElement.setAttribute("dark", "");
