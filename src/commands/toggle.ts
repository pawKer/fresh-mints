import { SlashCommandBuilder } from "@discordjs/builders";
import { Guild } from "discord.js";
import { Command } from "../../@types/bot";
import BotConstants from "../utils/constants";
import cron from "cron";
import { getMintedForFollowingAddresses } from "../logic";

const toggleCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("toggle")
    .setDescription("Toggle the scheduled messages."),
  async execute(client, interaction) {
    if (!interaction.guild) return;
    const guild: Guild = interaction.guild;
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
    if (cacheItem.areScheduledMessagesOn) {
      cacheItem.areScheduledMessagesOn = false;
      client.db.save(guild.id, { areScheduledMessagesOn: false });
      if (cacheItem.scheduledMessage) cacheItem.scheduledMessage.stop();
      await interaction.reply("Turned scheduled messages off.");
      console.log(`[${guild.id}] - Turned scheduled messages off.`);
    } else {
      cacheItem.areScheduledMessagesOn = true;
      client.db.save(guild.id, { areScheduledMessagesOn: true });
      if (!cacheItem.scheduledMessage) {
        cacheItem.scheduledMessage = new cron.CronJob(
          cacheItem.schedule || BotConstants.DEFAULT_SCHEDULE,
          async () => {
            getMintedForFollowingAddresses(client, guild.id);
          }
        );
      }
      cacheItem.scheduledMessage.start();
      await interaction.reply("Turned scheduled messages on.");
      console.log(`[${guild.id}] - Turned scheduled messages on.`);
    }
  },
};
export default toggleCommand;
