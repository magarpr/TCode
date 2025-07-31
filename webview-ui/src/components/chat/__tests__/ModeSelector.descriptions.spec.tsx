import React from "react"
import { render, screen, fireEvent } from "@/utils/test-utils"
import { describe, test, expect, vi } from "vitest"
import ModeSelector from "../ModeSelector"
import { Mode } from "@roo/modes"
import { ModeConfig } from "@roo-code/types"

// Mock the dependencies
vi.mock("@/utils/vscode", () => ({
	vscode: {
		postMessage: vi.fn(),
	},
}))

vi.mock("@/context/ExtensionStateContext", () => ({
	useExtensionState: () => ({
		hasOpenedModeSelector: false,
		setHasOpenedModeSelector: vi.fn(),
	}),
}))

vi.mock("@/i18n/TranslationContext", () => ({
	useAppTranslation: () => ({
		t: (key: string) => {
			const translations: Record<string, string> = {
				"chat:modeSelector.title": "Select Mode",
				"chat:modeSelector.description": "Choose the mode that best fits your task",
				"chat:modeSelector.marketplace": "Browse Marketplace",
				"chat:modeSelector.settings": "Mode Settings",
			}
			return translations[key] || key
		},
	}),
}))

vi.mock("@/components/ui/hooks/useRooPortal", () => ({
	useRooPortal: () => document.body,
}))

vi.mock("@/utils/TelemetryClient", () => ({
	telemetryClient: {
		capture: vi.fn(),
	},
}))

const mockModes: ModeConfig[] = [
	{
		slug: "code",
		name: "Code",
		iconName: "codicon-code",
		roleDefinition: "You are a software engineer",
		description: "Write, modify, and refactor code",
		groups: ["read", "edit"],
	},
	{
		slug: "ask",
		name: "Ask",
		iconName: "codicon-question",
		roleDefinition: "You are a technical assistant",
		description: "Get answers and explanations",
		groups: ["read"],
	},
	{
		slug: "no-desc",
		name: "No Description",
		iconName: "codicon-gear",
		roleDefinition: "A mode without description",
		// No description field
		groups: ["read"],
	},
]

describe("ModeSelector Descriptions", () => {
	test("shows descriptions when available", async () => {
		render(
			<ModeSelector
				value={"code" as Mode}
				onChange={vi.fn()}
				modeShortcutText="Ctrl+M"
				customModes={mockModes}
			/>,
		)

		// Click to open the selector
		const trigger = screen.getByTestId("mode-selector-trigger")
		fireEvent.click(trigger)

		// Check that descriptions are rendered for modes that have them
		expect(screen.getByText("Write, modify, and refactor code")).toBeInTheDocument()
		expect(screen.getByText("Get answers and explanations")).toBeInTheDocument()
	})

	test("handles modes without descriptions gracefully", async () => {
		render(
			<ModeSelector
				value={"no-desc" as Mode}
				onChange={vi.fn()}
				modeShortcutText="Ctrl+M"
				customModes={mockModes}
			/>,
		)

		// Click to open the selector
		const trigger = screen.getByTestId("mode-selector-trigger")
		fireEvent.click(trigger)

		// Mode name should be present
		expect(screen.getByText("No Description")).toBeInTheDocument()

		// But no description paragraph should be rendered for this mode
		const modeItems = screen.getAllByTestId("mode-selector-item")
		const noDescItem = modeItems.find((item) => item.textContent?.includes("No Description"))

		// Should only have the mode name, no description paragraph
		expect(noDescItem?.querySelectorAll("p")).toHaveLength(1) // Only the name paragraph
	})

	test("prioritizes customModePrompts descriptions over built-in descriptions", async () => {
		const customModePrompts = {
			code: {
				description: "Custom enhanced code mode description",
			},
		}

		render(
			<ModeSelector
				value={"code" as Mode}
				onChange={vi.fn()}
				modeShortcutText="Ctrl+M"
				customModes={mockModes}
				customModePrompts={customModePrompts}
			/>,
		)

		// Click to open the selector
		const trigger = screen.getByTestId("mode-selector-trigger")
		fireEvent.click(trigger)

		// Should show the custom description, not the built-in one
		expect(screen.getByText("Custom enhanced code mode description")).toBeInTheDocument()
		expect(screen.queryByText("Write, modify, and refactor code")).not.toBeInTheDocument()
	})
})
