import { SlashCommandBuilder } from "@discordjs/builders";
import { Guild } from "discord.js";
import { Command } from "../../../@types/bot";

const trackOpenseaBuys: Command = {
  data: new SlashCommandBuilder()
    .setName("track-opensea-buys")
    .setDescription("Toggle the tracking of NFTs bought on OpenSea."),
  async execute(client, interaction) {
    if (!interaction.guild) return;
    const guild: Guild = interaction.guild;
    const cacheItem = client.serverCache.get(guild.id);
    if (!cacheItem) return;

    if (cacheItem.trackOpenseaBuys) {
      cacheItem.trackOpenseaBuys = false;
      await client.db.save(guild.id, { trackOpenseaBuys: false });
      await interaction.reply("Tracking NFT buys on OpenSea is now OFF.");
    } else {
      cacheItem.trackOpenseaBuys = true;
      await client.db.save(guild.id, { trackOpenseaBuys: true });
      await interaction.reply("Tracking NFT buys on OpenSea is now ON.");
    }
  },
};
export default trackOpenseaBuys;
