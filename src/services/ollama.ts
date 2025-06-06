import { fetch } from "@tauri-apps/plugin-http";

const origin = "http://localhost:11434";
const hubOrigin = "https://ollama.com";
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
  size?: string;
  context?: string;
  input?: string[];
  installed?: boolean;
  completed?: number;
  downloading?: boolean;
}

export interface ModelInstance {
  name: string;
  model: string;
  modified_at: string;
  size: number; // in bytes
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface Progress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

export async function getInstalledModels(): Promise<ModelInstance[]> {
  const url = new URL("/api/tags", origin);
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch installed models");
  const data = await response.json();
  return data.models;
}

export async function pullModel(
  model: string,
  progressCallback?: (progress: Progress) => any,
): Promise<void> {
  const url = new URL("/api/pull", origin);
  const body = JSON.stringify({ model });
  const response = await fetch(url, { method: "POST", body });
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let part;
  while ((part = await reader.read())) {
    const data = part.value && decoder.decode(part.value);
    if (!data) continue;
    try {
      const object = JSON.parse(data);
      progressCallback?.(object);
    } catch (error) {
      console.error("Failed to parse progress data:", data);
    }
    if (part.done) break;
  }
}

export async function deleteModel(model: string): Promise<void> {
  const url = new URL("/api/delete", origin);
  const body = JSON.stringify({ model });
  const response = await fetch(url, { method: "DELETE", body });
  if (!response.ok) throw new Error("Failed to delete model");
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
  const url = new URL(`/library/${model}`, hubOrigin);
  const response = await fetch(url);
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
    .map((a) => {
      const [_, sizeElement, contextElement, inputElement] =
        a.parentNode?.parentNode?.children || [];
      const [_modelName, label] = a.href
        .substring(a.href.lastIndexOf("/") + 1)
        .split(":");
      if (a.nextElementSibling?.textContent?.trim().toLowerCase() === "latest")
        latestTag = label;
      const size = sizeElement?.textContent?.trim();
      const context = contextElement?.textContent?.trim();
      const input =
        inputElement?.textContent?.trim().replace(/\s+/g, " ").split(",") || [];
      return { label, size, context, input };
    })
    .filter(({ label }) => label && label !== "latest");
  return { name, description, tags, latestTag, categories };
}
