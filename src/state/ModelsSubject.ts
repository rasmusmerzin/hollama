import { Subject } from "../Subject";
import {
  getAvailableModels,
  getInstalledModels,
  getModelDetails,
} from "../services/ollama";

export interface Model {
  name: string;
  description: string;
  tags: ModelTag[];
  latestTag?: string;
  categories: string[];
  installed?: string[];
}

export interface ModelTag {
  label: string;
  size?: string;
  context?: string;
  input?: string[];
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

export const ModelsSubject = new Subject<Record<string, Model>>({});

const ModelDetailsSubject = new Subject<Record<string, Model>>(
  (() => {
    const stored = localStorage.getItem("models_details");
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

AvailableModelsSubject.subscribe((data) => {
  localStorage.setItem("available_models", data);
  ModelsSubject.next(constructModels());
}, null);
InstalledModelsSubject.subscribe((models) => {
  localStorage.setItem("installed_models", JSON.stringify(models));
  ModelsSubject.next(constructModels());
  fetchMissingDetailsForInstalled();
}, null);
ModelDetailsSubject.subscribe((details) => {
  localStorage.setItem("models_details", JSON.stringify(details));
  ModelsSubject.next(constructModels());
}, null);

syncAvailableModels({ retryInterval: 2_000 });
syncInstalledModels({ interval: 2_000 });

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

function constructModels(): Record<string, Model> {
  const available: Model[] = JSON.parse(AvailableModelsSubject.current());
  const details = ModelDetailsSubject.current();
  const models = Object.assign(
    Object.fromEntries(available.map((model) => [model.name, model])),
    details,
  );
  const installed = InstalledModelsSubject.current();
  for (const instance of installed) {
    let [name, tag] = instance.name.split(":");
    const { latestTag } = details[name] || {};
    if (!tag) tag = "latest";
    if (name in models) {
      const model = models[name];
      if (!model.installed) model.installed = [];
      model.installed.push(tag);
      if (latestTag) {
        model.latestTag = latestTag;
        if (tag === "latest") model.installed.push(latestTag);
      }
    } else {
      models[name] = {
        name,
        description: "",
        tags: [{ label: tag }],
        categories: [],
        installed: [tag],
      };
    }
  }
  return models;
}
