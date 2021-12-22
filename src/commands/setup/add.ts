import { SlashCommandBuilder } from "@discordjs/builders";
import { Guild } from "discord.js";
import { Command } from "../../../@types/bot";
import ethereum_address from "ethereum-address";
import BotConstants from "../../utils/constants";

const addCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("add")
    .setDescription("Add a new ethereum address to the following list.")
    .addStringOption((option) =>
      option
        .setRequired(true)
        .setName("eth-wallet-address")
        .setDescription("An wallet address to track.")
    )
    .addStringOption((option) =>
      option
        .setRequired(true)
        .setName("nickname")
        .setDescription("A nickname for the address.")
    ),
  async execute(client, interaction) {
    if (!interaction.guild) return;
    const guild: Guild = interaction.guild;
    const eth_address = interaction.options.getString("eth-wallet-address");
    const nickname = interaction.options.getString("nickname");

    const cacheItem = client.serverCache.get(guild.id);
    if (!cacheItem || !eth_address || !nickname) return;

    if (ethereum_address.isAddress(eth_address)) {
      if (!cacheItem.addressMap) {
        cacheItem.addressMap = new Map();
      }
      if (cacheItem.addressMap.size === BotConstants.ADDRESS_FOLLOW_LIMIT) {
        await interaction.reply(
          `You are already following ${BotConstants.ADDRESS_FOLLOW_LIMIT} addresses, please remove some before adding more.`
        );
        return;
      }
      cacheItem.addressMap.set(eth_address, { name: nickname });
      await client.db.save(guild.id, { addressMap: cacheItem.addressMap });
      await interaction.reply("New address saved.");
    } else {
      await interaction.reply({
        content: "Provided ETH address is not valid.",
        ephemeral: true,
      });
    }
  },
};
export default addCommand;
