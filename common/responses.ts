import { KagiError } from "./errors";

export interface KagiApiResponse<T> {
    meta: KagiApiResponseMeta;
    data?: T;
    error: KagiApiError[];
}

export interface KagiApiResponseMeta {
    id: string;
    node: string;
    ms: number;
    api_balance?: number;
}

export interface KagiSummarizationResponse {
    output: string;
    tokens: number;
}

export interface KagiFastGPTResponse {
    output: string;
    references: KagiFastGPTReference[];
    token: number;
}

export interface KagiFastGPTReference {
    title: string;
    snippet: string;
    url: string;
}

export type KagiSearchResponse = (KagiSearchRelatedTerms | KagiSearchObject)[];

export interface KagiSearchRelatedTerms {
    t: 1;
    list: string[];
}

export interface KagiSearchObject {
    t: 0;
    url: string;
    title: string;
    snippet?: string;
}

export type KagiApiError =
    | KagiApiErrorInternal
    | KagiApiErrorMalformed
    | KagiApiErrorUnauthorized
    | KagiApiErrorMissingBilling
    | KagiApiErrorInsufficientCredit
    | KagiApiErrorSummarizationFailure;

export interface KagiApiErrorInternal {
    code: 0;
    msg: string;
    ref?: string;
}

export interface KagiApiErrorMalformed {
    code: 1;
    msg: string;
    ref?: string;
}

export interface KagiApiErrorUnauthorized {
    code: 2;
    msg: string;
    ref?: string;
}

export interface KagiApiErrorMissingBilling {
    code: 100;
    msg: string;
    ref?: string;
}

export interface KagiApiErrorInsufficientCredit {
    code: 101;
    msg: string;
    ref?: string;
}

export interface KagiApiErrorSummarizationFailure {
    code: 200;
    msg: string;
    ref?: string;
}

export async function handleKagiResponse<T>(
    response: Response,
): Promise<[KagiApiResponseMeta, T]> {
    try {
        const content_type = response.headers.get("content-type");

        if (!content_type || !content_type.includes("application/json")) {
            throw new KagiError(
                `API response is invalid: expected a JSON response`,
                `bad content type: ${content_type}`,
            );
        }

        const result = (await response.json()) as KagiApiResponse<T>;

        if (!result || typeof result !== "object") {
            throw new KagiError(
                `API response is invalid: expected a JSON response`,
                `bad response: ${typeof result}`,
            );
        }

        if (!result?.meta) {
            throw new KagiError(
                `API response is invalid: non-standard response`,
                "expected meta property to be available",
            );
        }

        if (result.error) {
            switch (result.error[0].code) {
                case 0:
                    throw new KagiError(
                        "Operation failed: internal error",
                        result.error,
                    );
                case 1:
                    throw new KagiError(
                        "Operation failed: request failed",
                        result.error,
                    );
                case 2:
                    throw new KagiError(
                        "Operation failed: user credentials aren't valid. The user should run the command /kagi-login in order to use the tools.",
                        result.error,
                    );
                case 100:
                    throw new KagiError(
                        "Operation failed: user billing information is not set up",
                        result.error,
                    );
                case 101:
                    throw new KagiError(
                        `Operation failed: user doesn't have sufficient credit (${result.meta.api_balance ?? "?"} USD)`,
                        result.error,
                    );
                case 200:
                    throw new KagiError(
                        `Operation failed: summarization failed: ${result.error[0].msg}`,
                        result.error,
                    );
                default:
                    throw new KagiError(
                        `Operation failed: tool error`,
                        result.error,
                    );
            }
        }

        if (!result.data) {
            throw new KagiError(`Operation failed: tool error`, result.error);
        }

        return [result.meta, result.data];
    } catch (e) {
        if (e instanceof KagiError) {
            throw e;
        }

        throw new KagiError(
            `API response is invalid: status is ${response.status}. Error: ${JSON.stringify(e)}`,
            e,
        );
    }
}
