import { Subject } from "../Subject";
import {
  getAvailableModels,
  getInstalledModels,
  getModelDetails,
} from "../services/ollama";

export interface Model {
  name: string;
  description: string;
  tags: string[];
  latestTag?: string;
  categories: string[];
  installed?: string[];
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
  fetchInstalledModelsDetails();
}, null);
ModelDetailsSubject.subscribe((details) => {
  localStorage.setItem("models_details", JSON.stringify(details));
  ModelsSubject.next(constructModels());
}, null);

fetchAvailableModels();
fetchInstalledModels();

async function fetchAvailableModels() {
  try {
    const models = await getAvailableModels();
    const data = JSON.stringify(models);
    if (data !== AvailableModelsSubject.current())
      AvailableModelsSubject.next(data);
  } catch (error) {
    setTimeout(fetchAvailableModels, 10_000);
  }
}

async function fetchInstalledModels() {
  try {
    const instances = await getInstalledModels();
    const newData = JSON.stringify(instances);
    const currentData = JSON.stringify(InstalledModelsSubject.current());
    if (newData !== currentData) InstalledModelsSubject.next(instances);
  } finally {
    setTimeout(fetchInstalledModels, 10_000);
  }
}

async function fetchInstalledModelsDetails() {
  const instances = InstalledModelsSubject.current();
  const details = await Promise.allSettled(
    instances.map((instance) => getModelDetails(instance.name.split(":")[0])),
  );
  const updateObject: Record<string, Model> = Object.fromEntries(
    details
      .filter((result) => result.status === "fulfilled")
      .map((result) => [result.value.name, result.value]),
  );
  if (Object.keys(updateObject).length)
    ModelDetailsSubject.update((current) => ({ ...current, ...updateObject }));
}

function constructModels(): Record<string, Model> {
  const available: Model[] = JSON.parse(AvailableModelsSubject.current());
  const models = Object.fromEntries(
    available.map((model) => [model.name, model]),
  );
  const installed = InstalledModelsSubject.current();
  const details = ModelDetailsSubject.current();
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
        tags: [tag],
        categories: [],
        installed: [tag],
      };
    }
  }
  return models;
}
