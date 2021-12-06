import { SlashCommandBuilder } from "@discordjs/builders";
import { Guild } from "discord.js";
import { Command } from "../../../@types/bot";

const clearAlertRoleCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("clear-alert-role")
    .setDescription("Clear the channel for alerts."),
  async execute(client: any, interaction: any) {
    const guild: Guild = interaction.guild;
    const cacheItem = client.serverCache.get(guild.id);
    cacheItem.alertRole = null;
    client.db.save(guild.id, {
      alertRole: cacheItem.alertRole,
    });
    await interaction.reply(`Alert role has been reset.`);
  },
};
export default clearAlertRoleCommand;
