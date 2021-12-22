import { SlashCommandBuilder } from "@discordjs/builders";
import { Guild } from "discord.js";
import { Command } from "../../../@types/bot";

const activateCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("activate")
    .setDescription("Activate the bot on the server using the activation key.")
    .addStringOption((option) =>
      option
        .setRequired(true)
        .setName("activation-key")
        .setDescription("The activation key")
    ),
  async execute(client, interaction) {
    if (!interaction.guild) return;
    const guild: Guild = interaction.guild;
    const inputKey = interaction.options.getString("activation-key");
    const cacheItem = client.serverCache.get(guild.id);

    if (!cacheItem || !inputKey) return;
    const activationKey = await client.activationKeysDb.find(inputKey);

    if (!activationKey) {
      await interaction.reply({
        content: "The provided activation key is not valid.",
        ephemeral: true,
      });
      return;
    }

    if (activationKey.used) {
      await interaction.reply({
        content: "This key has already been used.",
        ephemeral: true,
      });
      return;
    }
    const timestamp = new Date().toISOString();
    try {
      await client.activationKeysDb.saveAndUpdate(inputKey, {
        used: true,
        serverId: guild.id,
        activatedAt: timestamp,
      });
    } catch (e) {
      await interaction.reply({
        content: "There was a problem activating the server.",
        ephemeral: true,
      });
      console.log(`[${guild.id}] Failed to save activation key state.`);
      return;
    }

    try {
      await client.db.save(guild.id, {
        activated: true,
        activatedAt: timestamp,
      });
      cacheItem.activated = true;
      cacheItem.activatedAt = timestamp;
    } catch (e) {
      await interaction.reply({
        content: "There was a problem activating the server.",
        ephemeral: true,
      });
      console.log(`[${guild.id}] Failed to save server activated state.`);
      return;
    }

    await interaction.reply({
      content: "This server has now been activated! 🎉",
      ephemeral: true,
    });
  },
};
export default activateCommand;
