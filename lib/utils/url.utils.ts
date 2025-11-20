import type { ApiMode, SyncClientConfig } from "../models/core.models.js";

export function getSyncEndpointUrl({
	environmentId,
	path,
	baseUrl,
	apiMode,
}: { readonly path: string } & Pick<SyncClientConfig, "baseUrl" | "environmentId" | "apiMode">): string {
	return getEndpointUrl({
		environmentId,
		path,
		baseUrl: baseUrl ?? getDefaultBaseUrlForApiMode(apiMode),
	});
}

export function getEndpointUrl({
	environmentId,
	path,
	baseUrl,
}: {
	readonly environmentId: string;
	readonly path: string;
	readonly baseUrl: string;
}): string {
	return removeDuplicateSlashes(`${baseUrl}/${environmentId}/${path}`);
}

function getDefaultBaseUrlForApiMode(apiMode: ApiMode): string {
	if (apiMode === "preview") {
		return "https://preview-deliver.kontent.ai/v2";
	}

	return "https://deliver.kontent.ai/v2";
}

function removeDuplicateSlashes(path: string): string {
	return path.replace(/\/+/g, "/");
}
