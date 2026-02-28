import { Type } from "@sinclair/typebox";

import type {
    AgentToolResult,
    ExtensionAPI,
} from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";

import { KAGI_API_URL, KAGI_USER_AGENT } from "../common/constants";
import kagiConfig from "../common/config";
import type { KagiConfig } from "../common/config";
import { KagiError } from "../common/errors";
import { handleKagiResponse, KagiSearchResponse } from "../common/responses";

const WEBSEARCH_LIMIT = 10;
const WEBSEARCH = `
Search the web using Kagi.

Web search incurs incurs extra costs to the user and should be used sparingly.

Pricing for Search API is a flat rate per-query: $25 for 1000 queries (2.5 cents per search).
`.trim();

export default function registerSearch(pi: ExtensionAPI, enabled: boolean = true) {
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
                result?: KagiSearchResponse;
            }>
        > {
            if (signal?.aborted) {
                return {
                    content: [{ type: "text", text: "Cancelled" }],
                    details: { cancelled: true },
                };
            }

            let config: KagiConfig;

            try {
                config = kagiConfig.current ?? kagiConfig.load(ctx.cwd);
            } catch (e) {
                throw new Error(
                    "Kagi token could not be retrieved. Please ask user to use /kagi-login command.",
                );
            }

            onUpdate?.({
                content: [{ type: "text", text: "Fetching results..." }],
                details: { cancelled: false },
            });

            try {
                const response = await fetch(
                    `${KAGI_API_URL}/search?q=${encodeURIComponent(params.query)}&limit=${WEBSEARCH_LIMIT}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bot ${config.token}`,
                            "User-Agent": KAGI_USER_AGENT,
                        },
                        signal,
                    },
                );

                const [meta, result] =
                    await handleKagiResponse<KagiSearchResponse>(response);

                const relatedTerms = result.filter((r) => r.t === 1);
                const searchResults = result.filter((r) => r.t === 0);

                const text: string[] = [];

                for (const relatedTerm of relatedTerms) {
                    text.push(
                        `<related_terms>\n${relatedTerm.list.map((t) => "<term>" + t + "</term>").join("\n")}\n</related_terms>`,
                    );
                }

                if (searchResults.length > 0) {
                    const textSearchResults = searchResults
                        .map(
                            (r) =>
                                `<result>\n<title>${r.title}</title>\n<url>${r.url}</url>\n<snippet>\n${r.snippet}\n</snippet>\n</result>`,
                        )
                        .join("\n");
                    text.push(`<results>\n${textSearchResults}\n</results>`);
                } else {
                    text.push("<results>No search results.</results>");
                }

                if (meta.api_balance && meta.api_balance < 1) {
                    text.push(
                        `<warning>User has a balance of ${meta.api_balance.toFixed(2)} USD. You should consider making fewer calls.</warning>`,
                    );
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: text.join("\n\n"),
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

            const relatedTerms = result.details.result.filter((r) => r.t === 1);
            const searchResults = result.details.result.filter(
                (r) => r.t === 0,
            );

            const text: string[] = [];

            for (const relatedTerm of relatedTerms) {
                text.push(`Related terms: ${relatedTerm.list.join(", ")}\n`);
            }

            if (searchResults.length > 0) {
                const textSearchResults = searchResults
                    .map((r) => `# ${r.title}\n${r.snippet}`)
                    .join("\n\n");
                text.push(textSearchResults);
            } else {
                text.push("No search results.");
            }

            return new Text(text.join("\n\n"), 0, 0);
        },
    });
}
