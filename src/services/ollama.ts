import { fetch } from "@tauri-apps/plugin-http";

export interface InstalledModel {
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

export interface AvailableModel {
  name: string;
}

const origin = "http://localhost:11434";
const hubOrigin = "https://ollama.com";

export async function getInstalledModels(): Promise<InstalledModel[]> {
  const url = new URL("/api/tags", origin);
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch installed models");
  const data = await response.json();
  return data.models;
}

export async function getAvailableModels(): Promise<AvailableModel[]> {
  const url = new URL("/search", hubOrigin);
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch available models");
  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const results = doc.getElementById("searchresults");
  const listItems = results?.querySelectorAll("li") || [];
  return Array.from(listItems, (item) => {
    const anchor = item.querySelector("a");
    const name =
      anchor?.href?.substring(anchor.href.lastIndexOf("/") + 1) || "";
    return { name };
  });
}
