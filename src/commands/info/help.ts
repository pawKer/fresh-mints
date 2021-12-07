import { SlashCommandBuilder } from "@discordjs/builders";
import { Command } from "../../../@types/bot";
import { getHelpEmbed } from "../../embeds/embeds";

const helpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Get a list of all the bot's commands."),
  async execute(client, interaction) {
    await interaction.reply({ embeds: [getHelpEmbed()] });
  },
};
export default helpCommand;
