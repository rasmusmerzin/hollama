export function formatBytes(bytes: number) {
  let unit = "";
  if (bytes > 1000) {
    bytes /= 1000;
    unit = "K";
  }
  if (bytes > 1000) {
    bytes /= 1000;
    unit = "M";
  }
  if (bytes > 1000) {
    bytes /= 1000;
    unit = "G";
  }
  if (bytes > 1000) {
    bytes /= 1000;
    unit = "T";
  }
  if (bytes >= 10) return `${Math.floor(bytes)}${unit}B`;
  return `${bytes.toFixed(1)}${unit}B`;
}

export function parseBytes(str: string): number {
  const match = str.match(/^(\d+(?:\.\d+)?)([KMGT]?B?)$/i);
  if (!match) throw new Error(`Invalid byte string: ${str}`);
  let value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  switch (unit) {
    case "KB":
      value *= 1000;
      break;
    case "MB":
      value *= 1000_000;
      break;
    case "GB":
      value *= 1000_000_000;
      break;
    case "TB":
      value *= 1000_000_000_000;
      break;
    case "B":
      // no change
      break;
    default:
      throw new Error(`Unknown byte unit: ${unit}`);
  }
  return value;
}
