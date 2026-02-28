import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

import kagiConfig from "../common/config";

import registerEnrichment from "./enrichment";
import registerFastGPT from "./fastgpt";
import registerUniversalSummarizer from "./universal-summarizer";

export default function registerTools(pi: ExtensionAPI) {
  const config = kagiConfig.current;

  registerEnrichment(pi, config?.searchProvider === "enrichment");
  registerFastGPT(pi, config === null || config.searchProvider === "fastgpt");
  registerUniversalSummarizer(pi);
}
