import fs from "node:fs";
import path from "node:path";

import { KAGI_API_TOKEN, KAGI_CONFIG_PATH, KAGI_CONFIG_PATH_GLOBAL } from "./constants";

export interface KagiConfig {
    token: string
}

function localConfigPath(cwd: string): string {
    return path.join(cwd, ".pi", "kagi-config.json");
}

function tryLoad(path: string): KagiConfig | null {
    if (!fs.existsSync(path)) {
        return null;
    }

    try {
        const data = JSON.parse(fs.readFileSync(path, "utf-8"));

        if (!data || typeof data !== "object") {
            return null;
        }

        if (!data.token) {
            return null;
        }

        return data as KagiConfig;
    } catch (e) {
        return null;
    }
}

export function load(cwd: string): KagiConfig {
    if (KAGI_API_TOKEN) {
        return {
            token: KAGI_API_TOKEN,
        }
    }

    let config: KagiConfig | null = null;

    if (KAGI_CONFIG_PATH) {
        config = tryLoad(KAGI_CONFIG_PATH);
    }

    if (!config) {
        config = tryLoad(localConfigPath(cwd));
    }

    if (!config) {
        config = tryLoad(KAGI_CONFIG_PATH_GLOBAL);
    }

    if (!config) {
        throw new Error("could not load kagi config");
    }

    return config;
}

export function loadConfigOrThrow(cwd: string) {
    try {
        return load(cwd);
    } catch (e) {
        throw new Error(
            "Kagi token could not be retrieved. Please ask user to use /kagi-login command.",
        );
    }
}

export function save(cwd: string, config: KagiConfig) {
    if (!fs.existsSync(KAGI_CONFIG_PATH_GLOBAL)) {
      fs.mkdirSync(path.dirname(KAGI_CONFIG_PATH_GLOBAL), { recursive: true, mode: 0o640 });
    }

    fs.writeFileSync(KAGI_CONFIG_PATH_GLOBAL, JSON.stringify(config), { mode: 0o600 });
}
