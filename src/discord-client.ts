import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
} from "discord.js";

let client: Client | null = null;
let connectionPromise: Promise<Client> | null = null;

export function getClient(): Client {
  if (!client) {
    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
      ],
      partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    });
  }
  return client;
}

export async function connectClient(): Promise<Client> {
  const discordClient = getClient();

  if (discordClient.isReady()) {
    return discordClient;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    throw new Error("DISCORD_BOT_TOKEN environment variable is required");
  }

  connectionPromise = new Promise((resolve, reject) => {
    discordClient.once(Events.ClientReady, () => {
      console.error(`Discord bot logged in as ${discordClient.user?.tag}`);
      resolve(discordClient);
    });

    discordClient.once(Events.Error, (error) => {
      reject(error);
    });

    discordClient.login(token).catch(reject);
  });

  return connectionPromise;
}

export async function disconnectClient(): Promise<void> {
  if (client) {
    await client.destroy();
    client = null;
    connectionPromise = null;
  }
}
