import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { AutocompleteItem } from "@mariozechner/pi-tui";

import * as kagiConfig from "../common/config";

export default function registerLogin(pi: ExtensionAPI) {
    pi.registerCommand("kagi-login", {
        description: "Set the Kagi API token for API access",
        async handler(args, ctx) {
            const token = await ctx.ui.input(
                "Enter your Kagi API token:",
                "You can create a token at https://kagi.com/settings/api",
            );

            if (!token) {
                ctx.ui.notify("pi-kagi-api: Login cancelled", "warning");
                return;
            }

            let config = kagiConfig.loadWithDefault(ctx.cwd);
            config.token = token;

            kagiConfig.save(ctx.cwd, config);
        },
    });
}
