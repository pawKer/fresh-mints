import { DiscordEvent } from "../../@types/bot";
import BotConstants from "../utils/constants";

const guildCreateEvent: DiscordEvent = {
  name: "guildCreate",
  async execute(guild: any) {
    console.log(`Joined a new guild: ${guild.name} - ${guild.id}`);
    guild.client.save(guild.id, {
      minutesToCheck: BotConstants.DEFAULT_MINUTES_TO_CHECK,
      schedule: BotConstants.DEFAULT_SCHEDULE,
    });
  },
};
export default guildCreateEvent;
