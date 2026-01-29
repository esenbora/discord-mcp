import { z } from "zod";
import { connectClient } from "../discord-client.js";
import type { TextChannel, Message } from "discord.js";

export const messagingTools = {
  send_message: {
    description: "Send a message to a Discord channel",
    inputSchema: {
      type: "object" as const,
      properties: {
        channel_id: {
          type: "string",
          description: "The ID of the channel to send the message to",
        },
        content: {
          type: "string",
          description: "The message content to send",
        },
      },
      required: ["channel_id", "content"],
    },
    handler: async (args: { channel_id: string; content: string }) => {
      const client = await connectClient();
      const channel = await client.channels.fetch(args.channel_id);

      if (!channel || !("send" in channel)) {
        throw new Error("Channel not found or is not a text channel");
      }

      const message = await (channel as TextChannel).send(args.content);

      return {
        success: true,
        message_id: message.id,
        channel_id: message.channelId,
        content: message.content,
        timestamp: message.createdAt.toISOString(),
      };
    },
  },

  get_messages: {
    description: "Get recent messages from a Discord channel",
    inputSchema: {
      type: "object" as const,
      properties: {
        channel_id: {
          type: "string",
          description: "The ID of the channel to get messages from",
        },
        limit: {
          type: "number",
          description: "Number of messages to fetch (max 100, default 50)",
        },
        before: {
          type: "string",
          description: "Get messages before this message ID",
        },
      },
      required: ["channel_id"],
    },
    handler: async (args: {
      channel_id: string;
      limit?: number;
      before?: string;
    }) => {
      const client = await connectClient();
      const channel = await client.channels.fetch(args.channel_id);

      if (!channel || !("messages" in channel)) {
        throw new Error("Channel not found or is not a text channel");
      }

      const textChannel = channel as TextChannel;
      const messages = await textChannel.messages.fetch({
        limit: Math.min(args.limit || 50, 100),
        before: args.before,
      });

      return {
        channel_id: args.channel_id,
        count: messages.size,
        messages: messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          author: {
            id: msg.author.id,
            username: msg.author.username,
            discriminator: msg.author.discriminator,
            bot: msg.author.bot,
          },
          timestamp: msg.createdAt.toISOString(),
          edited_timestamp: msg.editedAt?.toISOString() || null,
          attachments: msg.attachments.map((a) => ({
            id: a.id,
            filename: a.name,
            url: a.url,
            size: a.size,
          })),
          reactions: msg.reactions.cache.map((r) => ({
            emoji: r.emoji.name,
            count: r.count,
          })),
        })),
      };
    },
  },

  edit_message: {
    description: "Edit an existing message",
    inputSchema: {
      type: "object" as const,
      properties: {
        channel_id: {
          type: "string",
          description: "The ID of the channel containing the message",
        },
        message_id: {
          type: "string",
          description: "The ID of the message to edit",
        },
        content: {
          type: "string",
          description: "The new message content",
        },
      },
      required: ["channel_id", "message_id", "content"],
    },
    handler: async (args: {
      channel_id: string;
      message_id: string;
      content: string;
    }) => {
      const client = await connectClient();
      const channel = await client.channels.fetch(args.channel_id);

      if (!channel || !("messages" in channel)) {
        throw new Error("Channel not found or is not a text channel");
      }

      const textChannel = channel as TextChannel;
      const message = await textChannel.messages.fetch(args.message_id);

      if (message.author.id !== client.user?.id) {
        throw new Error("Can only edit messages sent by the bot");
      }

      const edited = await message.edit(args.content);

      return {
        success: true,
        message_id: edited.id,
        content: edited.content,
        edited_timestamp: edited.editedAt?.toISOString(),
      };
    },
  },

  delete_message: {
    description: "Delete a message",
    inputSchema: {
      type: "object" as const,
      properties: {
        channel_id: {
          type: "string",
          description: "The ID of the channel containing the message",
        },
        message_id: {
          type: "string",
          description: "The ID of the message to delete",
        },
      },
      required: ["channel_id", "message_id"],
    },
    handler: async (args: { channel_id: string; message_id: string }) => {
      const client = await connectClient();
      const channel = await client.channels.fetch(args.channel_id);

      if (!channel || !("messages" in channel)) {
        throw new Error("Channel not found or is not a text channel");
      }

      const textChannel = channel as TextChannel;
      const message = await textChannel.messages.fetch(args.message_id);
      await message.delete();

      return {
        success: true,
        message_id: args.message_id,
        deleted: true,
      };
    },
  },

  add_reaction: {
    description: "Add a reaction to a message",
    inputSchema: {
      type: "object" as const,
      properties: {
        channel_id: {
          type: "string",
          description: "The ID of the channel containing the message",
        },
        message_id: {
          type: "string",
          description: "The ID of the message to react to",
        },
        emoji: {
          type: "string",
          description: "The emoji to react with (unicode or custom emoji format)",
        },
      },
      required: ["channel_id", "message_id", "emoji"],
    },
    handler: async (args: {
      channel_id: string;
      message_id: string;
      emoji: string;
    }) => {
      const client = await connectClient();
      const channel = await client.channels.fetch(args.channel_id);

      if (!channel || !("messages" in channel)) {
        throw new Error("Channel not found or is not a text channel");
      }

      const textChannel = channel as TextChannel;
      const message = await textChannel.messages.fetch(args.message_id);
      await message.react(args.emoji);

      return {
        success: true,
        message_id: args.message_id,
        emoji: args.emoji,
      };
    },
  },

  reply_to_message: {
    description: "Reply to a specific message",
    inputSchema: {
      type: "object" as const,
      properties: {
        channel_id: {
          type: "string",
          description: "The ID of the channel containing the message",
        },
        message_id: {
          type: "string",
          description: "The ID of the message to reply to",
        },
        content: {
          type: "string",
          description: "The reply content",
        },
      },
      required: ["channel_id", "message_id", "content"],
    },
    handler: async (args: {
      channel_id: string;
      message_id: string;
      content: string;
    }) => {
      const client = await connectClient();
      const channel = await client.channels.fetch(args.channel_id);

      if (!channel || !("messages" in channel)) {
        throw new Error("Channel not found or is not a text channel");
      }

      const textChannel = channel as TextChannel;
      const originalMessage = await textChannel.messages.fetch(args.message_id);
      const reply = await originalMessage.reply(args.content);

      return {
        success: true,
        message_id: reply.id,
        reply_to: args.message_id,
        content: reply.content,
        timestamp: reply.createdAt.toISOString(),
      };
    },
  },
};
