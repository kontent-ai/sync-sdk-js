import { getQuery, type Query } from "@kontent-ai/core-sdk";
import { z } from "zod";
import { MissingContinuationTokenError, type SyncClient, type SyncClientConfig, type SyncClientTypes } from "../models/core.models.js";
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
		sdkInfo: syncSdkInfo,
		authorizationApiKey: config.deliveryApiKey,
		zodSchema: initQueryPayloadSchema,
		continuationToken: undefined,
		extraMetadata: (_, data) => {
			if (!data.continuationToken) {
				throw new MissingContinuationTokenError();
			}

			return {
				continuationToken: data.continuationToken,
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
