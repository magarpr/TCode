import { z } from "zod"

import { reasoningEffortsSchema, modelInfoSchema } from "./model.js"
import { codebaseIndexProviderSchema } from "./codebase-index.js"

/**
 * Supported provider names
 */
export const providerNames = ["openai", "openai-native"] as const

export const providerNamesSchema = z.enum(providerNames)

export type ProviderName = z.infer<typeof providerNamesSchema>

/**
 * ProviderSettingsEntry
 */
export const providerSettingsEntrySchema = z.object({
	id: z.string(),
	name: z.string(),
	apiProvider: providerNamesSchema.optional(),
})

export type ProviderSettingsEntry = z.infer<typeof providerSettingsEntrySchema>

/**
 * Default value for consecutive mistake limit
 */
export const DEFAULT_CONSECUTIVE_MISTAKE_LIMIT = 3

const baseProviderSettingsSchema = z.object({
	includeMaxTokens: z.boolean().optional(),
	diffEnabled: z.boolean().optional(),
	todoListEnabled: z.boolean().optional(),
	fuzzyMatchThreshold: z.number().optional(),
	modelTemperature: z.number().nullish(),
	rateLimitSeconds: z.number().optional(),
	consecutiveMistakeLimit: z.number().min(0).optional(),

	// Model reasoning.
	enableReasoningEffort: z.boolean().optional(),
	reasoningEffort: reasoningEffortsSchema.optional(),
	modelMaxTokens: z.number().optional(),
	modelMaxThinkingTokens: z.number().optional(),
})

// Several of the providers share common model config properties.
const apiModelIdProviderModelSchema = baseProviderSettingsSchema.extend({
	apiModelId: z.string().optional(),
})

const openAiSchema = baseProviderSettingsSchema.extend({
	openAiBaseUrl: z.string().optional(),
	openAiApiKey: z.string().optional(),
	openAiLegacyFormat: z.boolean().optional(),
	openAiR1FormatEnabled: z.boolean().optional(),
	openAiModelId: z.string().optional(),
	openAiCustomModelInfo: modelInfoSchema.nullish(),
	openAiUseAzure: z.boolean().optional(),
	azureApiVersion: z.string().optional(),
	openAiStreamingEnabled: z.boolean().optional(),
	openAiHostHeader: z.string().optional(),
	openAiHeaders: z.record(z.string(), z.string()).optional(),
})

const openAiNativeSchema = apiModelIdProviderModelSchema.extend({
	openAiNativeApiKey: z.string().optional(),
	openAiNativeBaseUrl: z.string().optional(),
})

const defaultSchema = z.object({
	apiProvider: z.undefined(),
})

export const providerSettingsSchemaDiscriminated = z.discriminatedUnion("apiProvider", [
	openAiSchema.merge(z.object({ apiProvider: z.literal("openai") })),
	openAiNativeSchema.merge(z.object({ apiProvider: z.literal("openai-native") })),
	defaultSchema,
])

export const providerSettingsSchema = z.object({
	apiProvider: providerNamesSchema.optional(),
	...openAiSchema.shape,
	...openAiNativeSchema.shape,
	...codebaseIndexProviderSchema.shape,
})

export type ProviderSettings = z.infer<typeof providerSettingsSchema>
export const PROVIDER_SETTINGS_KEYS = providerSettingsSchema.keyof().options

export const MODEL_ID_KEYS: Partial<keyof ProviderSettings>[] = ["apiModelId", "openAiModelId"]

export const getModelId = (settings: ProviderSettings): string | undefined => {
	const modelIdKey = MODEL_ID_KEYS.find((key) => settings[key])
	return modelIdKey ? (settings[modelIdKey] as string) : undefined
}

export const getApiProtocol = (provider: ProviderName | undefined, _modelId?: string): "openai" => {
	provider satisfies ProviderName | undefined
	return "openai"
}
