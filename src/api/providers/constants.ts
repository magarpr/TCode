import { Package } from "../../shared/package"

export const DEFAULT_HEADERS = {
	"HTTP-Referer": "https://takara.ai",
	"X-Title": "TAKARA AI",
	"X-TakaraAI-Version": Package.version,
	"User-Agent": `TAKARA AI/${Package.version}`,
}
