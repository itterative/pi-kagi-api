import { Type } from "@sinclair/typebox";

import type {
    AgentToolResult,
    ExtensionAPI,
} from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";

import { KAGI_API_URL, KAGI_USER_AGENT } from "../common/constants";
import { loadConfigOrThrow } from "../common/config";
import { KagiError } from "../common/errors";
import { handleKagiResponse, KagiFastGPTResponse } from "../common/responses";

const WEBSEARCH = `
Search the web using Kagi, powered by FastGPT.

FastGPT is a Kagi service using powerful LLMs to answer user queries running a full search engine underneath. Think ChatGPT, but on steroids and faster!

Web search incurs incurs extra costs to the user and should be used sparingly.

Pricing for FastGPT is a flat rate per-query: 1.5¢ per query ($15 USD per 1000 queries).
`.trim();

export default function (pi: ExtensionAPI, enabled: boolean = false) {
    if (!enabled) {
        return;
    }

    pi.registerTool({
        name: "web-search",
        label: "Kagi Web Search",
        description: WEBSEARCH,
        parameters: Type.Object({
            query: Type.String({
                description:
                    "The search query. You may use natural language, or you can prioritize certain important search terms. ",
            }),
        }),
        async execute(
            id,
            params,
            signal,
            onUpdate,
            ctx,
        ): Promise<
            AgentToolResult<{
                cancelled: boolean;
                result?: KagiFastGPTResponse;
            }>
        > {
            if (signal?.aborted) {
                return {
                    content: [{ type: "text", text: "Cancelled" }],
                    details: { cancelled: true },
                };
            }

            const config = loadConfigOrThrow(ctx.cwd);

            onUpdate?.({
                content: [{ type: "text", text: "Fetching results..." }],
                details: { cancelled: false },
            });

            try {
                const response = await fetch(`${KAGI_API_URL}/fastgpt`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bot ${config.token}`,
                        "Content-Type": "application/json",
                        "User-Agent": KAGI_USER_AGENT,
                    },
                    body: JSON.stringify({ query: params.query }),
                    signal,
                });

                const [meta, result] =
                    await handleKagiResponse<KagiFastGPTResponse>(response);

                let text = `<output>\n${result.output}\n</output>`;

                for (const reference of result.references) {
                    text += `\n\n<reference>\n<title>${reference.title}</title>\n<url>${reference.url}</url>\n<snippet>\n${reference.snippet}\n</snippet>\n</reference>`;
                }

                if (meta.api_balance && meta.api_balance < 1) {
                    text += `\n\n<warning>User has a balance of ${meta.api_balance.toFixed(2)} USD. You should consider making fewer calls.</warning>`;
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: text,
                        },
                    ],
                    details: {
                        cancelled: false,
                        result: result,
                    },
                };
            } catch (e) {
                if (e instanceof KagiError) {
                    throw new Error(e.message);
                }

                if (e instanceof Error) {
                    throw e;
                }

                throw new Error("Operation failed");
            }
        },

        renderCall(args, theme) {
            let text = theme.fg("toolTitle", theme.bold("web-search "));
            text += theme.fg("muted", args.query);
            return new Text(text, 0, 0);
        },
        renderResult(result, { expanded, isPartial }, theme) {
            if (isPartial) {
                return new Text(theme.fg("accent", "Searching..."), 0, 0);
            }

            if (result.details.cancelled) {
                return new Text(theme.fg("muted", "Cancelled"), 0, 0);
            }

            if (expanded || !result.details?.result) {
                const content = result.content[0];

                if (!content || content.type !== "text") {
                    return new Text(theme.fg("muted", "No results."), 0, 0);
                } else {
                    return new Text(content.text, 0, 0);
                }
            }

            let text = result.details.result.output;

            if (result.details.result.references.length > 0) {
                text += "\n\n#References\n";
                text += result.details.result.references.map((r, i) => `${i + 1}. ${r.title} (${r.url})`);
            }

            return new Text(text, 0, 0);
        },
    });
}
