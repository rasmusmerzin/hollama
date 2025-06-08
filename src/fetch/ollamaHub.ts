import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { parseBytes } from "../utils/bytes";

const origin = "https://ollama.com";
const domParser = new DOMParser();

export interface Model {
  name: string;
  description: string;
  tags: ModelTag[];
  latestTag?: string;
  categories: string[];
}

export interface ModelTag {
  label: string;
  size?: number; // in bytes
  context?: string;
  input?: string[];
  installed?: boolean;
  downloaded?: number;
}

export async function getAvailableModels(): Promise<Model[]> {
  const url = new URL("/search", origin);
  const response = await tauriFetch(url);
  if (!response.ok) throw new Error("Failed to fetch available models");
  const html = await response.text();
  const doc = domParser.parseFromString(html, "text/html");
  doc.querySelectorAll("script").forEach((s) => s.remove());
  const results = doc.getElementById("searchresults");
  const listItems = results?.querySelectorAll("li") || [];
  return Array.from(listItems, (item) => {
    const anchor = item.querySelector("a");
    const descriptionElement = item.querySelector("p");
    const capabilityElements = item.querySelectorAll("[x-test-capability]");
    const sizeElements = item.querySelectorAll("[x-test-size]");
    const name =
      anchor?.href?.substring(anchor.href.lastIndexOf("/") + 1) || "";
    const description = descriptionElement?.innerText.trim() || "";
    const tags = Array.from(sizeElements, (e) => e.textContent?.trim() || "")
      .filter(Boolean)
      .map((label) => ({ label }));
    const categories = Array.from(
      capabilityElements,
      (e) => e.textContent?.trim() || "",
    ).filter(Boolean);
    return { name, description, tags, categories };
  });
}

export async function getModelDetails(model: string): Promise<Model> {
  const url = new URL(`/library/${model}`, origin);
  const response = await tauriFetch(url);
  if (!response.ok) throw new Error("Failed to fetch model details");
  const html = await response.text();
  const doc = domParser.parseFromString(html, "text/html");
  doc.querySelectorAll("script").forEach((s) => s.remove());
  const name =
    doc.querySelector("[x-test-model-name]")?.textContent?.trim() || "";
  const description =
    doc.getElementById("summary-content")?.textContent?.trim() || "";
  const categories = Array.from(
    doc.getElementById("summary")?.nextElementSibling?.children || [],
  )
    .filter((e) => !e.hasAttribute("x-test-size"))
    .map((e) => e.textContent?.trim() || "")
    .filter(Boolean);
  const anchors = Array.from(
    doc.querySelector("section")?.querySelectorAll("a") || [],
  ).filter((a) => !a.classList.contains("sm:hidden"));
  let latestTag: string | undefined;
  const tags = anchors
    .map((a): ModelTag => {
      const [_, sizeElement, contextElement, inputElement] =
        a.parentNode?.parentNode?.children || [];
      const [_modelName, label] = a.href
        .substring(a.href.lastIndexOf("/") + 1)
        .split(":");
      if (!label || label === "latest") return null!;
      if (a.nextElementSibling?.textContent?.trim().toLowerCase() === "latest")
        latestTag = label;
      let size: number | undefined;
      try {
        const sizeStr = sizeElement?.textContent?.trim();
        if (sizeStr) size = parseBytes(sizeStr);
      } catch (error) {
        console.error(error);
      }
      const context = contextElement?.textContent?.trim();
      const input =
        inputElement?.textContent?.trim().replace(/\s+/g, " ").split(",") || [];
      return { label, size, context, input };
    })
    .filter(Boolean);
  return { name, description, tags, latestTag, categories };
}
