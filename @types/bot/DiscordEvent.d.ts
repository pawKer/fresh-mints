import { Client } from "discord.js";
export interface DiscordEvent {
  name: string;
  once?: boolean;
  execute(...args: any[]): Promise<void>;
}
