import { z } from "zod";

const changeTypeSchema = z.enum(["changed", "deleted"]);

const baseDeltaObjectSchema = z.object({
	change_type: changeTypeSchema,
	timestamp: z.iso.datetime(),
});

export const contentItemSystemSchema = z.readonly(
	z.object({
		id: z.string(),
		collection: z.string(),
		codename: z.string(),
		name: z.string(),
		type: z.string(),
		language: z.string(),
		last_modified: z.string(),
		workflow: z.string().optional(),
		workflow_step: z.string().optional(),
	}),
);

export const contentTypeSystemSchema = z.readonly(
	z.object({
		id: z.string(),
		codename: z.string(),
		name: z.string(),
		last_modified: z.string(),
	}),
);

export const languageSystemSchema = z.readonly(
	z.object({
		id: z.string(),
		codename: z.string(),
		name: z.string(),
	}),
);

export const taxonomySystemSchema = z.readonly(
	z.object({
		id: z.string(),
		codename: z.string(),
		name: z.string(),
		last_modified: z.string(),
	}),
);

export const contentItemDeltaObjectSchema = z.readonly(
	z.object({
		...baseDeltaObjectSchema.shape,
		data: z.readonly(
			z.object({
				system: contentItemSystemSchema,
			}),
		),
	}),
);

export const contentTypeDeltaObjectSchema = z.readonly(
	z.object({
		...baseDeltaObjectSchema.shape,
		data: z.readonly(
			z.object({
				system: contentTypeSystemSchema,
			}),
		),
	}),
);

export const taxonomyDeltaObjectSchema = z.readonly(
	z.object({
		...baseDeltaObjectSchema.shape,
		data: z.readonly(
			z.object({
				system: taxonomySystemSchema,
			}),
		),
	}),
);

export const languageDeltaObjectSchema = z.readonly(
	z.object({
		...baseDeltaObjectSchema.shape,
		data: z.readonly(
			z.object({
				system: languageSystemSchema,
			}),
		),
	}),
);
