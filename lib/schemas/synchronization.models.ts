import type { Override, Prettify } from "@kontent-ai/core-sdk";
import type { z } from "zod";
import type { SyncClientTypes } from "../models/core.models.js";
import type {
	contentItemDeltaObjectSchema,
	contentItemSystemSchema,
	contentTypeDeltaObjectSchema,
	contentTypeSystemSchema,
	languageDeltaObjectSchema,
	languageSystemSchema,
	taxonomyDeltaObjectSchema,
	taxonomySystemSchema,
} from "./synchronization.schemas.js";

export type ContentItemSystem<TSyncApiTypes extends SyncClientTypes> = Prettify<
	Override<
		z.infer<typeof contentItemSystemSchema>,
		{
			readonly collection: TSyncApiTypes["collectionCodenames"];
			readonly type: TSyncApiTypes["typeCodenames"];
			readonly language: TSyncApiTypes["languageCodenames"];
			readonly workflow?: TSyncApiTypes["workflowCodenames"];
			readonly workflow_step?: TSyncApiTypes["workflowStepCodenames"];
		}
	>
>;

export type ContentTypeSystem<TSyncApiTypes extends SyncClientTypes> = Prettify<
	Override<
		z.infer<typeof contentTypeSystemSchema>,
		{
			readonly codename: TSyncApiTypes["typeCodenames"];
		}
	>
>;

export type LanguageSystem<TSyncApiTypes extends SyncClientTypes> = Prettify<
	Override<
		z.infer<typeof languageSystemSchema>,
		{
			readonly codename: TSyncApiTypes["languageCodenames"];
		}
	>
>;

export type TaxonomySystem<TSyncApiTypes extends SyncClientTypes> = Prettify<
	Override<
		z.infer<typeof taxonomySystemSchema>,
		{
			readonly codename: TSyncApiTypes["taxonomyCodenames"];
		}
	>
>;

export type ContentItemDeltaObject<TSyncApiTypes extends SyncClientTypes> = Prettify<
	Override<
		z.infer<typeof contentItemDeltaObjectSchema>,
		{
			readonly data: {
				readonly system: ContentItemSystem<TSyncApiTypes>;
			};
		}
	>
>;

export type ContentTypeDeltaObject<TSyncApiTypes extends SyncClientTypes> = Prettify<
	Override<
		z.infer<typeof contentTypeDeltaObjectSchema>,
		{
			readonly data: {
				readonly system: ContentTypeSystem<TSyncApiTypes>;
			};
		}
	>
>;

export type TaxonomyDeltaObject<TSyncApiTypes extends SyncClientTypes> = Prettify<
	Override<
		z.infer<typeof taxonomyDeltaObjectSchema>,
		{
			readonly data: {
				readonly system: TaxonomySystem<TSyncApiTypes>;
			};
		}
	>
>;

export type LanguageDeltaObject<TSyncApiTypes extends SyncClientTypes> = Prettify<
	Override<
		z.infer<typeof languageDeltaObjectSchema>,
		{
			readonly data: {
				readonly system: LanguageSystem<TSyncApiTypes>;
			};
		}
	>
>;
