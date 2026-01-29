import { connectClient } from "../discord-client.js";

export const moderationTools = {
  kick_member: {
    description: "Kick a member from the server",
    inputSchema: {
      type: "object" as const,
      properties: {
        server_id: {
          type: "string",
          description: "The ID of the server",
        },
        user_id: {
          type: "string",
          description: "The ID of the user to kick",
        },
        reason: {
          type: "string",
          description: "Reason for kicking the member (for audit log)",
        },
      },
      required: ["server_id", "user_id"],
    },
    handler: async (args: {
      server_id: string;
      user_id: string;
      reason?: string;
    }) => {
      const client = await connectClient();
      const guild = await client.guilds.fetch(args.server_id);
      const member = await guild.members.fetch(args.user_id);

      const username = member.user.username;
      await member.kick(args.reason);

      return {
        success: true,
        action: "kick",
        user_id: args.user_id,
        username: username,
        reason: args.reason || "No reason provided",
      };
    },
  },

  ban_member: {
    description: "Ban a member from the server",
    inputSchema: {
      type: "object" as const,
      properties: {
        server_id: {
          type: "string",
          description: "The ID of the server",
        },
        user_id: {
          type: "string",
          description: "The ID of the user to ban",
        },
        reason: {
          type: "string",
          description: "Reason for banning the member (for audit log)",
        },
        delete_message_seconds: {
          type: "number",
          description:
            "Number of seconds of messages to delete (0-604800, i.e., up to 7 days)",
        },
      },
      required: ["server_id", "user_id"],
    },
    handler: async (args: {
      server_id: string;
      user_id: string;
      reason?: string;
      delete_message_seconds?: number;
    }) => {
      const client = await connectClient();
      const guild = await client.guilds.fetch(args.server_id);

      let username = "Unknown";
      try {
        const member = await guild.members.fetch(args.user_id);
        username = member.user.username;
      } catch {
        const user = await client.users.fetch(args.user_id);
        username = user.username;
      }

      await guild.members.ban(args.user_id, {
        reason: args.reason,
        deleteMessageSeconds: args.delete_message_seconds,
      });

      return {
        success: true,
        action: "ban",
        user_id: args.user_id,
        username: username,
        reason: args.reason || "No reason provided",
        delete_message_seconds: args.delete_message_seconds || 0,
      };
    },
  },

  unban_member: {
    description: "Unban a user from the server",
    inputSchema: {
      type: "object" as const,
      properties: {
        server_id: {
          type: "string",
          description: "The ID of the server",
        },
        user_id: {
          type: "string",
          description: "The ID of the user to unban",
        },
        reason: {
          type: "string",
          description: "Reason for unbanning the user (for audit log)",
        },
      },
      required: ["server_id", "user_id"],
    },
    handler: async (args: {
      server_id: string;
      user_id: string;
      reason?: string;
    }) => {
      const client = await connectClient();
      const guild = await client.guilds.fetch(args.server_id);

      const user = await client.users.fetch(args.user_id);
      await guild.members.unban(args.user_id, args.reason);

      return {
        success: true,
        action: "unban",
        user_id: args.user_id,
        username: user.username,
        reason: args.reason || "No reason provided",
      };
    },
  },

  timeout_member: {
    description: "Timeout a member (temporarily mute them)",
    inputSchema: {
      type: "object" as const,
      properties: {
        server_id: {
          type: "string",
          description: "The ID of the server",
        },
        user_id: {
          type: "string",
          description: "The ID of the user to timeout",
        },
        duration_minutes: {
          type: "number",
          description:
            "Duration of timeout in minutes (max 40320 = 28 days). Set to 0 to remove timeout.",
        },
        reason: {
          type: "string",
          description: "Reason for the timeout (for audit log)",
        },
      },
      required: ["server_id", "user_id", "duration_minutes"],
    },
    handler: async (args: {
      server_id: string;
      user_id: string;
      duration_minutes: number;
      reason?: string;
    }) => {
      const client = await connectClient();
      const guild = await client.guilds.fetch(args.server_id);
      const member = await guild.members.fetch(args.user_id);

      const durationMs =
        args.duration_minutes > 0
          ? Math.min(args.duration_minutes, 40320) * 60 * 1000
          : null;

      await member.timeout(durationMs, args.reason);

      return {
        success: true,
        action: args.duration_minutes > 0 ? "timeout" : "timeout_removed",
        user_id: args.user_id,
        username: member.user.username,
        duration_minutes:
          args.duration_minutes > 0
            ? Math.min(args.duration_minutes, 40320)
            : 0,
        reason: args.reason || "No reason provided",
        timeout_until:
          durationMs !== null
            ? new Date(Date.now() + durationMs).toISOString()
            : null,
      };
    },
  },
};
