import fs from "node:fs";
import path from "node:path";

import {
    KAGI_API_TOKEN,
    KAGI_CONFIG_PATH,
    KAGI_CONFIG_PATH_GLOBAL,
} from "./constants";

export interface KagiConfig {
    token: string;
    searchProvider: "fastgpt" | "enrichment";
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

        if (!data.token && !KAGI_API_TOKEN) {
            return null;
        }

        return {
            token: data.token ?? KAGI_API_TOKEN ?? "",
            searchProvider: data.searchProvider ?? "fastgpt",
        } as KagiConfig;
    } catch (e) {
        return null;
    }
}

function findConfigLocations(cwd: string): string[] {
    const locations: string[] = [];

    let currentFolder = cwd;

    if (KAGI_CONFIG_PATH) {
        locations.push(KAGI_CONFIG_PATH);
    }

    for (let i = 0; i < 20; i++) {
        if (!currentFolder) {
            break;
        }

        const configPath = path.join(cwd, ".pi", "kagi-config.json");

        try {
            fs.accessSync(configPath, fs.constants.R_OK);

            if (fs.existsSync(configPath)) {
                locations.push(configPath);
            }
        } catch (e) {
            break;
        }

        const parentFolder = path.join(cwd, "..");

        if (parentFolder === currentFolder) {
            break;
        }

        currentFolder = parentFolder;
    }

    locations.push(KAGI_CONFIG_PATH_GLOBAL);

    return locations;
}

let _config: KagiConfig | null = null;

export default {
    get default(): KagiConfig {
        return {
            token: "",
            searchProvider: "fastgpt",
        }
    },

    get current(): KagiConfig | null {
        if (_config === null) {
            const locations = findConfigLocations(process.cwd());

            if (locations.length === 0) {
                return null;
            }

            _config = tryLoad(locations[0]);
        }

        return _config;
    },

    load(cwd: string) {
        const locations = findConfigLocations(cwd);

        let config: KagiConfig | null = null;
        if (locations.length > 0) {
            config = tryLoad(locations[0]);
        }

        if (config === null) {
            throw new Error("could not load kagi config");
        }

        _config = config;
        return _config;
    },

    save(config: KagiConfig, cwd?: string) {
        cwd = cwd ?? process.cwd();
        const locations = findConfigLocations(cwd);

        const config_path = locations[0] ?? KAGI_CONFIG_PATH ?? KAGI_CONFIG_PATH_GLOBAL;

        if (!fs.existsSync(config_path)) {
            fs.mkdirSync(path.dirname(config_path), {
                recursive: true,
                mode: 0o640,
            });
        }

        fs.writeFileSync(config_path, JSON.stringify(config), {
            mode: 0o600,
        });

        _config = config;
        return _config;
    },
};
