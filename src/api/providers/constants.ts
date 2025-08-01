import { Package } from "../../shared/package"

export const DEFAULT_HEADERS = {
	"HTTP-Referer": "https://kilocode.ai",
	"X-Title": "TAKARA AI",
	"X-KiloCode-Version": Package.version,
	"User-Agent": `TAKARA AI/${Package.version}`,
}
