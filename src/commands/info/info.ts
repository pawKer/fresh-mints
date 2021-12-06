import { SlashCommandBuilder } from "@discordjs/builders";
import cronstrue from "cronstrue";
import { Command } from "../../../@types/bot";
import { getInfoEmbed } from "../../embeds/embeds";
import BotConstants from "../../utils/constants";

const serverInfoCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Get the current server settings."),
  async execute(client: any, interaction: any) {
    const cacheItem = client.serverCache.get(interaction.guild.id);
    await interaction.reply({
      embeds: [
        getInfoEmbed(
          cacheItem.alertChannelId,
          cacheItem.infoChannelId,
          cronstrue.toString(
            cacheItem.schedule || BotConstants.DEFAULT_SCHEDULE
          ),
          cacheItem.alertRole
        ),
      ],
    });
  },
};
export default serverInfoCommand;
