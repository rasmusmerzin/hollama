export function openFile({
  accept,
  multiple,
  onchange,
}: {
  accept?: string;
  multiple?: boolean;
  onchange?: (files: File[]) => any;
}) {
  createElement("input", {
    type: "file",
    accept,
    multiple,
    onchange(event) {
      const input = event.target as HTMLInputElement;
      const files = Array.from(input.files || []);
      onchange?.(files);
    },
  }).click();
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onabort = reader.onerror = reject;
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export function stripDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:[^;]+;base64,(.*)$/);
  if (!match) return dataUrl;
  return match[1];
}
