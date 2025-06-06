export function formatByteCount(bytes: number) {
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
