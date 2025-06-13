import markdownit from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

export function parseThinking(text: string): {
  thinking: string;
  content: string;
} {
  let isThinking = false;
  const thinking: string[] = [];
  const content: string[] = [];
  text.split("\n").forEach((line) => {
    if (line == "<think>") isThinking = true;
    else if (line == "</think>") isThinking = false;
    else if (isThinking) thinking.push(line);
    else content.push(line);
  });
  return { thinking: thinking.join("\n"), content: content.join("\n") };
}

export const md = markdownit({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (error) {
        console.error(`Error highlighting code: ${error}`);
      }
    }
    return "";
  },
});
