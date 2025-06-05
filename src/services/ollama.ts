import { fetch } from "@tauri-apps/plugin-http";
import { Model, ModelInstance } from "../subjects/ModelsSubject";

const origin = "http://localhost:11434";
const hubOrigin = "https://ollama.com";
const domParser = new DOMParser();

export async function getInstalledModels(): Promise<ModelInstance[]> {
  const url = new URL("/api/tags", origin);
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch installed models");
  const data = await response.json();
  return data.models;
}

export async function getAvailableModels(): Promise<Model[]> {
  const url = new URL("/search", hubOrigin);
  const response = await fetch(url);
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
    const tags = Array.from(
      sizeElements,
      (e) => e.textContent?.trim() || "",
    ).filter(Boolean);
    const categories = Array.from(
      capabilityElements,
      (e) => e.textContent?.trim() || "",
    ).filter(Boolean);
    return { name, description, tags, categories };
  });
}

export async function getModelDetails(model: string): Promise<Model> {
  const url = new URL(`/library/${model}`, hubOrigin);
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch model details");
  const html = await response.text();
  const doc = domParser.parseFromString(html, "text/html");
  doc.querySelectorAll("script").forEach((s) => s.remove());
  const name =
    doc.querySelector("[x-test-model-name]")?.textContent?.trim() || "";
  const summaryElement = doc.getElementById("summary");
  const description = summaryElement?.textContent?.trim() || "";
  const categories = Array.from(
    summaryElement?.nextElementSibling?.children || [],
  )
    .filter((e) => !e.hasAttribute("x-test-size"))
    .map((e) => e.textContent?.trim() || "")
    .filter(Boolean);
  const anchors = doc.querySelectorAll("a");
  let latestTag: string | undefined;
  const tags = Array.from(anchors, (a) => {
    const [_name, tag] = a.href
      .substring(a.href.lastIndexOf("/") + 1)
      .split(":");
    if (a.nextElementSibling?.textContent?.trim().toLowerCase() === "latest")
      latestTag = tag;
    return tag;
  });
  return { name, description, tags, latestTag, categories };
}
