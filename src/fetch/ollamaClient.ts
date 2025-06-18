import { PreferencesSubject } from "../state/PreferencesSubject";
import { stripDataUrl } from "../utils/files";

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

export interface PullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessagePart {
  model: string;
  created_at: string;
  message: { role: ChatRole; content: string; thinking?: string };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export async function getInstalledModels(): Promise<ModelInstance[]> {
  const origin = PreferencesSubject.current().instanceAddress;
  const url = new URL("/api/tags", origin);
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch installed models");
  const data = await response.json();
  return data.models;
}

export async function deleteModel(model: string): Promise<void> {
  const origin = PreferencesSubject.current().instanceAddress;
  const url = new URL("/api/delete", origin);
  const body = JSON.stringify({ model });
  const response = await fetch(url, { method: "DELETE", body });
  if (!response.ok) throw new Error("Failed to delete model");
}

export async function pullModel(
  model: string,
  callback?: (progress: PullProgress) => any,
): Promise<void> {
  const origin = PreferencesSubject.current().instanceAddress;
  const url = new URL("/api/pull", origin);
  const stream = !!callback;
  const body = JSON.stringify({ model, stream });
  const response = await fetch(url, { method: "POST", body });
  if (callback) {
    if (!response.body) return;
    const reader = response.body.getReader();
    await readJsonStream(reader, callback);
  } else await response.text();
}

export async function generateChatMessage({
  model,
  messages,
  think,
  signal,
  onok,
  onpart,
}: {
  model: string;
  messages: {
    role: ChatRole;
    content: string;
    thinking?: string;
    images?: string[];
  }[];
  think?: boolean;
  signal?: AbortSignal;
  onok?: () => any;
  onpart: (part: ChatMessagePart) => any;
}): Promise<void> {
  const origin = PreferencesSubject.current().instanceAddress;
  const url = new URL("/api/chat", origin);
  messages = messages.map(({ role, content, images, thinking }) => ({
    role,
    content,
    thinking,
    images: images?.map(stripDataUrl),
  }));
  const body = JSON.stringify({ model, messages, think });
  const response = await fetch(url, { method: "POST", body, signal });
  if (response.ok) {
    if (onok) setTimeout(onok);
  } else console.error("Error in chat generation:", response.statusText);
  if (!response.body) return;
  const reader = response.body.getReader();
  await readJsonStream(reader, onpart);
}

async function readJsonStream<T extends object>(
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
        console.error("Error parsing stream data:", jsonStr);
      }
    }
  }
  if ((buffer = buffer.trim())) {
    try {
      const object = JSON.parse(buffer);
      setTimeout(callback, 0, object);
    } catch (error) {
      console.error("Error parsing stream data:", buffer);
    }
  }
}
