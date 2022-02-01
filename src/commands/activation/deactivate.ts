import { SlashCommandBuilder } from "@discordjs/builders";
import { Guild } from "discord.js";
import { Command } from "../../../@types/bot";

const activateCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("deactivate")
    .setDescription("Deactivate the bot on this server."),
  async execute(client, interaction) {
    if (!interaction.guild) return;
    const guild: Guild = interaction.guild;
    const cacheItem = client.serverCache.get(guild.id);

    if (!cacheItem) return;

    if (!cacheItem.activated) {
      await interaction.reply({
        content: "This server has already been deactivated.",
        ephemeral: true,
      });
      return;
    }

    try {
      cacheItem.activated = false;
      client.db.save(guild.id, { activated: false });
      client.activationKeysDb.saveAndUpdateByServerId(guild.id, {
        used: false,
      });
    } catch (e) {
      await interaction.reply({
        content: "There was a problem deactivating the server.",
        ephemeral: true,
      });
      console.log(`[${guild.id}] Failed to save server deactivated state.`);
      return;
    }

    await interaction.reply({
      content: "This server has now been deactivated 😢! 🔴",
      ephemeral: true,
    }); 
  },
};
export default activateCommand;
