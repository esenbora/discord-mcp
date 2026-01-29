import { connectClient } from "../discord-client.js";
import type { GuildMember } from "discord.js";

export const memberTools = {
  list_members: {
    description: "List members in a Discord server",
    inputSchema: {
      type: "object" as const,
      properties: {
        server_id: {
          type: "string",
          description: "The ID of the server to list members from",
        },
        limit: {
          type: "number",
          description: "Maximum number of members to return (default 100, max 1000)",
        },
      },
      required: ["server_id"],
    },
    handler: async (args: { server_id: string; limit?: number }) => {
      const client = await connectClient();
      const guild = await client.guilds.fetch(args.server_id);

      const members = await guild.members.fetch({
        limit: Math.min(args.limit || 100, 1000),
      });

      return {
        server_id: args.server_id,
        count: members.size,
        members: members.map((member) => ({
          id: member.id,
          username: member.user.username,
          discriminator: member.user.discriminator,
          nickname: member.nickname,
          display_name: member.displayName,
          bot: member.user.bot,
          avatar_url: member.user.avatarURL(),
          joined_at: member.joinedAt?.toISOString(),
          roles: member.roles.cache
            .filter((r) => r.name !== "@everyone")
            .map((r) => ({ id: r.id, name: r.name })),
        })),
      };
    },
  },

  get_member: {
    description: "Get details of a specific member in a server",
    inputSchema: {
      type: "object" as const,
      properties: {
        server_id: {
          type: "string",
          description: "The ID of the server",
        },
        user_id: {
          type: "string",
          description: "The ID of the user to get details for",
        },
      },
      required: ["server_id", "user_id"],
    },
    handler: async (args: { server_id: string; user_id: string }) => {
      const client = await connectClient();
      const guild = await client.guilds.fetch(args.server_id);
      const member = await guild.members.fetch(args.user_id);

      return {
        id: member.id,
        username: member.user.username,
        discriminator: member.user.discriminator,
        nickname: member.nickname,
        display_name: member.displayName,
        avatar_url: member.user.avatarURL(),
        banner_url: member.user.bannerURL(),
        bot: member.user.bot,
        joined_at: member.joinedAt?.toISOString(),
        premium_since: member.premiumSince?.toISOString(),
        pending: member.pending,
        communicationDisabledUntil:
          member.communicationDisabledUntil?.toISOString(),
        roles: member.roles.cache.map((r) => ({
          id: r.id,
          name: r.name,
          color: r.hexColor,
          position: r.position,
        })),
        permissions: member.permissions.toArray(),
      };
    },
  },

  search_members: {
    description: "Search for members by username or nickname",
    inputSchema: {
      type: "object" as const,
      properties: {
        server_id: {
          type: "string",
          description: "The ID of the server to search in",
        },
        query: {
          type: "string",
          description: "Search query (username or nickname)",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default 10, max 100)",
        },
      },
      required: ["server_id", "query"],
    },
    handler: async (args: {
      server_id: string;
      query: string;
      limit?: number;
    }) => {
      const client = await connectClient();
      const guild = await client.guilds.fetch(args.server_id);

      const members = await guild.members.search({
        query: args.query,
        limit: Math.min(args.limit || 10, 100),
      });

      return {
        server_id: args.server_id,
        query: args.query,
        count: members.size,
        members: members.map((member) => ({
          id: member.id,
          username: member.user.username,
          discriminator: member.user.discriminator,
          nickname: member.nickname,
          display_name: member.displayName,
          bot: member.user.bot,
          avatar_url: member.user.avatarURL(),
        })),
      };
    },
  },

  get_member_roles: {
    description: "Get all roles for a specific member",
    inputSchema: {
      type: "object" as const,
      properties: {
        server_id: {
          type: "string",
          description: "The ID of the server",
        },
        user_id: {
          type: "string",
          description: "The ID of the user",
        },
      },
      required: ["server_id", "user_id"],
    },
    handler: async (args: { server_id: string; user_id: string }) => {
      const client = await connectClient();
      const guild = await client.guilds.fetch(args.server_id);
      const member = await guild.members.fetch(args.user_id);

      const roles = member.roles.cache
        .filter((r) => r.name !== "@everyone")
        .sort((a, b) => b.position - a.position);

      return {
        server_id: args.server_id,
        user_id: args.user_id,
        username: member.user.username,
        role_count: roles.size,
        roles: roles.map((role) => ({
          id: role.id,
          name: role.name,
          color: role.hexColor,
          position: role.position,
          hoist: role.hoist,
          mentionable: role.mentionable,
          permissions: role.permissions.toArray(),
        })),
      };
    },
  },
};
