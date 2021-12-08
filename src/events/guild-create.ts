import { Guild } from "discord.js";
import { DiscordClient, DiscordEvent } from "../../@types/bot";
import BotConstants from "../utils/constants";

const guildCreateEvent: DiscordEvent = {
  name: "guildCreate",
  async execute(guild: Guild) {
    console.log(`Joined a new guild: ${guild.name} - ${guild.id}`);
    const client = guild.client as DiscordClient;
    await client.db.save(guild.id, {
      minutesToCheck: BotConstants.DEFAULT_MINUTES_TO_CHECK,
      schedule: BotConstants.DEFAULT_SCHEDULE,
      guildName: guild.name,
    });
  },
};
export default guildCreateEvent;
