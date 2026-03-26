import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerProjectTools } from './projects.js';
import { registerWorkItemTools } from './work-items.js';
import { registerStateTools } from './states.js';
import { registerLabelTools } from './labels.js';
import { registerPageTools } from './pages.js';
import { registerAssetTools } from './assets.js';
import { registerMemberTools } from './members.js';
import { registerModuleTools } from './modules.js';
import { registerCycleTools } from './cycles.js';
import { registerCustomizationTools } from './customization.js';
import { registerUtilityTools } from './utility.js';

export function registerTools(server: McpServer): void {
  registerProjectTools(server);       //  4 tools
  registerWorkItemTools(server);      // 10 tools
  registerStateTools(server);         //  2 tools
  registerLabelTools(server);         //  3 tools
  registerPageTools(server);          //  9 tools
  registerAssetTools(server);         //  2 tools
  registerMemberTools(server);        //  2 tools
  registerModuleTools(server);        //  5 tools
  registerCycleTools(server);         //  5 tools
  registerCustomizationTools(server); //  8 tools
  registerUtilityTools(server);       //  1 tool
  // Total: 51 tools
}
