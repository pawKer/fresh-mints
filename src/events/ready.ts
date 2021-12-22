import { restartAllRunningCrons } from "../logic";
import cron from "cron";
import { logApiRequests, clearCache } from "../utils/utils";
import { Command, DiscordClient } from "../../@types/bot";

const readyEvent = {
  name: "ready",
  once: true,
  async execute(client: DiscordClient) {
    console.log(`Online as ${client?.user?.tag}`);
    client?.user?.setActivity("Candy Crush");

    await restartAllRunningCrons(client);

    const logApiReqs = new cron.CronJob("0 * * * *", async () => {
      logApiRequests(client.apiClient);
    });
    logApiReqs.start();

    const clearCacheJob = new cron.CronJob("0 * * * *", async () => {
      clearCache(client);
    });
    clearCacheJob.start();

    console.log(`${client.commands.size} commands loaded: `);
    client.commands.forEach((cmd: Command) => {
      console.log(cmd.data.name);
    });
  },
};
export default readyEvent;
