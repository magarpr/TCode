#!/usr/bin/env node

/**
 * VS Code theme to CSS variables converter using npm libraries
 * Fetches official VS Code themes and converts them to CSS variables for Storybook
 */

import fs from "fs"
import path from "path"
import fetch from "node-fetch"
import { parseTree, getNodeValue } from "jsonc-parser"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Convert VS Code theme colors to CSS variables
function convertThemeToCSS(theme, themeName) {
	const entries = Object.entries(theme.colors || {})

	// Generate base variables (actual theme colors)
	const baseVars = entries
		.map(([key, value]) => {
			const baseVar = `--${key.replace(/\./g, "-")}`
			return `\t${baseVar}: ${value};`
		})
		.join("\n")

	// Generate VSCode delegation variables (reference base variables)
	const vsCodeVars = entries
		.map(([key, value]) => {
			const baseVar = `--${key.replace(/\./g, "-")}`
			const vsCodeVar = `--vscode-${key.replace(/\./g, "-")}`
			return `\t${vsCodeVar}: var(${baseVar});`
		})
		.join("\n")

	return `/* ${themeName} theme - Generated from VS Code */
@import '../.storybook/design-system.css';

/* Theme Colors */
${baseVars}

/* VSCode Variable Delegations */
${vsCodeVars}`
}

// Resolve theme includes using jsonc-parser
async function resolveThemeIncludes(theme, baseUrl) {
	if (!theme.include) {
		return theme
	}

	try {
		const includeUrl = `${baseUrl}${theme.include.replace("./", "")}`
		console.log(`  Resolving include: ${theme.include}`)

		const includeResponse = await fetch(includeUrl)
		const includeText = await includeResponse.text()

		// Parse with jsonc-parser (handles comments, trailing commas)
		const includeTree = parseTree(includeText)
		const includeTheme = getNodeValue(includeTree)

		// Recursively resolve includes
		const resolvedInclude = await resolveThemeIncludes(includeTheme, baseUrl)

		// Merge themes (current theme overrides included theme)
		return {
			...resolvedInclude,
			...theme,
			colors: {
				...resolvedInclude.colors,
				...theme.colors,
			},
		}
	} catch (error) {
		console.warn(`  Warning: Could not resolve include ${theme.include}:`, error.message)
		return theme
	}
}

// Main conversion function
async function convertVSCodeTheme(themeName) {
	const baseUrl = "https://raw.githubusercontent.com/microsoft/vscode/main/extensions/theme-defaults/themes/"

	try {
		console.log(`Fetching ${themeName} theme...`)
		const response = await fetch(`${baseUrl}${themeName}.json`)

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		const themeText = await response.text()

		// Parse with jsonc-parser (handles comments, trailing commas)
		const tree = parseTree(themeText)
		const theme = getNodeValue(tree)

		// Resolve any includes and convert to CSS
		const resolvedTheme = await resolveThemeIncludes(theme, baseUrl)
		const css = convertThemeToCSS(resolvedTheme, resolvedTheme.name || themeName)

		return css
	} catch (error) {
		console.error(`Error converting ${themeName}:`, error.message)
		throw error
	}
}

async function generateThemes() {
	const outputDir = path.join(__dirname, "../generated-theme-styles")

	// Ensure output directory exists
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true })
	}

	const themes = [
		{ name: "dark_modern", filename: "dark-modern.css" },
		{ name: "light_modern", filename: "light-modern.css" },
	]

	console.log("🎨 Generating VS Code themes for Storybook...\n")

	for (const { name, filename } of themes) {
		try {
			const css = await convertVSCodeTheme(name)
			const outputPath = path.join(outputDir, filename)

			fs.writeFileSync(outputPath, css)
			console.log(`✅ Generated ${filename}`)
		} catch (error) {
			console.error(`❌ Failed to generate ${filename}:`, error.message)
		}
	}

	console.log(`\n🎉 Theme generation complete! Files saved to ${outputDir}`)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	generateThemes().catch(console.error)
}
