export function parseThinking(text: string): {
  thinking: string;
  content: string;
} {
  let isThinking = false;
  const thinking: string[] = [];
  const content: string[] = [];
  forEveryLine(text, (line) => {
    if (line == "<think>") isThinking = true;
    else if (line == "</think>") isThinking = false;
    else if (isThinking) thinking.push(line);
    else content.push(line);
  });
  return { thinking: thinking.join("\n"), content: content.join("\n") };
}

function forEveryLine(
  text: string,
  callback: (line: string, index: number) => any,
): void {
  let line = "";
  let index = 0;
  for (const char of text) {
    if (char == "\n") {
      callback(line, index);
      line = "";
      index++;
    } else line += char;
  }
  if (line) callback(line, index);
}
