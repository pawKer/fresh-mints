import { Guild, GuildMember, Interaction } from "discord.js";
import { DiscordClient, MongoResult, ServerData } from "../../@types/bot";
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
      interaction.reply("You do not have permission to run this command.");
      return;
    }

    let data: ServerData | undefined = client.serverCache.get(guild.id);
    if (!data) {
      const dbData: MongoResult | null = await client.db.find(guild.id);
      if (!dbData) {
        // TODO: Better handling when db result is null
        data = {};
      } else {
        data = dbData;
        if (!data.minutesToCheck || !data.schedule) {
          data.minutesToCheck = BotConstants.DEFAULT_MINUTES_TO_CHECK;
          data.schedule = BotConstants.DEFAULT_SCHEDULE;
          client.db.save(guild.id, {
            minutesToCheck: data.minutesToCheck,
            schedule: data.schedule,
          });
        }
      }
      client.serverCache.set(guild.id, data);
    }

    if (!data.alertChannelId && interaction.commandName !== "help") {
      interaction.reply(
        "You need to set a channel for the alerts by using the `.alertHere` command."
      );
      interaction.reply(
        "You can also set a channel for other info using the `.infoHere` command"
      );
      return;
    }

    try {
      await command.execute(client, interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  },
};
export default interactionCreateEvent;
