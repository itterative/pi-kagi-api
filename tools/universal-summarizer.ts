import { Type } from "@sinclair/typebox";

import type {
    AgentToolResult,
    ExtensionAPI,
} from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";

import { KAGI_API_URL, KAGI_USER_AGENT } from "../common/constants";
import { loadConfigOrThrow } from "../common/config";
import { KagiError } from "../common/errors";
import {
    handleKagiResponse,
    KagiSummarizationResponse,
} from "../common/responses";

const UNIVERSAL_SUMMARIZER_DEFAULT_ENGINE = "agnes";
const UNIVERSAL_SUMMARIZER_DEFAULT_SUMMARY = "summary";
const UNIVERSAL_SUMMARIZER = `
The Universal Summarizer is an API using powerful LLMs to summarize any content, of almost any format, with unlimited token length!

You can summarize many types of web content, including:
* Text web pages, articles, and forum threads
* PDF documents (.pdf)
* PowerPoint documents (.pptx)
* Word documents (.docx)
* Audio files (mp3/wav)
* YouTube URLs (Experimental)
* Scanned PDFs and images (OCR)

Summarization Engines:
* cecil - Friendly, descriptive, fast summary
* agnes - Formal, technical, analytical summary

Summary types:
* summary - Paragraph(s) of summary prose
* takeaway - Bulleted list of key points

Universal Summarizer incurs extra costs to the user and should be used sparingly.

Pricing for Universal Summarizer is $0.030 USD per 1,000 tokens processed.
`.trim();

export default function (pi: ExtensionAPI) {
    pi.registerTool({
        name: "universal-summarizer",
        label: "Kagi Universal Summarizer",
        description: UNIVERSAL_SUMMARIZER,
        parameters: Type.Object({
            url: Type.String({
                description: "A URL to a document to summarize.",
            }),
            summary_type: Type.Optional(
                Type.Enum(
                    {
                        summary: "summary",
                        takeaway: "takeaway",
                    },
                    {
                        description: `What kind of summarization is performed. Choices: summary, takeaway. Default: ${UNIVERSAL_SUMMARIZER_DEFAULT_SUMMARY}`,
                    },
                ),
            ),
            engine: Type.Optional(
                Type.Enum(
                    {
                        cecil: "cecil",
                        agnes: "agnes",
                    },
                    {
                        description: `Which summarization engine to use. Choices: cecil, agnes. Default: ${UNIVERSAL_SUMMARIZER_DEFAULT_ENGINE}`,
                    },
                ),
            ),
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
                result?: KagiSummarizationResponse;
            }>
        > {
            if (signal?.aborted) {
                return {
                    content: [{ type: "text", text: "Cancelled" }],
                    details: { cancelled: true },
                };
            }

            const config = loadConfigOrThrow(ctx.cwd);

            const url = params.url;
            const summary_type =
                params.summary_type ?? UNIVERSAL_SUMMARIZER_DEFAULT_SUMMARY;
            const engine = params.engine ?? UNIVERSAL_SUMMARIZER_DEFAULT_ENGINE;

            onUpdate?.({
                content: [{ type: "text", text: "Fetching results..." }],
                details: { cancelled: false },
            });

            try {
                const response = await fetch(`${KAGI_API_URL}/summarize`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bot ${config.token}`,
                        "Content-Type": "application/json",
                        "User-Agent": KAGI_USER_AGENT,
                    },
                    body: JSON.stringify({ url, summary_type, engine }),
                    signal,
                });

                const [meta, result] =
                    await handleKagiResponse<KagiSummarizationResponse>(
                        response,
                    );

                let text = `<content>\n${result.output}\n</content>`;

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

        renderResult(result, { expanded, isPartial }, theme) {
            if (isPartial) {
                return new Text(theme.fg("accent", "Summarizing..."));
            }

            if (result.details.cancelled) {
                return new Text(theme.fg("muted", "Cancelled"));
            }

            if (expanded || !result.details?.result) {
                const content = result.content[0];

                if (!content || content.type !== "text") {
                    return new Text(theme.fg("muted", "No results."));
                } else {
                    return new Text(content.text);
                }
            }

            return new Text(result.details.result.output);
        },
    });
}
