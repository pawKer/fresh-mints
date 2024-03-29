import { SlashCommandBuilder } from "@discordjs/builders";
import cronstrue from "cronstrue";
import { Command } from "../../../@types/bot";
import { getInfoEmbed } from "../../embeds/embeds";
import BotConstants from "../../utils/constants";

const serverInfoCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Get the current server settings."),
  async execute(client, interaction) {
    if (!interaction.guild) return;
    const cacheItem = client.serverCache.get(interaction.guild.id);
    if (!cacheItem) return;
    await interaction.reply({
      embeds: [
        getInfoEmbed(
          cacheItem.alertChannelId,
          cacheItem.infoChannelId,
          cronstrue.toString(
            cacheItem.schedule || BotConstants.DEFAULT_SCHEDULE
          ),
          cacheItem.alertRole,
          cacheItem.areScheduledMessagesOn,
          cacheItem.trackOpenseaBuys
        ),
      ],
    });
  },
};
export default serverInfoCommand;
