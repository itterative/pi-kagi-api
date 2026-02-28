import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

import registerLogin from "./login";

export default function registerCommands(pi: ExtensionAPI) {
    registerLogin(pi);
}
