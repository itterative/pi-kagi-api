import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

import registerTools from "./tools";
import registerCommands from "./commands";

export default function (pi: ExtensionAPI) {
    registerCommands(pi);
    registerTools(pi);
}
