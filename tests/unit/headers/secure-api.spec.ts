import { type CommonHeaderNames, getDefaultHttpAdapter, getDefaultHttpService, type Header } from "@kontent-ai/core-sdk";
import { getFetchJsonMock } from "@kontent-ai/core-sdk/testkit";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SyncHeaderNames } from "../../../lib/models/core.models.js";
import { getSyncClient } from "../../../lib/public_api.js";

describe("Secure API", async () => {
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
	const secureApiKey = "y";

	await getSyncClient("x")
		.secureApi(secureApiKey)
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

	const authorizationHeader = requestHeaders.find((header) => header.name === ("Authorization" satisfies CommonHeaderNames));

	it("Request headers should contain authorization header with secure API key", () => {
		expect(authorizationHeader?.value).toEqual(`Bearer ${secureApiKey}`);
	});
});
