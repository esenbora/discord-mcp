#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

import { connectClient, disconnectClient } from "./discord-client.js";
import { messagingTools } from "./tools/messaging.js";
import { channelTools } from "./tools/channels.js";
import { serverTools } from "./tools/server.js";
import { memberTools } from "./tools/members.js";
import { roleTools } from "./tools/roles.js";
import { moderationTools } from "./tools/moderation.js";

// Combine all tools
const allTools = {
  ...messagingTools,
  ...channelTools,
  ...serverTools,
  ...memberTools,
  ...roleTools,
  ...moderationTools,
};

type ToolName = keyof typeof allTools;

// Create MCP server
const server = new Server(
  {
    name: "discord-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.entries(allTools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!(name in allTools)) {
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }

  const tool = allTools[name as ToolName];

  try {
    const result = await tool.handler(args as never);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: true,
              message: errorMessage,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Handle graceful shutdown
async function shutdown() {
  console.error("Shutting down Discord MCP server...");
  await disconnectClient();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start the server
async function main() {
  // Verify Discord token is set
  if (!process.env.DISCORD_BOT_TOKEN) {
    console.error("Error: DISCORD_BOT_TOKEN environment variable is required");
    process.exit(1);
  }

  // Connect to Discord
  try {
    await connectClient();
    console.error("Discord client connected successfully");
  } catch (error) {
    console.error("Failed to connect to Discord:", error);
    process.exit(1);
  }

  // Start MCP server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Discord MCP server started");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
