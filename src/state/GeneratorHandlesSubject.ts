import { Subject } from "./Subject";

export const GeneratorHandlesSubject = new Subject<
  Record<string, AbortController>
>({});

export function trackGeneratorHandle(
  chatId: string,
  controller: AbortController,
): void {
  const handles = GeneratorHandlesSubject.current();
  handles[chatId]?.abort();
  handles[chatId] = controller;
  GeneratorHandlesSubject.next(handles);
  controller.signal.addEventListener("abort", () => {
    const handles = GeneratorHandlesSubject.current();
    if (handles[chatId] === controller) {
      delete handles[chatId];
      GeneratorHandlesSubject.next(handles);
    }
  });
}
