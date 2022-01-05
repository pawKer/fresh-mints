import { SlashCommandBuilder } from "@discordjs/builders";
import { Guild } from "discord.js";
import { Command } from "../../../@types/bot";

const removeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove an address from the following list.")
    .addStringOption((option) =>
      option
        .setRequired(true)
        .setName("eth-address")
        .setDescription("The wallet address to remove.")
    ),
  async execute(client, interaction) {
    if (!interaction.guild) return;
    const guild: Guild = interaction.guild;
    const eth_address = interaction.options.getString("eth-address");

    const cacheItem = client.serverCache.get(guild.id);

    if (
      !cacheItem ||
      !cacheItem.addressMap ||
      cacheItem.addressMap.size === 0
    ) {
      await interaction.reply({
        content:
          "You are currently not following any ETH addresses. Use the `/add` command to add some.",
        ephemeral: true,
      });
      return;
    }
    if (eth_address && cacheItem.addressMap.get(eth_address)) {
      cacheItem.addressMap.delete(eth_address);
      await client.db.save(guild.id, { addressMap: cacheItem.addressMap });
      await interaction.reply("Address removed from watchlist.");
    } else {
      await interaction.reply({
        content: "Address provided was not found in watchlist.",
        ephemeral: true,
      });
    }
  },
};
export default removeCommand;
