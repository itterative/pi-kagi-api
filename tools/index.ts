import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

import registerFastGPT from "./fastgpt";
import registerUniversalSummarizer from "./universal-summarizer";

export default function registerTools(pi: ExtensionAPI) {
  registerFastGPT(pi);
  registerUniversalSummarizer(pi);
}
