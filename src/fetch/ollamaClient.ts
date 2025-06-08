const origin = "http://localhost:11434";

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
