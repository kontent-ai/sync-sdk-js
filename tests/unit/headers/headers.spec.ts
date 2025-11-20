import { getDefaultHttpAdapter, getDefaultHttpService, getSdkIdHeader, type Header } from "@kontent-ai/core-sdk";
import { getFetchJsonMock } from "@kontent-ai/core-sdk/testkit";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SyncHeaderNames } from "../../../lib/models/core.models.js";
import { getSyncClient } from "../../../lib/public_api.js";

describe("Sync tracking header", async () => {
	const expectedHeader = getSdkIdHeader({
		name: "@kontent-ai/sync-sdk",
		version: "{{version}}", // macro is replaced by the version from package.json during build
		host: "npmjs.com",
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	global.fetch = getFetchJsonMock({
		json: {},
		status: 200,
		responseHeaders: [
			{
				name: "X-Continuation" satisfies SyncHeaderNames,
				value: "x",
			},
		],
	});

	let requestHeaders: readonly Header[] = [];

	await getSyncClient("x")
		.publicApi()
		.create({
			httpService: getDefaultHttpService({
				adapter: {
					requestAsync: async (options) => {
						requestHeaders = options.requestHeaders ?? [];

						return await getDefaultHttpAdapter().requestAsync(options);
					},
				},
			}),
		})
		.init()
		.toPromise();

	const syncTrackingHeader = requestHeaders.find((header) => header.name === expectedHeader.name);

	it("Request headers should contain sync tracking header with current package info", () => {
		expect(syncTrackingHeader?.value).toEqual(expectedHeader.value);
	});
});
