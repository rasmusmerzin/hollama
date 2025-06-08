import { Model, getModelDetails } from "../fetch/ollamaHub";
import { ModelInstance } from "../fetch/ollamaClient";
import { Subject } from "./Subject";
import { throttle } from "../utils/throttle";

export interface ModelDownload {
  name: string;
  status: string;
  layers: Record<string, { total: number; completed: number }>;
}

export const ModelsSubject = new Subject<Record<string, Model>>({});

export const ModelDetailsSubject = new Subject<Record<string, Model>>(
  (() => {
    const stored = localStorage.getItem("model_details");
    if (stored) return JSON.parse(stored);
    return {};
  })(),
);
export const AvailableModelsSubject = new Subject<string>(
  localStorage.getItem("available_models") || "[]",
);
export const InstalledModelsSubject = new Subject<ModelInstance[]>(
  (() => {
    const stored = localStorage.getItem("installed_models");
    if (stored) return JSON.parse(stored);
    return [];
  })(),
);
export const ModelDownloadsSubject = new Subject<Record<string, ModelDownload>>(
  {},
);

setTimeout(() => {
  const updateModelsSubjectThrottled = throttle(updateModelsSubject, 1000);
  AvailableModelsSubject.subscribe((data) => {
    localStorage.setItem("available_models", data);
    updateModelsSubjectThrottled();
  }, null);
  InstalledModelsSubject.subscribe((models) => {
    localStorage.setItem("installed_models", JSON.stringify(models));
    updateModelsSubjectThrottled();
    fetchMissingDetailsForInstalled();
    removeFinishedDownloads();
  }, null);
  ModelDetailsSubject.subscribe((details) => {
    localStorage.setItem("model_details", JSON.stringify(details));
    updateModelsSubjectThrottled();
  }, null);
  ModelDownloadsSubject.subscribe(updateModelsSubjectThrottled, null);
});

async function fetchMissingDetailsForInstalled() {
  const current = ModelDetailsSubject.current();
  const installedWithoutDetails = new Set(
    InstalledModelsSubject.current()
      .map((instance) => instance.name.split(":")[0])
      .filter((name) => !current[name]),
  );
  const updates = await Promise.allSettled(
    Array.from(installedWithoutDetails, (name) => getModelDetails(name)),
  );
  const updateObject: Record<string, Model> = Object.fromEntries(
    updates
      .filter((result) => result.status === "fulfilled")
      .map((result) => [result.value.name, result.value]),
  );
  if (Object.keys(updateObject).length)
    ModelDetailsSubject.update((current) => ({ ...current, ...updateObject }));
}

function removeFinishedDownloads() {
  const downloads = ModelDownloadsSubject.current();
  const installed = InstalledModelsSubject.current().map((model) => model.name);
  if (!installed.some((name) => downloads[name])) return;
  ModelDownloadsSubject.update((current) => {
    for (const name of installed) delete current[name];
    return current;
  });
}

function updateModelsSubject() {
  ModelsSubject.next(constructModels());
}

function constructModels(): Record<string, Model> {
  const available: Model[] = JSON.parse(AvailableModelsSubject.current());
  const details = ModelDetailsSubject.current();
  const models = Object.assign(
    Object.fromEntries(available.map((model) => [model.name, model])),
    JSON.parse(JSON.stringify(details)) as Record<string, Model>,
  );
  const installed = InstalledModelsSubject.current();
  const downloads = ModelDownloadsSubject.current();
  for (const instance of installed) {
    let [name, tagLabel] = instance.name.split(":");
    if (!tagLabel) tagLabel = "latest";
    const model = models[name];
    if (model) {
      const tag = model.tags.find((t) => t.label === tagLabel);
      if (tag) tag.installed = true;
      if (model.latestTag && tagLabel === "latest") {
        const tag = model.tags.find((t) => t.label === model.latestTag);
        if (tag) tag.installed = true;
      }
    } else {
      models[name] = {
        name,
        description: "",
        tags: [{ label: tagLabel, installed: true }],
        categories: [],
      };
    }
  }
  for (const download of Object.values(downloads)) {
    let [name, tagLabel] = download.name.split(":");
    if (!tagLabel) tagLabel = "latest";
    const model = models[name];
    const downloaded = Object.values(download.layers).reduce(
      (total, layer) => total + layer.completed,
      0,
    );
    if (model) {
      const tag = model.tags.find((t) => t.label === tagLabel);
      if (tag) Object.assign(tag, { downloaded });
      if (model.latestTag && tagLabel === "latest") {
        const tag = model.tags.find((t) => t.label === model.latestTag);
        if (tag) Object.assign(tag, { downloaded });
      }
    } else {
      models[name] = {
        name,
        description: "",
        tags: [{ label: tagLabel, downloaded }],
        categories: [],
      };
    }
  }
  return models;
}
