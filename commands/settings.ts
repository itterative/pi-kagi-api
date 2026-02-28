import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { AutocompleteItem } from "@mariozechner/pi-tui";

import kagiConfig from "../common/config";

export default function registerSettings(pi: ExtensionAPI) {
    const settings: AutocompleteItem[] = [
        {
            value: "search",
            label: "search",
            description:
                "Sets the search API provider (choices: fastgpt, enrichment)",
        },
    ];

    pi.registerCommand("kagi-settings", {
        description: "Update Kagi related settings",
        getArgumentCompletions(prefix) {
            const completions: AutocompleteItem[] = [];

            for (const setting of settings) {
                if (prefix && !setting.value.startsWith(prefix)) {
                    continue;
                }

                completions.push(setting);
            }

            return completions;
        },
        async handler(args, ctx) {
            const config = kagiConfig.current ?? kagiConfig.default;

            args = args.trim();

            if (!args) {
                let text = "";
                text += "pi-kagi-api: Settings\n\n";
                text += `Search provider: ${config?.searchProvider ?? "fastgpt"}\n`;
                text +=
                    "Available: fastgpt (uses FastGPT model from Kagi for giving an overview of the search results)\n";
                text +=
                    "           enrichment (searches the Small Web from Kagi; cheaper option, but results are very limited)\n";

                ctx.ui.notify(text, "info");
                return;
            }

            switch (args) {
                case "search":
                    const choice = await ctx.ui.select(
                        "Enter your search API provider:",
                        ["fastgpt", "enrichment"],
                    );

                    if (!choice) {
                        ctx.ui.notify("pi-kagi-api: Cancelled", "warning");
                        break;
                    }

                    config.searchProvider = choice as "fastgpt" | "enrichment";

                    ctx.ui.notify(
                        "pi-kagi-api: Updating the search provider requires a /reload",
                        "info",
                    );
                    break;

                default:
                    ctx.ui.notify(
                        `pi-kagi-api: Unknown setting: ${args}.`,
                        "warning",
                    );
                    return;
            }

            kagiConfig.save({
                searchProvider: config.searchProvider,
            }, ctx.cwd);
        },
    });
}
