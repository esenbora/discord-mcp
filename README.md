# Discord MCP Server

[![npm version](https://badge.fury.io/js/@buzzicra%2Fdiscord-mcp.svg)](https://www.npmjs.com/package/@buzzicra/discord-mcp)

A Model Context Protocol (MCP) server that exposes Discord bot capabilities to Claude.

## Installation

```bash
npm install -g @buzzicra/discord-mcp
```

Or use directly with npx:
```bash
npx @buzzicra/discord-mcp
```

## Features

- **26 tools** covering messaging, channels, servers, members, roles, and moderation
- Full Discord.js v14 integration
- TypeScript with strict typing

## Prerequisites

1. **Node.js 18+**
2. **Discord Bot Token** - Create a bot at [Discord Developer Portal](https://discord.com/developers/applications)

### Bot Permissions

Your Discord bot needs these permissions:
- Read Messages/View Channels
- Send Messages
- Manage Messages
- Add Reactions
- Manage Channels (for channel operations)
- Kick Members
- Ban Members
- Moderate Members (for timeouts)
- Manage Roles

### Required Intents

Enable these **Privileged Gateway Intents** in the Discord Developer Portal:
- Server Members Intent
- Message Content Intent

## Installation

```bash
# Clone or navigate to the directory
cd discord_mcp

# Install dependencies
npm install

# Build
npm run build
```

## Configuration

### Environment Variable

Set `DISCORD_BOT_TOKEN` in your environment:

```bash
export DISCORD_BOT_TOKEN="your-bot-token"
```

### Claude Code MCP Config

Add to your `~/.claude.json` or project's `.mcp.json`:

```json
{
  "mcpServers": {
    "discord": {
      "command": "node",
      "args": ["/path/to/discord_mcp/dist/index.js"],
      "env": {
        "DISCORD_BOT_TOKEN": "your-bot-token"
      }
    }
  }
}
```

## Available Tools

### Messaging (6 tools)
| Tool | Description |
|------|-------------|
| `send_message` | Send a message to a channel |
| `get_messages` | Get recent messages from a channel |
| `edit_message` | Edit an existing message |
| `delete_message` | Delete a message |
| `add_reaction` | Add reaction to a message |
| `reply_to_message` | Reply to a specific message |

### Channels (5 tools)
| Tool | Description |
|------|-------------|
| `list_channels` | List all channels in a server |
| `get_channel` | Get channel details |
| `create_channel` | Create a new channel |
| `delete_channel` | Delete a channel |
| `update_channel` | Update channel settings |

### Server (3 tools)
| Tool | Description |
|------|-------------|
| `get_server_info` | Get server details |
| `list_servers` | List all servers the bot is in |
| `get_server_stats` | Get server statistics |

### Members (4 tools)
| Tool | Description |
|------|-------------|
| `list_members` | List server members |
| `get_member` | Get member details |
| `search_members` | Search members by username |
| `get_member_roles` | Get roles for a member |

### Roles (4 tools)
| Tool | Description |
|------|-------------|
| `list_roles` | List all server roles |
| `add_role` | Add role to member |
| `remove_role` | Remove role from member |
| `create_role` | Create a new role |

### Moderation (4 tools)
| Tool | Description |
|------|-------------|
| `kick_member` | Kick a member from server |
| `ban_member` | Ban a member from server |
| `unban_member` | Unban a user |
| `timeout_member` | Timeout a member |

## Usage Examples

Once configured, you can use natural language with Claude:

- "List all the servers my Discord bot is in"
- "Send a message to channel 123456789 saying 'Hello!'"
- "Get the last 10 messages from channel 123456789"
- "Create a new text channel called 'announcements' in server 987654321"
- "Timeout user 111222333 for 10 minutes"

## Development

```bash
# Watch mode for development
npm run dev

# Type checking
npm run typecheck
```

## Troubleshooting

### "DISCORD_BOT_TOKEN environment variable is required"
Make sure you've set the token in your MCP config or environment.

### "Missing Access" errors
Check that your bot has the required permissions and intents enabled.

### Bot not responding to channel operations
Ensure the bot has access to the specific channel and server.

## License

MIT
