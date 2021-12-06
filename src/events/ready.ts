import { restartAllRunningCrons } from "../logic";
import cron from "cron";
import { logApiRequests } from "../utils/utils";
import { Command } from "../../@types/bot";

const readyEvent = {
  name: "ready",
  once: true,
  async execute(client: any) {
    console.log(`Online as ${client?.user?.tag}`);
    client?.user?.setActivity("Candy Crush");
    await restartAllRunningCrons(client);
    let logApiReqs = new cron.CronJob("0 * * * *", async () => {
      logApiRequests(client.apiClient);
    });
    logApiReqs.start();
    console.log(`${client.commands.size} commands loaded: `);
    client.commands.forEach((cmd: Command) => {
      console.log(cmd.data.name);
    });
  },
};
export default readyEvent;
