import { connectClient } from "../discord-client.js";
import { ChannelType } from "discord.js";

export const serverTools = {
  get_server_info: {
    description: "Get detailed information about a Discord server",
    inputSchema: {
      type: "object" as const,
      properties: {
        server_id: {
          type: "string",
          description: "The ID of the server to get information for",
        },
      },
      required: ["server_id"],
    },
    handler: async (args: { server_id: string }) => {
      const client = await connectClient();
      const guild = await client.guilds.fetch(args.server_id);

      const owner = await guild.fetchOwner();

      return {
        id: guild.id,
        name: guild.name,
        description: guild.description,
        icon_url: guild.iconURL(),
        banner_url: guild.bannerURL(),
        owner: {
          id: owner.id,
          username: owner.user.username,
          discriminator: owner.user.discriminator,
        },
        member_count: guild.memberCount,
        premium_tier: guild.premiumTier,
        premium_subscription_count: guild.premiumSubscriptionCount,
        verification_level: guild.verificationLevel,
        explicit_content_filter: guild.explicitContentFilter,
        features: guild.features,
        created_at: guild.createdAt.toISOString(),
        preferred_locale: guild.preferredLocale,
        vanity_url_code: guild.vanityURLCode,
      };
    },
  },

  list_servers: {
    description: "List all servers the bot is in",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
    handler: async () => {
      const client = await connectClient();
      const guilds = client.guilds.cache;

      return {
        count: guilds.size,
        servers: guilds.map((guild) => ({
          id: guild.id,
          name: guild.name,
          member_count: guild.memberCount,
          icon_url: guild.iconURL(),
          owner_id: guild.ownerId,
        })),
      };
    },
  },

  get_server_stats: {
    description: "Get statistics for a Discord server",
    inputSchema: {
      type: "object" as const,
      properties: {
        server_id: {
          type: "string",
          description: "The ID of the server to get statistics for",
        },
      },
      required: ["server_id"],
    },
    handler: async (args: { server_id: string }) => {
      const client = await connectClient();
      const guild = await client.guilds.fetch(args.server_id);

      const channels = await guild.channels.fetch();
      const roles = await guild.roles.fetch();
      const emojis = guild.emojis.cache;

      const textChannels = channels.filter(
        (c) => c?.type === ChannelType.GuildText
      ).size;
      const voiceChannels = channels.filter(
        (c) => c?.type === ChannelType.GuildVoice
      ).size;
      const categories = channels.filter(
        (c) => c?.type === ChannelType.GuildCategory
      ).size;

      let members;
      try {
        members = await guild.members.fetch();
      } catch {
        members = guild.members.cache;
      }

      const bots = members.filter((m) => m.user.bot).size;
      const humans = members.size - bots;

      return {
        server_id: args.server_id,
        server_name: guild.name,
        statistics: {
          members: {
            total: guild.memberCount,
            humans: humans,
            bots: bots,
          },
          channels: {
            total: channels.size,
            text: textChannels,
            voice: voiceChannels,
            categories: categories,
          },
          roles: roles.size,
          emojis: {
            total: emojis.size,
            static: emojis.filter((e) => !e.animated).size,
            animated: emojis.filter((e) => e.animated === true).size,
          },
          boosts: {
            level: guild.premiumTier,
            count: guild.premiumSubscriptionCount || 0,
          },
        },
      };
    },
  },
};
