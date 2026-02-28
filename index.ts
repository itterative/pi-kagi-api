import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

import * as kagiConfig from "./common/config";
import registerFastGPT from "./tools/fastgpt";
import registerUniversalSummarizer from "./tools/universal-summarizer";

export default function (pi: ExtensionAPI) {
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

            kagiConfig.save(ctx.cwd, { token });
        },
    });

    registerFastGPT(pi);
    registerUniversalSummarizer(pi);
}
