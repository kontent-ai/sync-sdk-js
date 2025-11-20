import { describe, expect, it, suite } from "vitest";
import type { ZodType } from "zod/v4";
import { getSyncClient } from "../../lib/client/sync-client.js";
import type { ResultOfSuccessfulQuery, SyncClientTypes } from "../../lib/models/core.models.js";
import { type SyncQuery, syncQueryPayloadSchema } from "../../lib/queries/sync-query.js";
import {
	contentItemDeltaObjectSchema,
	contentTypeDeltaObjectSchema,
	languageDeltaObjectSchema,
	taxonomyDeltaObjectSchema,
} from "../../lib/schemas/synchronization.schemas.js";
import { getIntegrationTestConfig } from "../integration-tests.config.js";
import { pollSyncApiAsync, prepareEnvironmentAsync, processChangesForIntegrationTestAsync } from "../utils/integration-test.utils.js";

type IntegrationSyncData = Parameters<typeof processChangesForIntegrationTestAsync>[0];

describe("Sync query", async () => {
	const config = getIntegrationTestConfig();
	const client = getSyncClient(config.env.id).publicApi().create({
		baseUrl: config.env.syncBaseUrl,
	});
	const syncData = getSyncData();
	const pollWaitInMs: number = 1000;
	const maxRetries: number = 30;

	await prepareEnvironmentAsync(syncData);

	// Get initial continuation token after preparing environment & waiting until Delivery API changes are propagated
	const { response } = await client.init().toPromise();

	const token = response?.meta.continuationToken ?? "n/a";

	it("Init response should have continuation token", () => {
		expect(response?.meta.continuationToken).toBeDefined();
	});

	await processChangesForIntegrationTestAsync(syncData);

	const validateSyncResponseAndObjectAsync = ({
		success,
		schema,
		deltaObject,
		syncResponse,
	}: {
		readonly success: boolean;
		readonly schema: ZodType;
		readonly deltaObject: unknown;
		readonly syncResponse: ResultOfSuccessfulQuery<SyncQuery<SyncClientTypes>> | undefined;
	}) => {
		it("Success should be true", () => {
			expect(success).toBe(true);
		});

		it("Response should have continuation token", () => {
			expect(syncResponse?.meta.continuationToken).toBeDefined();
		});

		it("Sync Continuation token should should be different from init continuation token", () => {
			expect(syncResponse?.meta.continuationToken).not.toBe(token);
		});

		it("Response payload should match sync query payload schema", async () => {
			const parseResult = await syncQueryPayloadSchema.safeParseAsync(syncResponse?.payload);
			expect(parseResult.error).toBeUndefined();
			expect(parseResult.success).toBeTruthy();
		});

		it("Response payload should match schema", async () => {
			const parseResult = await schema.safeParseAsync(deltaObject);
			expect(parseResult.error).toBeUndefined();
			expect(parseResult.success).toBeTruthy();
		});
	};

	suite.concurrent("Type delta object", async () => {
		const { success, deltaObject, syncResponse } = await pollSyncApiAsync({
			client,
			token,
			getDeltaObject: (response) => response.payload.types.find((m) => m.data.system.codename === syncData.type.codename),
			retryAttempt: 0,
			maxRetries,
			pollWaitInMs,
		});

		await validateSyncResponseAndObjectAsync({
			success,
			deltaObject,
			syncResponse,
			schema: contentTypeDeltaObjectSchema,
		});
	});

	suite.concurrent("Taxonomy delta object", async () => {
		const { success, deltaObject, syncResponse } = await pollSyncApiAsync({
			client,
			token,
			getDeltaObject: (response) => response.payload.taxonomies.find((m) => m.data.system.codename === syncData.taxonomy.codename),
			retryAttempt: 0,
			maxRetries,
			pollWaitInMs,
		});

		await validateSyncResponseAndObjectAsync({
			success,
			deltaObject,
			syncResponse,
			schema: taxonomyDeltaObjectSchema,
		});
	});

	suite.concurrent("Item delta object", async () => {
		const { success, deltaObject, syncResponse } = await pollSyncApiAsync({
			client,
			token,
			getDeltaObject: (response) => response.payload.items.find((m) => m.data.system.codename === syncData.item.codename),
			retryAttempt: 0,
			maxRetries,
			pollWaitInMs,
		});

		await validateSyncResponseAndObjectAsync({
			success,
			deltaObject,
			syncResponse,
			schema: contentItemDeltaObjectSchema,
		});
	});

	suite.concurrent("Language delta object", async () => {
		const { success, deltaObject, syncResponse } = await pollSyncApiAsync({
			client,
			token,
			getDeltaObject: (response) => response.payload.languages.find((m) => m.data.system.codename === syncData.language.codename),
			retryAttempt: 0,
			maxRetries,
			pollWaitInMs,
		});

		await validateSyncResponseAndObjectAsync({
			success,
			deltaObject,
			syncResponse,
			schema: languageDeltaObjectSchema,
		});
	});
});

function getSyncData(): IntegrationSyncData {
	const timestamp = Date.now();

	return {
		item: {
			codename: "integration_test_item",
			name: `Integration item (${timestamp})`,
		},
		type: {
			codename: "integration_test_type",
			name: `Integration type (${timestamp})`,
		},
		language: {
			codename: "default",
			name: `Lang (${timestamp})`,
		},
		taxonomy: {
			codename: "integration_test_taxonomy",
			name: `Integration taxonomy (${timestamp})`,
		},
		element: { type: "text", name: "Text element", codename: "text_el", value: "Elem value" },
	};
}
