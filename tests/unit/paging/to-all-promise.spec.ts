import { getDefaultHttpService } from "@kontent-ai/core-sdk";
import { describe, expect, it } from "vitest";
import type { SyncHeaderNames } from "../../../lib/models/core.models.js";
import { getSyncClient, type SyncClientTypes, type SyncQueryPayload } from "../../../lib/public_api.js";

describe("Paging with 'toAllPromise'", async () => {
	const tokens: readonly string[] = ["a", "b", "c", "d", "e"];

	const httpService = getDefaultHttpService({
		adapter: {
			requestAsync: async (data) => {
				const continuationToken = data.requestHeaders?.find(
					(header) => header.name.toLowerCase() === ("X-Continuation" satisfies SyncHeaderNames).toLowerCase(),
				)?.value;

				if (!continuationToken) {
					throw new Error("Continuation must be provided in all request headers");
				}

				const tokenIndex = tokens.indexOf(continuationToken);
				const nextTokenIndex = tokenIndex + 1;
				const nextToken = tokens.length > nextTokenIndex ? tokens[nextTokenIndex] : undefined;

				return await Promise.resolve({
					isValidResponse: true,
					responseHeaders: [
						{
							name: "X-Continuation" satisfies SyncHeaderNames,
							// use next token if available, otherwise use the current token
							value: nextToken ? nextToken : continuationToken,
						},
					],
					status: 200,
					toJsonAsync: async () => Promise.resolve(getSyncQueryPayload(continuationToken, tokenIndex === tokens.length - 1)),
					toBlobAsync: () => {
						throw new Error("Not implemented");
					},
					statusText: "Ok",
				});
			},
		},
	});

	const { success, responses, lastContinuationToken } = await getSyncClient("x")
		.publicApi()
		.create({ httpService })
		.sync(tokens[0])
		.toAllPromise();

	it("Should be successful", () => {
		expect(success).toBe(true);
	});

	it(`Should return '${tokens.length}' responses`, () => {
		expect(responses?.length).toBe(tokens.length);
	});

	it("Last continuation token should be the same as last response continuation token", () => {
		expect(lastContinuationToken).toStrictEqual(responses?.at(-1)?.meta.continuationToken);
	});

	for (const [index, tokenWithResponse] of tokens.entries()) {
		const response = responses?.[index];
		const isLast = index === tokens.length - 1;

		it(`Received payload on index ${index} should be equal to the provided response on the same index`, () => {
			expect(response?.payload).toStrictEqual(getSyncQueryPayload(tokenWithResponse, isLast));
		});

		// The last token should be the same as the last token in the list, otherwise it should be the next token
		const expectedToken = isLast ? tokens.at(-1) : tokens[index + 1];

		it(`Received continuation token on index ${index} should be equal to next token if available, otherwise the last token`, () => {
			expect(response?.meta.continuationToken).toStrictEqual(expectedToken);
		});
	}
});

function getSyncQueryPayload(token: string, isLast: boolean): SyncQueryPayload<SyncClientTypes> {
	if (isLast) {
		return {
			items: [],
			languages: [],
			taxonomies: [],
			types: [],
		};
	}

	return {
		items: [],
		languages: [
			{
				change_type: "changed",
				data: {
					system: {
						id: token,
						name: token,
						codename: token,
					},
				},
				timestamp: "2021-01-01T00:00:00.000Z",
			},
		],
		taxonomies: [],
		types: [],
	};
}
