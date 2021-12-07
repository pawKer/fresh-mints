import { SlashCommandBuilder } from "@discordjs/builders";
import { ChannelType } from "discord-api-types";
import { Guild } from "discord.js";
import { Command } from "../../../@types/bot";

const alertCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("alert-channel")
    .setDescription("Set a channel for alerts.")
    .addChannelOption((option) =>
      option
        .setRequired(true)
        .addChannelType(ChannelType.GuildText)
        .setName("channel")
        .setDescription("A channel where the alerts from the bot will be sent")
    ),
  async execute(client, interaction) {
    if (!interaction.guild) return;
    const guild: Guild = interaction.guild;
    const cacheItem = client.serverCache.get(guild.id);

    if (!cacheItem) return;

    cacheItem.alertChannelId = interaction.options.getChannel("channel")?.id;
    client.db.save(guild.id, {
      alertChannelId: cacheItem.alertChannelId,
    });
    await interaction.reply(
      `Alert channel set to <#${cacheItem.alertChannelId}>.`
    );
  },
};
export default alertCommand;
