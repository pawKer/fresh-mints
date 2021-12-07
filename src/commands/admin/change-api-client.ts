import { SlashCommandBuilder } from "@discordjs/builders";
import { GuildMember } from "discord.js";
import { Command } from "../../../@types/bot";
import BotConstants from "../../utils/constants";
import CovalentClient from "../../api-clients/covalent-client";
import EtherscanClient from "../../api-clients/etherscan-client";

const changeApiClientCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("change-api-client")
    .setDescription("Change API client."),
  async execute(client, interaction) {
    const member = interaction.member as GuildMember;
    if (member.id !== BotConstants.OWNER_ID) {
      await interaction.reply(
        `This command is only available for the bot owner.`
      );
      return;
    }

    if (client.useEtherscan) {
      client.apiClient = new CovalentClient();
      client.useEtherscan = false;
    } else {
      client.apiClient = new EtherscanClient();
      client.useEtherscan = true;
    }
    await interaction.reply(`Changed API client to ${client.apiClient.NAME}`);
  },
};
export default changeApiClientCommand;
