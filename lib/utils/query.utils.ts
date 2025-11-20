import {
	type CommonHeaderNames,
	type EmptyObject,
	getDefaultHttpService,
	getSdkIdHeader,
	type Header,
	type HttpService,
	type JsonValue,
} from "@kontent-ai/core-sdk";
import type { ZodError, ZodType } from "zod/v4";
import type { PagingQuery, Query, SuccessfulHttpResponse, SyncClientConfig, SyncHeaderNames, SyncResponse } from "../models/core.models.js";
import { sdkInfo } from "../sdk-info.js";

type ResolveToPromiseQuery<TPayload extends JsonValue, TExtraMetadata = EmptyObject> = ReturnType<
	Pick<Query<TPayload, TExtraMetadata>, "toPromise">["toPromise"]
>;

type ResolveToAllPromiseQuery<TPayload extends JsonValue, TExtraMetadata = EmptyObject> = ReturnType<
	Pick<PagingQuery<TPayload, TExtraMetadata>, "toAllPromise">["toAllPromise"]
>;

export function getQuery<TPayload extends JsonValue, TBodyData extends JsonValue, TExtraMetadata = EmptyObject>(
	data: Parameters<typeof resolveQueryAsync<TPayload, TBodyData, TExtraMetadata>>[0],
): Pick<Query<TPayload, TExtraMetadata>, "toPromise"> {
	return {
		toPromise: async () => {
			return await resolveQueryAsync<TPayload, TBodyData, TExtraMetadata>(data);
		},
	};
}

export function getPagingQuery<TPayload extends JsonValue, TBodyData extends JsonValue, TExtraMetadata = EmptyObject>(
	data: Parameters<typeof resolveQueryAsync<TPayload, TBodyData, TExtraMetadata>>[0] & {
		readonly canFetchNextResponse: (response: SyncResponse<TPayload, TExtraMetadata>) => boolean;
		readonly continuationToken: string;
	},
): Pick<PagingQuery<TPayload, TExtraMetadata>, "toPromise" | "toAllPromise"> {
	return {
		...getQuery<TPayload, TBodyData, TExtraMetadata>(data),
		toAllPromise: async () => {
			return await resolvePagingQueryAsync<TPayload, TBodyData, TExtraMetadata>(data);
		},
	};
}

export function extractContinuationToken(responseHeaders: readonly Header[]): string | undefined {
	return responseHeaders.find((header) => header.name.toLowerCase() === ("X-Continuation" satisfies SyncHeaderNames).toLowerCase())
		?.value;
}

function getHttpService(config: SyncClientConfig) {
	return config.httpService ?? getDefaultHttpService();
}

function getCombinedRequestHeaders({
	requestHeaders,
	continuationToken,
	deliveryApiKey,
}: {
	readonly requestHeaders: readonly Header[];
	readonly continuationToken: string | undefined;
	readonly deliveryApiKey: string | undefined;
}): readonly Header[] {
	return [
		getSdkIdHeader({
			host: "npmjs.com",
			name: sdkInfo.name,
			version: sdkInfo.version,
		}),
		...requestHeaders,
		...(continuationToken
			? [
					{
						name: "X-Continuation" satisfies SyncHeaderNames,
						value: continuationToken,
					},
				]
			: []),
		...(deliveryApiKey
			? [
					{
						name: "Authorization" satisfies CommonHeaderNames,
						value: `Bearer ${deliveryApiKey}`,
					},
				]
			: []),
	];
}

async function resolvePagingQueryAsync<TPayload extends JsonValue, TBodyData extends JsonValue, TExtraMetadata = EmptyObject>(
	data: Parameters<typeof getPagingQuery<TPayload, TBodyData, TExtraMetadata>>[0],
): Promise<ResolveToAllPromiseQuery<TPayload, TExtraMetadata>> {
	const responses: SyncResponse<TPayload, TExtraMetadata>[] = [];
	let nextContinuationToken: string | undefined = data.continuationToken;

	while (nextContinuationToken) {
		const { success, response, error } = await getQuery<TPayload, TBodyData, TExtraMetadata>({
			...data,
			continuationToken: nextContinuationToken,
		}).toPromise();

		if (success) {
			responses.push(response);

			if (data.canFetchNextResponse(response)) {
				nextContinuationToken = response.meta.continuationToken;
			} else {
				nextContinuationToken = undefined;
			}
		} else {
			return {
				success: false,
				error: error,
			};
		}
	}

	if (responses.length === 0) {
		return {
			success: false,
			error: {
				reason: "noResponses",
				url: data.url,
				message: "No responses were processed. Expected at least one response to be fetched when using paging queries.",
			},
		};
	}

	return {
		success: true,
		responses: responses,
		lastContinuationToken: responses.at(-1)?.meta.continuationToken ?? "",
	};
}

async function resolveQueryAsync<TPayload extends JsonValue, TBodyData extends JsonValue, TExtraMetadata = EmptyObject>({
	config,
	request,
	url,
	extraMetadata,
	zodSchema,
	continuationToken,
}: {
	readonly continuationToken: string | undefined;
	readonly request: Parameters<HttpService["requestAsync"]>[number] & { readonly body: TBodyData };
	readonly extraMetadata: (response: SuccessfulHttpResponse<TPayload, TBodyData>) => TExtraMetadata;
	readonly config: SyncClientConfig;
	readonly url: string;
	readonly zodSchema: ZodType<TPayload>;
}): ResolveToPromiseQuery<TPayload, TExtraMetadata> {
	const { success, response, error } = await getHttpService(config).requestAsync<TPayload, TBodyData>({
		...request,
		requestHeaders: getCombinedRequestHeaders({
			requestHeaders: request.requestHeaders ?? [],
			continuationToken,
			deliveryApiKey: config.deliveryApiKey,
		}),
	});

	if (!success) {
		return {
			success: false,
			error,
		};
	}

	if (config.responseValidation?.enable) {
		const { isValid, error: validationError } = await validateResponseAsync(response.data, zodSchema);
		if (!isValid) {
			return {
				success: false,
				error: {
					message: `Failed to validate response schema for url '${url}'`,
					reason: "validationFailed",
					zodError: validationError,
					response,
					url,
				},
			};
		}
	}

	return {
		success: true,
		response: {
			payload: response.data,
			meta: {
				responseHeaders: response.adapterResponse.responseHeaders,
				status: response.adapterResponse.status,
				continuationToken: extractContinuationToken(response.adapterResponse.responseHeaders),
				...extraMetadata(response),
			},
		},
	};
}

async function validateResponseAsync<TPayload extends JsonValue>(
	data: TPayload,
	zodSchema: ZodType<TPayload>,
): Promise<
	| {
			readonly isValid: true;
			readonly error?: never;
	  }
	| {
			readonly isValid: false;
			readonly error: ZodError;
	  }
> {
	const validateResult = await zodSchema.safeParseAsync(data);

	if (validateResult.success) {
		return {
			isValid: true,
		};
	}

	return {
		isValid: false,
		error: validateResult.error,
	};
}
