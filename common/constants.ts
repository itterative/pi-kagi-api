import os from "node:os";
import path from "node:path";

export const KAGI_API_URL = "https://kagi.com/api/v0";

export const KAGI_CONFIG_PATH_GLOBAL = path.join(os.homedir(), ".pi", "kagi-config.json")

export const KAGI_CONFIG_PATH = process.env.KAGI_CONFIG_PATH;
export const KAGI_API_TOKEN = process.env.KAGI_API_TOKEN;
