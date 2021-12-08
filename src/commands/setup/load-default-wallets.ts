import { SlashCommandBuilder } from "@discordjs/builders";
import Collection from "@discordjs/collection";
import { Command } from "../../../@types/bot";
import DEFAULT_WALLETS from "../../utils/default_wallets";

const loadDefaultWalletsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("load-default-wallets")
    .setDescription("Load the default list of popular wallets."),
  async execute(client, interaction) {
    if (!interaction.guild) return;
    const cacheItem = client.serverCache.get(interaction.guild.id);
    if (!cacheItem) return;
    if (!cacheItem.addressMap) {
      cacheItem.addressMap = new Collection<string, string>();
    }
    for (const item of DEFAULT_WALLETS) {
      if (!cacheItem.addressMap.get(item.address)) {
        cacheItem.addressMap.set(item.address, item.name);
      }
    }
    await client.db.save(interaction.guild.id, {
      addressMap: cacheItem.addressMap,
    });
    await interaction.reply("Loaded default wallet list.");
  },
};
export default loadDefaultWalletsCommand;
