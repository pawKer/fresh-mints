import { SlashCommandBuilder } from "@discordjs/builders";
import { Guild } from "discord.js";
import { Command } from "../../../@types/bot";
import ethereum_address from "ethereum-address";

const addContractCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("add-contract")
    .setDescription(
      "Add a new ethereum address to the contract following list."
    )
    .addStringOption((option) =>
      option
        .setRequired(true)
        .setName("eth-contract-address")
        .setDescription("An contract address to track.")
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
    const eth_address = interaction.options.getString("eth-contract-address");
    const nickname = interaction.options.getString("nickname");

    const cacheItem = client.serverCache.get(guild.id);
    if (!cacheItem || !eth_address || !nickname) return;

    if (ethereum_address.isAddress(eth_address)) {
      if (!cacheItem.contractMap) {
        cacheItem.contractMap = new Map();
      }
      cacheItem.contractMap.set(eth_address, {name: nickname});
      await client.db.save(guild.id, { contractMap: cacheItem.contractMap });
      await interaction.reply("New address saved.");
    } else {
      await interaction.reply({
        content: "Provided ETH address is not valid.",
        ephemeral: true,
      });
    }
  },
};
export default addContractCommand;
