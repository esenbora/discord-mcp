import { connectClient } from "../discord-client.js";
import { ChannelType, PermissionFlagsBits } from "discord.js";
import type { Guild, TextChannel, GuildChannel } from "discord.js";

export const channelTools = {
  list_channels: {
    description: "List all channels in a Discord server",
    inputSchema: {
      type: "object" as const,
      properties: {
        server_id: {
          type: "string",
          description: "The ID of the server to list channels from",
        },
        type: {
          type: "string",
          description: "Filter by channel type: text, voice, category, forum, stage",
          enum: ["text", "voice", "category", "forum", "stage"],
        },
      },
      required: ["server_id"],
    },
    handler: async (args: { server_id: string; type?: string }) => {
      const client = await connectClient();
      const guild = await client.guilds.fetch(args.server_id);

      const channels = await guild.channels.fetch();

      const typeMap: Record<string, ChannelType[]> = {
        text: [ChannelType.GuildText],
        voice: [ChannelType.GuildVoice],
        category: [ChannelType.GuildCategory],
        forum: [ChannelType.GuildForum],
        stage: [ChannelType.GuildStageVoice],
      };

      const filteredChannels = args.type
        ? channels.filter((c) => c && typeMap[args.type!]?.includes(c.type))
        : channels;

      return {
        server_id: args.server_id,
        count: filteredChannels.size,
        channels: filteredChannels
          .filter((c) => c !== null)
          .map((channel) => ({
            id: channel!.id,
            name: channel!.name,
            type: ChannelType[channel!.type],
            position: channel!.position,
            parent_id: channel!.parentId,
          })),
      };
    },
  },

  get_channel: {
    description: "Get details of a specific channel",
    inputSchema: {
      type: "object" as const,
      properties: {
        channel_id: {
          type: "string",
          description: "The ID of the channel to get details for",
        },
      },
      required: ["channel_id"],
    },
    handler: async (args: { channel_id: string }) => {
      const client = await connectClient();
      const channel = await client.channels.fetch(args.channel_id);

      if (!channel) {
        throw new Error("Channel not found");
      }

      const baseInfo = {
        id: channel.id,
        type: ChannelType[channel.type],
      };

      if ("name" in channel) {
        const guildChannel = channel as GuildChannel;
        return {
          ...baseInfo,
          name: guildChannel.name,
          position: guildChannel.position,
          parent_id: guildChannel.parentId,
          guild_id: guildChannel.guildId,
          ...("topic" in channel && { topic: (channel as TextChannel).topic }),
          ...("nsfw" in channel && { nsfw: (channel as TextChannel).nsfw }),
          ...("rateLimitPerUser" in channel && {
            slowmode: (channel as TextChannel).rateLimitPerUser,
          }),
        };
      }

      return baseInfo;
    },
  },

  create_channel: {
    description: "Create a new channel in a server",
    inputSchema: {
      type: "object" as const,
      properties: {
        server_id: {
          type: "string",
          description: "The ID of the server to create the channel in",
        },
        name: {
          type: "string",
          description: "The name of the new channel",
        },
        type: {
          type: "string",
          description: "The type of channel: text, voice, category, forum, stage",
          enum: ["text", "voice", "category", "forum", "stage"],
        },
        topic: {
          type: "string",
          description: "The channel topic (for text channels)",
        },
        parent_id: {
          type: "string",
          description: "The ID of the parent category",
        },
        nsfw: {
          type: "boolean",
          description: "Whether the channel is NSFW",
        },
      },
      required: ["server_id", "name"],
    },
    handler: async (args: {
      server_id: string;
      name: string;
      type?: string;
      topic?: string;
      parent_id?: string;
      nsfw?: boolean;
    }) => {
      const client = await connectClient();
      const guild = await client.guilds.fetch(args.server_id);

      const typeMap = {
        text: ChannelType.GuildText,
        voice: ChannelType.GuildVoice,
        category: ChannelType.GuildCategory,
        forum: ChannelType.GuildForum,
        stage: ChannelType.GuildStageVoice,
      } as const;

      type GuildChannelType = (typeof typeMap)[keyof typeof typeMap];
      const channelType: GuildChannelType =
        typeMap[args.type as keyof typeof typeMap] || ChannelType.GuildText;

      const channel = await guild.channels.create({
        name: args.name,
        type: channelType,
        topic: args.topic,
        parent: args.parent_id,
        nsfw: args.nsfw,
      });

      return {
        success: true,
        channel: {
          id: channel.id,
          name: channel.name,
          type: ChannelType[channel.type],
          position: channel.position,
          parent_id: channel.parentId,
        },
      };
    },
  },

  delete_channel: {
    description: "Delete a channel",
    inputSchema: {
      type: "object" as const,
      properties: {
        channel_id: {
          type: "string",
          description: "The ID of the channel to delete",
        },
      },
      required: ["channel_id"],
    },
    handler: async (args: { channel_id: string }) => {
      const client = await connectClient();
      const channel = await client.channels.fetch(args.channel_id);

      if (!channel) {
        throw new Error("Channel not found");
      }

      if (!("delete" in channel)) {
        throw new Error("Cannot delete this type of channel");
      }

      const name = "name" in channel ? channel.name : "unknown";
      await channel.delete();

      return {
        success: true,
        deleted_channel_id: args.channel_id,
        deleted_channel_name: name,
      };
    },
  },

  update_channel: {
    description: "Update channel settings",
    inputSchema: {
      type: "object" as const,
      properties: {
        channel_id: {
          type: "string",
          description: "The ID of the channel to update",
        },
        name: {
          type: "string",
          description: "New channel name",
        },
        topic: {
          type: "string",
          description: "New channel topic",
        },
        nsfw: {
          type: "boolean",
          description: "Whether the channel is NSFW",
        },
        slowmode: {
          type: "number",
          description: "Slowmode delay in seconds (0-21600)",
        },
        parent_id: {
          type: "string",
          description: "New parent category ID",
        },
      },
      required: ["channel_id"],
    },
    handler: async (args: {
      channel_id: string;
      name?: string;
      topic?: string;
      nsfw?: boolean;
      slowmode?: number;
      parent_id?: string;
    }) => {
      const client = await connectClient();
      const channel = await client.channels.fetch(args.channel_id);

      if (!channel || !("edit" in channel)) {
        throw new Error("Channel not found or cannot be edited");
      }

      const guildChannel = channel as GuildChannel;
      const updateData: Record<string, unknown> = {};

      if (args.name !== undefined) updateData.name = args.name;
      if (args.topic !== undefined) updateData.topic = args.topic;
      if (args.nsfw !== undefined) updateData.nsfw = args.nsfw;
      if (args.slowmode !== undefined) updateData.rateLimitPerUser = args.slowmode;
      if (args.parent_id !== undefined) updateData.parent = args.parent_id;

      await guildChannel.edit(updateData);

      return {
        success: true,
        channel: {
          id: guildChannel.id,
          name: guildChannel.name,
          type: ChannelType[guildChannel.type],
        },
      };
    },
  },
};
