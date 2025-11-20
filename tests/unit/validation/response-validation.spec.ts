import { getDefaultHttpService, type HttpService, type JsonValue } from "@kontent-ai/core-sdk";
import { describe, test } from "vitest";
import { ZodError } from "zod/v4";
import { getSyncClient, type InitQueryPayload, type SyncSdkErrorReason } from "../../../lib/public_api.js";
import { fakeXContinuationTokenHeader } from "../../utils/test.utils.js";

describe("Response validation", () => {
	test("Error should be returned when response does not match schema and validation is enabled", async ({ expect }) => {
		const query = getSyncClient("x")
			.publicApi()
			.create({
				responseValidation: {
					enable: true,
				},
				httpService: getHttpServiceWithJsonResponse({ result: "ok" }),
			})
			.init();

		const { success, error } = await query.toPromise();

		expect(success).toBe(false);
		expect(error).toBeDefined();
		expect(error?.reason).toStrictEqual<SyncSdkErrorReason>("validationFailed");

		if (error?.reason === "validationFailed") {
			expect(error.url).toStrictEqual(query.toUrl());
			expect(error.zodError).toBeInstanceOf(ZodError);
			expect(error.message).toBeDefined();
			expect(error.response).toBeDefined();
		} else {
			throw new Error(`Unexpected error reason '${error?.reason}'`);
		}
	});

	test("Error should not be returned when response does not match schema but validation is disabled", async ({ expect }) => {
		const { success, error } = await getSyncClient("x")
			.publicApi()
			.create({
				responseValidation: {
					enable: true,
				},

				httpService: getHttpServiceWithJsonResponse({
					items: [],
					languages: [],
					taxonomies: [],
					types: [],
				} satisfies InitQueryPayload),
			})
			.init()
			.toPromise();

		expect(success).toBe(true);
		expect(error).toBeUndefined();
	});
});

function getHttpServiceWithJsonResponse(fakeResponse: JsonValue): HttpService {
	return getDefaultHttpService({
		adapter: {
			requestAsync: async () => {
				return await Promise.resolve({
					responseHeaders: [fakeXContinuationTokenHeader],
					status: 200,
					statusText: "Ok",
					isValidResponse: true,
					toJsonAsync: async () => await Promise.resolve(fakeResponse),
					toBlobAsync: () => {
						throw new Error("Not implemented");
					},
				});
			},
		},
	});
}
