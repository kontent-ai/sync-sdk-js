import { type CommonHeaderNames, getDefaultHttpAdapter, getDefaultHttpService, type Header } from "@kontent-ai/core-sdk";
import { mockGlobalFetchJsonResponse } from "@kontent-ai/core-sdk/testkit";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getSyncClient } from "../../../lib/public_api.js";

describe("Secure API", async () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	mockGlobalFetchJsonResponse({
		jsonResponse: {},
		statusCode: 200,
		continuationToken: "x",
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
