import { type ErrorReason, getDefaultHttpService } from "@kontent-ai/core-sdk";
import { describe, expect, it } from "vitest";
import { getSyncClient } from "../../../lib/public_api.js";

describe("Retry strategy config", async () => {
	const maxRetries = 7;
	const statusCode = 429;
	const statusText = "Too Many Requests";
	const { success, error } = await getSyncClient("x")
		.previewApi("y")
		.create({
			httpService: getDefaultHttpService({
				retryStrategy: {
					canRetryError: () => {
						return true;
					},
					logRetryAttempt: false,
					getDelayBetweenRetriesMs: () => 0,
					maxRetries: maxRetries,
				},
				adapter: {
					requestAsync: async () => {
						return await Promise.resolve({
							isValidResponse: false,
							data: {},
							status: statusCode,
							statusText: statusText,
							toBlobAsync: async () => {
								return await Promise.resolve(new Blob([]));
							},
							toJsonAsync: async () => {
								return await Promise.resolve(null);
							},
							responseHeaders: [],
						});
					},
				},
			}),
		})
		.init()
		.toPromise();

	it("Custom retry strategy should be used", () => {
		expect(success).toBe(false);
		expect(error).toBeDefined();
		expect(error?.details.reason).toStrictEqual<ErrorReason>("invalidResponse");

		if (error?.details.reason === "invalidResponse") {
			expect(error.details.status).toStrictEqual(statusCode);
			expect(error.details.retryAttempt).toStrictEqual(maxRetries);
			expect(error.details.statusText).toStrictEqual(statusText);
		} else {
			throw new Error(`Unexpected error reason '${error?.details.reason}'`);
		}
	});
});
