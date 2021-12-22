import { Guild, GuildMember, Interaction } from "discord.js";
import { DiscordClient, MongoResult, ServerDataDTO } from "../../@types/bot";
import BotConstants from "../utils/constants";

const interactionCreateEvent = {
  name: "interactionCreate",
  async execute(interaction: Interaction) {
    if (!interaction.isCommand()) return;
    const client = interaction.client as DiscordClient;
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    const member = interaction.member as GuildMember;
    const guild: Guild | null = interaction.guild;

    if (!guild) return;

    //TODO: Might be able to remove this
    if (interaction.channel && interaction.channel.type !== "GUILD_TEXT") {
      return;
    }

    if (!member.permissions.has("ADMINISTRATOR")) {
      await interaction.reply({
        content: "You do not have permission to run this command.",
        ephemeral: true,
      });
      return;
    }

    let data: ServerDataDTO | undefined = client.serverCache.get(guild.id);
    if (!data) {
      const dbData: MongoResult | null = await client.db.find(guild.id);
      if (!dbData) {
        console.log(`[${guild.id}] - No data found in DB`);
        data = {};
      } else {
        data = dbData;
      }
      if (!data.minutesToCheck || !data.schedule) {
        data.minutesToCheck = BotConstants.DEFAULT_MINUTES_TO_CHECK;
        data.schedule = BotConstants.DEFAULT_SCHEDULE;
        await client.db.save(guild.id, {
          minutesToCheck: data.minutesToCheck,
          schedule: data.schedule,
        });
      }
      client.serverCache.set(guild.id, data);
    }

    if (!data.activated && interaction.commandName !== "activate") {
      await interaction.reply({
        content:
          "The bot is not currently activated on this server. Use the `/activate` command to activate it. To get an access key you need to join the FreshMints Discord.",
        ephemeral: true,
      });
      return;
    }

    if (
      !data.alertChannelId &&
      interaction.commandName !== "help" &&
      interaction.commandName !== "alert-channel"
    ) {
      await interaction.reply({
        content:
          "You need to set a channel for the alerts by using the `/alert-channel` command.\nYou can also set a channel for other info (logs) using the `/info-channel` command.",
        ephemeral: true,
      });
      return;
    }

    try {
      await command.execute(client, interaction);
    } catch (error) {
      console.error(`[${guild.id}]`, error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  },
};
export default interactionCreateEvent;
