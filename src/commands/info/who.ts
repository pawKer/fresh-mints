import { SlashCommandBuilder } from "@discordjs/builders";
import { Guild, MessageEmbed } from "discord.js";
import { Command, ServerDataDTO } from "../../../@types/bot";
import { getFollowingInfoEmbed } from "../../embeds/embeds";
import BotConstants from "../../utils/constants";
const getFollowingListAsMessage = (data: ServerDataDTO): MessageEmbed => {
  const cacheResult: ServerDataDTO | undefined = data;
  const addressMap = cacheResult?.addressMap;
  const contractsCount = addressMap
    ? [...addressMap].filter((it) => it[1].isContract).length
    : 0;
  const exampleEmbed = getFollowingInfoEmbed(
    addressMap ? addressMap.size : 0,
    contractsCount
  );

  if (addressMap && addressMap.size > 0) {
    exampleEmbed.addField(`WALLETS 💸`, `\u200B`);
    let index = 1;
    addressMap.forEach((value, key) => {
      if (!value.isContract) {
        exampleEmbed.addField(
          `${index}. ${value.name}`,
          `[${key}](${BotConstants.ETHERSCAN_ADDRESS_URL}/${key})`
        );
        index++;
      }
    });
    if (contractsCount > 0) {
      index = 1;
      exampleEmbed.addField(`\u200B`, `\u200B`);
      exampleEmbed.addField(`CONTRACTS 📜`, `\u200B`);
      addressMap.forEach((value, key) => {
        if (value.isContract) {
          exampleEmbed.addField(
            `${index}. ${value.name}`,
            `[${key}](${BotConstants.ETHERSCAN_ADDRESS_URL}/${key})`
          );
          index++;
        }
      });
    }
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
