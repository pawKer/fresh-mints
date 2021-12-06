import { Client } from "discord.js";
export interface DiscordEvent {
  name: string;
  once?: boolean;
  execute(client: Client): Promise<void>;
}
