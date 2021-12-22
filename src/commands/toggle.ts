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
    if (!cacheItem) return;
    if (
      (cacheItem.addressMap && cacheItem.addressMap.size > 0) ||
      (cacheItem.contractMap && cacheItem.contractMap.size > 0)
    ) {
      let scheduledJob = client.scheduledJobs.get(guild.id);
      if (cacheItem.areScheduledMessagesOn) {
        cacheItem.areScheduledMessagesOn = false;
        await client.db.save(guild.id, { areScheduledMessagesOn: false });
        if (scheduledJob) scheduledJob.wallets.stop();
        await interaction.reply("Turned scheduled messages off.");
        console.log(`[${guild.id}] - Turned scheduled messages off.`);
      } else {
        cacheItem.areScheduledMessagesOn = true;
        await client.db.save(guild.id, { areScheduledMessagesOn: true });
        if (!scheduledJob) {
          scheduledJob = {
            wallets: new cron.CronJob(
              cacheItem.schedule || BotConstants.DEFAULT_SCHEDULE,
              async () => {
                getMintedForFollowingAddresses(client, guild.id);
              }
            ),
          };
          client.scheduledJobs.set(guild.id, scheduledJob);
        }
        scheduledJob.wallets.start();
        await interaction.reply("Turned scheduled messages on.");
        console.log(`[${guild.id}] - Turned scheduled messages on.`);
      }
    } else {
      await interaction.reply({
        content:
          "You are currently not following any ETH addresses. Use the `/add` command to add some.",
        ephemeral: true,
      });
      return;
    }
  },
};
export default toggleCommand;
