import { type ContinuationHeaderName, extractContinuationToken, getQuery, type Query } from "@kontent-ai/core-sdk";
import { z } from "zod";
import type { SyncClient, SyncClientConfig, SyncClientTypes } from "../models/core.models.js";
import { syncSdkInfo } from "../sync-sdk-info.js";
import { getSyncEndpointUrl } from "../utils/url.utils.js";

type InitQueryMetadata = { readonly continuationToken: string };

export const initQueryPayloadSchema = z.readonly(
	z.object({
		items: z.array(z.never()),
		types: z.array(z.never()),
		languages: z.array(z.never()),
		taxonomies: z.array(z.never()),
	}),
);

export type InitQueryPayload = z.infer<typeof initQueryPayloadSchema>;

export type InitQuery = Query<InitQueryPayload, InitQueryMetadata>;

export function getInitQuery<TSyncApiTypes extends SyncClientTypes>(
	config: SyncClientConfig,
): ReturnType<SyncClient<TSyncApiTypes>["init"]> {
	const url = getSyncEndpointUrl({ path: "/sync/init", ...config });

	const { toPromise } = getQuery<InitQueryPayload, null, InitQueryMetadata>({
		config,
		url,
		sdkInfo: syncSdkInfo,
		authorizationApiKey: config.deliveryApiKey,
		zodSchema: initQueryPayloadSchema,
		continuationToken: undefined,
		extraMetadata: (response) => {
			const continuationToken = extractContinuationToken(response.adapterResponse.responseHeaders);

			if (!continuationToken) {
				throw new Error(`Invalid response: missing '${"X-Continuation" satisfies ContinuationHeaderName}' header`);
			}

			return {
				continuationToken,
			};
		},
		request: {
			url,
			body: null,
			method: "POST",
		},
	});

	return {
		toUrl: () => url,
		toPromise,
	};
}
