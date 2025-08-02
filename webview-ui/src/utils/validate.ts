import i18next from "i18next"

import type { ProviderSettings, OrganizationAllowList } from "@roo-code/types"

export function validateApiConfiguration(
	apiConfiguration: ProviderSettings,
	organizationAllowList?: OrganizationAllowList,
): string | undefined {
	const keyError = validateModelsAndKeysProvided(apiConfiguration)
	if (keyError) return keyError

	const orgError = validateProviderAgainstOrganizationSettings(apiConfiguration, organizationAllowList)
	if (orgError) return orgError.message

	return validateModelId(apiConfiguration)
}

export function validateApiConfigurationExcludingModelErrors(
	apiConfiguration: ProviderSettings,
	organizationAllowList?: OrganizationAllowList,
): string | undefined {
	const keyError = validateModelsAndKeysProvided(apiConfiguration)
	if (keyError) return keyError

	const orgError = validateProviderAgainstOrganizationSettings(apiConfiguration, organizationAllowList)
	if (orgError) return orgError.message

	return undefined
}

export function validateModelId(apiConfiguration: ProviderSettings): string | undefined {
	const provider = apiConfiguration.apiProvider ?? ""
	if (provider === "openai" && !apiConfiguration.openAiModelId) {
		return i18next.t("settings:validation.modelId")
	}
	return undefined
}

export const getModelValidationError = validateModelId

function validateModelsAndKeysProvided(apiConfiguration: ProviderSettings): string | undefined {
	switch (apiConfiguration.apiProvider) {
		case "openai-native":
			if (!apiConfiguration.openAiNativeApiKey) {
				return i18next.t("settings:validation.apiKey")
			}
			break
		case "openai":
		default:
			if (!apiConfiguration.openAiBaseUrl || !apiConfiguration.openAiApiKey || !apiConfiguration.openAiModelId) {
				return i18next.t("settings:validation.openAi")
			}
			break
	}

	return undefined
}

type ValidationError = { message: string; code: "PROVIDER_NOT_ALLOWED" | "MODEL_NOT_ALLOWED" }

function validateProviderAgainstOrganizationSettings(
	apiConfiguration: ProviderSettings,
	organizationAllowList?: OrganizationAllowList,
): ValidationError | undefined {
	if (organizationAllowList && !organizationAllowList.allowAll) {
		const provider = apiConfiguration.apiProvider
		if (!provider) return undefined
		const providerConfig = organizationAllowList.providers[provider]
		if (!providerConfig) {
			return {
				message: i18next.t("settings:validation.providerNotAllowed", { provider }),
				code: "PROVIDER_NOT_ALLOWED",
			}
		}

		if (!providerConfig.allowAll) {
			const modelId = provider === "openai" ? apiConfiguration.openAiModelId : apiConfiguration.apiModelId
			const allowedModels = providerConfig.models || []

			if (modelId && !allowedModels.includes(modelId)) {
				return {
					message: i18next.t("settings:validation.modelNotAllowed", { model: modelId, provider }),
					code: "MODEL_NOT_ALLOWED",
				}
			}
		}
	}
}
