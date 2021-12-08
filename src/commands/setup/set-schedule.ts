import { SlashCommandBuilder } from "@discordjs/builders";
import { Guild } from "discord.js";
import { Command } from "../../../@types/bot";
// Had to change module to commmonjs because of this import
import { default as cronTime } from "cron-time-generator";
import cronstrue from "cronstrue";
import BotConstants from "../../utils/constants";
import { getMintedForFollowingAddresses } from "../../logic";
import cron from "cron";

const setScheduleCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("set-schedule")
    .setDescription("Set the frequency of the wallet checks.")
    .addIntegerOption((option) =>
      option
        .setRequired(true)
        .setName("minutes")
        .setDescription(
          "The frequency of the checks in minutes. Must be between 1 and 60."
        )
    ),
  async execute(client, interaction) {
    if (!interaction.guild) return;
    const guild: Guild = interaction.guild;
    const minutes = interaction.options.getInteger("minutes");
    if (!minutes) return;
    if (minutes < 1 || minutes > 60) {
      await interaction.reply({
        content: "Argument needs to be between 1 and 60 minutes.",
        ephemeral: true,
      });
      return;
    }
    const cacheItem = client.serverCache.get(guild.id);
    if (!cacheItem) return;
    cacheItem.minutesToCheck = minutes + 1;
    cacheItem.schedule = cronTime.every(minutes).minutes();
    await client.db.save(guild.id, {
      minutesToCheck: cacheItem.minutesToCheck,
      schedule: cacheItem.schedule,
    });

    if (cacheItem.scheduledMessage) {
      cacheItem.scheduledMessage.stop();
    }
    cacheItem.scheduledMessage = new cron.CronJob(
      cacheItem.schedule || BotConstants.DEFAULT_SCHEDULE,
      async () => {
        getMintedForFollowingAddresses(client, guild.id);
      }
    );
    cacheItem.scheduledMessage.start();
    await interaction.reply(
      `Set schedule to \`${cronstrue.toString(cacheItem.schedule)}\`.`
    );
  },
};
export default setScheduleCommand;
