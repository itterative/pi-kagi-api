import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

import registerLogin from "./login";
import registerSettings from "./settings";

export default function registerCommands(pi: ExtensionAPI) {
    registerLogin(pi);
    registerSettings(pi);
}
