import { SlashCommandBuilder } from "@discordjs/builders";
import { Guild } from "discord.js";
import { Command } from "../../../@types/bot";

const removeContractCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("remove-contract")
    .setDescription("Remove a contract address from the following list.")
    .addStringOption((option) =>
      option
        .setRequired(true)
        .setName("eth-contract-address")
        .setDescription("The contract address to remove.")
    ),
  async execute(client, interaction) {
    if (!interaction.guild) return;
    const guild: Guild = interaction.guild;
    const eth_address = interaction.options.getString("eth-contract-address");

    const cacheItem = client.serverCache.get(guild.id);

    if (
      !cacheItem ||
      !cacheItem.contractMap ||
      cacheItem.contractMap.size === 0
    ) {
      await interaction.reply({
        content:
          "You are currently not following any ETH addresses. Use the `/add-contract` command to add some.",
        ephemeral: true,
      });
      return;
    }
    if (eth_address && cacheItem.contractMap.get(eth_address)) {
      cacheItem.contractMap.delete(eth_address);
      await client.db.save(guild.id, { contractMap: cacheItem.contractMap });
      await interaction.reply("Address removed from watchlist.");
    } else {
      await interaction.reply({
        content: "Address provided was not found in watchlist.",
        ephemeral: true,
      });
    }
  },
};
export default removeContractCommand;
