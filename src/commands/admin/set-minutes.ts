import { SlashCommandBuilder } from "@discordjs/builders";
import { Guild, GuildMember } from "discord.js";
import { Command } from "../../../@types/bot";
import BotConstants from "../../utils/constants";

const setMinutesCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("set-minutes")
    .setDescription(
      "Set how many minutes to check back every time the bot checks."
    )
    .addIntegerOption((option) =>
      option.setRequired(true).setName("minutes").setDescription("Minutes")
    ),
  async execute(client, interaction) {
    if (!interaction.guild) return;

    const guild: Guild = interaction.guild;
    const member = interaction.member as GuildMember;
    const minutes = interaction.options.getInteger("minutes");
    if (member.id !== BotConstants.OWNER_ID) {
      await interaction.reply({
        content: `This command is currently only available for the bot owner.`,
        ephemeral: true,
      });
      return;
    }

    const cacheItem = client.serverCache.get(guild.id);

    if (!minutes || !cacheItem) return;

    if (minutes < 1) {
      await interaction.reply({
        content: "Second argument must >= 1.",
        ephemeral: true,
      });
      return;
    }

    cacheItem.minutesToCheck = minutes;
    await client.db.save(guild.id, {
      minutesToCheck: cacheItem.minutesToCheck,
    });
    await interaction.reply(`Set minutes to ${cacheItem.minutesToCheck}.`);
  },
};
export default setMinutesCommand;
