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
  async execute(client: any, interaction: any) {
    const guild: Guild = interaction.guild;
    const member = interaction.interaction.member as GuildMember;
    const minutes = interaction.options.getInteger("minutes");
    if (member.id !== BotConstants.OWNER_ID) {
      await interaction.reply(
        `This command is only available for the bot owner.`
      );
      return;
    }

    const cacheItem = client.serverCache.get(guild.id);

    if (minutes < 1) {
      await interaction.reply("Second argument must >= 1.");
      return;
    }

    cacheItem.minutesToCheck = minutes;
    client.db.save(guild.id, {
      minutesToCheck: cacheItem.minutesToCheck,
    });
    await interaction.reply(`Set minutes to ${cacheItem.minutesToCheck}.`);
  },
};
export default setMinutesCommand;
