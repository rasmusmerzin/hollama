import {
  AvailableModelsSubject,
  InstalledModelsSubject,
  ModelDetailsSubject,
  ModelDownloadsSubject,
  ModelsSubject,
} from "../state/ModelsSubject";
import {
  deleteModel,
  getInstalledModels,
  pullModel,
} from "../fetch/ollamaClient";
import { getAvailableModels, getModelDetails } from "../fetch/ollamaHub";

setTimeout(() => {
  syncAvailableModels({ retryInterval: 5000 });
  syncInstalledModels({ interval: 5000 });
});

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
      .then(resolve)
      .catch(reject)
      .finally(() => {
        const current = ModelDownloadsSubject.current();
        if (!current[name]) return;
        ModelDownloadsSubject.update((downloads) => {
          delete downloads[name];
          return downloads;
        });
      }),
  );
}

export async function removeModelInstance(
  modelName: string,
  tagLabel: string,
): Promise<void> {
  const model = ModelsSubject.current()[modelName];
  if (!model) throw new Error(`Model ${modelName} not found`);
  let name = `${modelName}:${tagLabel}`;
  if (isModelInstalled(name)) await deleteModel(name);
  if (model.latestTag === tagLabel) {
    name = `${model.name}:latest`;
    if (isModelInstalled(name)) await deleteModel(name);
  } else if (tagLabel === "latest" && model.latestTag) {
    name = `${model.name}:${model.latestTag}`;
    if (isModelInstalled(name)) await deleteModel(name);
  }
  syncInstalledModels();
}

export function isModelInstalled(name: string): boolean {
  const installed = InstalledModelsSubject.current();
  return installed.some((instance) => instance.name === name);
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
