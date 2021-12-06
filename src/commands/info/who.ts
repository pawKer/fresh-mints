import { SlashCommandBuilder } from "@discordjs/builders";
import { Guild, MessageEmbed } from "discord.js";
import { Command, ServerData } from "../../../@types/bot";
import { getFollowingInfoEmbed } from "../../embeds/embeds";
import BotConstants from "../../utils/constants";
const getFollowingListAsMessage = (data: ServerData): MessageEmbed => {
  let cacheResult: ServerData | undefined = data;
  const addressMap: Map<string, string> | undefined = cacheResult?.addressMap;
  const exampleEmbed = getFollowingInfoEmbed(addressMap ? addressMap.size : 0);
  let index = 1;
  if (addressMap && addressMap.size > 0) {
    addressMap.forEach((value, key) => {
      exampleEmbed.addField(
        `${index}. ${value}`,
        `[${key}](${BotConstants.ETHERSCAN_ADDRESS_URL}/${key})`
      );
      index++;
    });
  }
  return exampleEmbed;
};

const whoCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("who")
    .setDescription("Shows the addresses the bot is currently tracking."),
  async execute(client: any, interaction: any) {
    const guild: Guild = interaction.guild;
    const cacheItem = client.serverCache.get(guild.id);
    await interaction.reply({
      embeds: [getFollowingListAsMessage(cacheItem)],
    });
  },
};

export default whoCommand;
