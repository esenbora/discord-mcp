import { connectClient } from "../discord-client.js";

export const roleTools = {
  list_roles: {
    description: "List all roles in a Discord server",
    inputSchema: {
      type: "object" as const,
      properties: {
        server_id: {
          type: "string",
          description: "The ID of the server to list roles from",
        },
      },
      required: ["server_id"],
    },
    handler: async (args: { server_id: string }) => {
      const client = await connectClient();
      const guild = await client.guilds.fetch(args.server_id);
      const roles = await guild.roles.fetch();

      const sortedRoles = roles.sort((a, b) => b.position - a.position);

      return {
        server_id: args.server_id,
        count: roles.size,
        roles: sortedRoles.map((role) => ({
          id: role.id,
          name: role.name,
          color: role.hexColor,
          position: role.position,
          hoist: role.hoist,
          mentionable: role.mentionable,
          managed: role.managed,
          member_count: role.members.size,
          permissions: role.permissions.toArray(),
        })),
      };
    },
  },

  add_role: {
    description: "Add a role to a member",
    inputSchema: {
      type: "object" as const,
      properties: {
        server_id: {
          type: "string",
          description: "The ID of the server",
        },
        user_id: {
          type: "string",
          description: "The ID of the user to add the role to",
        },
        role_id: {
          type: "string",
          description: "The ID of the role to add",
        },
        reason: {
          type: "string",
          description: "Reason for adding the role (for audit log)",
        },
      },
      required: ["server_id", "user_id", "role_id"],
    },
    handler: async (args: {
      server_id: string;
      user_id: string;
      role_id: string;
      reason?: string;
    }) => {
      const client = await connectClient();
      const guild = await client.guilds.fetch(args.server_id);
      const member = await guild.members.fetch(args.user_id);
      const role = await guild.roles.fetch(args.role_id);

      if (!role) {
        throw new Error("Role not found");
      }

      await member.roles.add(role, args.reason);

      return {
        success: true,
        user_id: args.user_id,
        username: member.user.username,
        role_id: args.role_id,
        role_name: role.name,
        action: "added",
      };
    },
  },

  remove_role: {
    description: "Remove a role from a member",
    inputSchema: {
      type: "object" as const,
      properties: {
        server_id: {
          type: "string",
          description: "The ID of the server",
        },
        user_id: {
          type: "string",
          description: "The ID of the user to remove the role from",
        },
        role_id: {
          type: "string",
          description: "The ID of the role to remove",
        },
        reason: {
          type: "string",
          description: "Reason for removing the role (for audit log)",
        },
      },
      required: ["server_id", "user_id", "role_id"],
    },
    handler: async (args: {
      server_id: string;
      user_id: string;
      role_id: string;
      reason?: string;
    }) => {
      const client = await connectClient();
      const guild = await client.guilds.fetch(args.server_id);
      const member = await guild.members.fetch(args.user_id);
      const role = await guild.roles.fetch(args.role_id);

      if (!role) {
        throw new Error("Role not found");
      }

      await member.roles.remove(role, args.reason);

      return {
        success: true,
        user_id: args.user_id,
        username: member.user.username,
        role_id: args.role_id,
        role_name: role.name,
        action: "removed",
      };
    },
  },

  create_role: {
    description: "Create a new role in a server",
    inputSchema: {
      type: "object" as const,
      properties: {
        server_id: {
          type: "string",
          description: "The ID of the server to create the role in",
        },
        name: {
          type: "string",
          description: "The name of the new role",
        },
        color: {
          type: "string",
          description: "The color of the role in hex format (e.g., #FF0000)",
        },
        hoist: {
          type: "boolean",
          description: "Whether the role should be displayed separately in the member list",
        },
        mentionable: {
          type: "boolean",
          description: "Whether the role can be mentioned",
        },
        reason: {
          type: "string",
          description: "Reason for creating the role (for audit log)",
        },
      },
      required: ["server_id", "name"],
    },
    handler: async (args: {
      server_id: string;
      name: string;
      color?: string;
      hoist?: boolean;
      mentionable?: boolean;
      reason?: string;
    }) => {
      const client = await connectClient();
      const guild = await client.guilds.fetch(args.server_id);

      const role = await guild.roles.create({
        name: args.name,
        color: args.color as `#${string}` | undefined,
        hoist: args.hoist,
        mentionable: args.mentionable,
        reason: args.reason,
      });

      return {
        success: true,
        role: {
          id: role.id,
          name: role.name,
          color: role.hexColor,
          position: role.position,
          hoist: role.hoist,
          mentionable: role.mentionable,
        },
      };
    },
  },
};
