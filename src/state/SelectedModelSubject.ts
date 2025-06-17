import { ModelsSubject } from "./ModelsSubject";
import { Subject } from "./Subject";

export interface SelectedModelDetails {
  name: string;
  label: string;
  categories: string[];
  input: string[];
}

export const SelectedModelSubject = new Subject<string | null>(
  localStorage.getItem("selected_model"),
);

export const SelectedModelDetailsSubject =
  new Subject<SelectedModelDetails | null>(null);

setTimeout(() => {
  SelectedModelSubject.subscribe((selectedModel) => {
    if (selectedModel) localStorage.setItem("selected_model", selectedModel);
    else localStorage.removeItem("selected_model");
    updateSelectedModelSubject();
  }, null);
  ModelsSubject.subscribe(updateSelectedModelSubject, null);
});

function updateSelectedModelSubject() {
  const current = SelectedModelSubject.current();
  const updated = constructSelectedModel();
  if (JSON.stringify(current) === JSON.stringify(updated)) return;
  SelectedModelDetailsSubject.next(updated);
}

function constructSelectedModel(): SelectedModelDetails | null {
  const instanceName = SelectedModelSubject.current();
  if (!instanceName) return null;
  const [name, label] = instanceName.split(":");
  const models = ModelsSubject.current();
  const model = models[name];
  if (!model) return { name, label, categories: [], input: [] };
  const { categories } = model;
  const tag = model.tags.find((tag) => tag.label === label);
  const input = tag?.input || [];
  return { name, label, categories, input };
}
