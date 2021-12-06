import { Client } from "discord.js";
export interface Command {
  data: any;
  execute(client: Client, interaction: any): Promise<void>;
}
