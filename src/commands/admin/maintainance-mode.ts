import { SlashCommandBuilder } from "@discordjs/builders";
import { GuildMember } from "discord.js";
import { Command } from "../../../@types/bot";
import BotConstants from "../../utils/constants";

const maintainaceModeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("maintainance-mode")
    .setDescription("Toggle maintainance mode"),
  async execute(client, interaction) {
    const member = interaction.member as GuildMember;
    if (member.id !== BotConstants.OWNER_ID) {
      await interaction.reply({
        content: `This command is only available for the bot owner.`,
        ephemeral: true,
      });
      return;
    }

    client.MAINTAINANCE_MODE = !client.MAINTAINANCE_MODE;

    await interaction.reply({
      content: `Maintainance mode set to ${
        client.MAINTAINANCE_MODE ? "ON" : "OFF"
      }`,
      ephemeral: true,
    });
  },
};
export default maintainaceModeCommand;
