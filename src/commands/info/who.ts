import { SlashCommandBuilder } from "@discordjs/builders";
import { Guild, MessageEmbed } from "discord.js";
import { Command, ServerData } from "../../../@types/bot";
import { getFollowingInfoEmbed } from "../../embeds/embeds";
import BotConstants from "../../utils/constants";
const getFollowingListAsMessage = (data: ServerData): MessageEmbed => {
  const cacheResult: ServerData | undefined = data;
  const addressMap = cacheResult?.addressMap;
  const contractMap = cacheResult?.contractMap;
  const exampleEmbed = getFollowingInfoEmbed(
    addressMap ? addressMap.size : 0,
    contractMap ? contractMap.size : 0
  );

  if (addressMap && addressMap.size > 0) {
    exampleEmbed.addField(`Wallets 💸`, `\u200B`);
    let index = 1;
    addressMap.forEach((value, key) => {
      exampleEmbed.addField(
        `${index}. ${value.name}`,
        `[${key}](${BotConstants.ETHERSCAN_ADDRESS_URL}/${key})`
      );
      index++;
    });
  }
  if (contractMap && contractMap.size > 0) {
    let index = 1;
    exampleEmbed.addField(`Contracts 📜`, `\u200B`);
    contractMap.forEach((value, key) => {
      exampleEmbed.addField(
        `${index}. ${value.name}`,
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
  async execute(client, interaction) {
    if (!interaction.guild) return;

    const guild: Guild = interaction.guild;
    const cacheItem = client.serverCache.get(guild.id);
    if (!cacheItem) return;

    await interaction.reply({
      embeds: [getFollowingListAsMessage(cacheItem)],
    });
  },
};

export default whoCommand;
