import { SlashCommandBuilder } from "@discordjs/builders";
import { ChannelType } from "discord-api-types";
import { Guild } from "discord.js";
import { Command } from "../../../@types/bot";

const infoCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("info-channel")
    .setDescription("Set a channel for info messages (logs).")
    .addChannelOption((option) =>
      option
        .setRequired(true)
        .addChannelType(ChannelType.GuildText)
        .setName("channel")
        .setDescription(
          "A channel where the info messages (logs) from the bot will be sent"
        )
    ),
  async execute(client: any, interaction: any) {
    const guild: Guild | null = interaction.guild;
    if (!guild) return;
    const cacheItem = client.serverCache.get(guild.id);
    cacheItem.infoChannelId = interaction.channelId;
    client.db.save(guild.id, {
      infoChannelId: cacheItem.infoChannelId,
    });
    await interaction.reply(
      `Info channel set to <#${cacheItem.infoChannelId}>.`
    );
  },
};
export default infoCommand;
