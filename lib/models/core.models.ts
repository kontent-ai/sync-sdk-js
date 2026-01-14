import type { AdapterResponse, ContinuationHeaderName, SdkConfig } from "@kontent-ai/core-sdk";
import type { InitQuery } from "../queries/init-query.js";
import type { SyncQuery } from "../queries/sync-query.js";

export type SyncClientTypes = {
	readonly languageCodenames: string;
	readonly typeCodenames: string;
	readonly workflowCodenames: string;
	readonly workflowStepCodenames: string;
	readonly collectionCodenames: string;
	readonly taxonomyCodenames: string;
};

export type SyncResponseMeta<TExtraMetadata = unknown> = Pick<AdapterResponse, "status" | "responseHeaders"> & {
	readonly continuationToken?: string;
} & TExtraMetadata;

export type SyncResponse<TPayload, TExtraMetadata = unknown> = {
	readonly payload: TPayload;
	readonly meta: SyncResponseMeta<TExtraMetadata>;
};

export type ApiMode = "public" | "preview" | "secure";

export type SyncClientConfig = SdkConfig & {
	/**
	 * The environment ID of your Kontent.ai project. Can be found under 'Project settings' in the Kontent.ai app.
	 */
	readonly environmentId: string;

	/**
	 * Delivery API key.
	 *
	 * Required for secure and preview modes.
	 */
	readonly deliveryApiKey?: string;

	/**
	 * Mode for the API.
	 *
	 * Secure mode requires a delivery API key with secure access.
	 * Preview mode requires a delivery API key with preview access.
	 * Delivery mode is used for public access.
	 */
	readonly apiMode: ApiMode;
};

/**
 * Sync client instance.
 *
 * @param TSyncApiTypes - The types representing your Kontent.ai environment.
 * Can be used to narrow down the types of the response payload.
 * For example, the codenames of langauges, content types etc. can be narrowed.
 */
export type SyncClient<TSyncApiTypes extends SyncClientTypes = SyncClientTypes> = {
	readonly config: SyncClientConfig;

	/**
	 * Initializes synchronization of changes in all of the supported entities.
	 * After the initialization, you’ll get the X-Continuation token which you
	 * should store for later use in the 'sync' function.
	 */
	init(): InitQuery;

	/**
	 * Retrieve a list of delta updates to changed entities since the last synchronization.
	 *
	 * @param continuationToken - The continuation token received either from the 'init' function or from the previous 'sync' call.
	 */
	sync(continuationToken: string): SyncQuery<TSyncApiTypes>;
};

export type CreateSyncClientOptions = Omit<SyncClientConfig, "environmentId" | "apiMode" | "deliveryApiKey">;

export class MissingContinuationTokenError extends Error {
	constructor() {
		super(`Missing '${"X-Continuation" satisfies ContinuationHeaderName}' header`);
	}
}
