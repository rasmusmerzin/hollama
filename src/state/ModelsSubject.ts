import {
  Model,
  ModelInstance,
  deleteModel,
  getAvailableModels,
  getInstalledModels,
  getModelDetails,
  pullModel,
} from "../services/ollama";
import { Subject } from "./Subject";
import { throttle } from "../throttle";

export interface ModelDownload {
  name: string;
  status: string;
  layers: Record<string, { total: number; completed: number }>;
}

export const ModelsSubject = new Subject<Record<string, Model>>({});

const ModelDetailsSubject = new Subject<Record<string, Model>>(
  (() => {
    const stored = localStorage.getItem("model_details");
    if (stored) return JSON.parse(stored);
    return {};
  })(),
);
const AvailableModelsSubject = new Subject<string>(
  localStorage.getItem("available_models") || "[]",
);
const InstalledModelsSubject = new Subject<ModelInstance[]>(
  (() => {
    const stored = localStorage.getItem("installed_models");
    if (stored) return JSON.parse(stored);
    return [];
  })(),
);
const ModelDownloadsSubject = new Subject<Record<string, ModelDownload>>({});

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

syncAvailableModels({ retryInterval: 5000 });
syncInstalledModels({ interval: 5000 });

export function startModelDownload(name: string): Promise<void> {
  const download = ModelDownloadsSubject.current()[name] || {
    name,
    layers: {},
  };
  return new Promise((resolve, reject) =>
    pullModel(name, async ({ status, digest, total, completed }) => {
      resolve();
      if (digest && total && completed)
        download.layers[digest] = { total, completed };
      Object.assign(download, { status });
      ModelDownloadsSubject.update((downloads) => {
        downloads[name] = download;
        return downloads;
      });
      if (status === "success") syncInstalledModels();
    })
      .then(() => resolve())
      .catch(reject),
  );
}

export async function removeModel(name: string): Promise<void> {
  await deleteModel(name).catch(console.error);
  await syncInstalledModels().catch(console.error);
  const download = ModelDownloadsSubject.current()[name];
  if (!download) return;
  ModelDownloadsSubject.update((downloads) => {
    delete downloads[name];
    return downloads;
  });
}

export async function syncModelDetails(name: string) {
  const current = ModelDetailsSubject.current()[name];
  const model = await getModelDetails(name);
  if (JSON.stringify(current) === JSON.stringify(model)) return;
  ModelDetailsSubject.update((current) => ({
    ...current,
    [model.name]: model,
  }));
}

export async function syncAvailableModels({
  retryInterval = 0,
  retryCount = -1,
} = {}) {
  try {
    const models = await getAvailableModels();
    const data = JSON.stringify(models);
    if (data !== AvailableModelsSubject.current())
      AvailableModelsSubject.next(data);
  } catch (error) {
    if (retryInterval > 0 && retryCount !== 0) {
      if (retryCount > 0) retryCount--;
      setTimeout(syncAvailableModels, retryInterval, {
        retryInterval,
        retryCount,
      });
    }
  }
}

export async function syncInstalledModels({ interval = 0 } = {}) {
  try {
    const instances = await getInstalledModels();
    const newData = JSON.stringify(instances);
    const currentData = JSON.stringify(InstalledModelsSubject.current());
    if (newData !== currentData) InstalledModelsSubject.next(instances);
  } finally {
    if (interval > 0) setTimeout(syncInstalledModels, interval, { interval });
  }
}

async function fetchMissingDetailsForInstalled() {
  const current = ModelDetailsSubject.current();
  const installed = new Set(
    InstalledModelsSubject.current()
      .map((instance) => instance.name.split(":")[0])
      .filter((name) => !current[name]),
  );
  const updates = await Promise.allSettled(
    Array.from(installed, (name) => getModelDetails(name)),
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
