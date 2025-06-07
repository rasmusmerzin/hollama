import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { parseBytes } from "../bytes";

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
  size?: number; // in bytes
  context?: string;
  input?: string[];
  installed?: boolean;
  downloaded?: number;
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
  const stream = !!progressCallback;
  const body = JSON.stringify({ model, stream });
  const response = await fetch(url, { method: "POST", body });
  if (progressCallback) {
    if (!response.body) return;
    const reader = response.body.getReader();
    await readStreamAsJson(reader, progressCallback);
  } else await response.text();
}

async function readStreamAsJson<T extends object>(
  reader: ReadableStreamDefaultReader,
  callback: (item: T) => any,
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let boundary;
    while ((boundary = buffer.indexOf("}\n")) !== -1) {
      const jsonStr = buffer.substring(0, boundary + 1);
      buffer = buffer.substring(boundary + 2);
      try {
        const object = JSON.parse(jsonStr);
        setTimeout(callback, 0, object);
      } catch (error) {
        console.error("Error parsing progress data:", jsonStr);
      }
    }
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
  const url = new URL(`/library/${model}`, hubOrigin);
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
