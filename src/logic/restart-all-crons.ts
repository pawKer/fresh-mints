import { DiscordClient, MongoResult, ServerDataDTO } from "../../@types/bot";
import { getMintsScheduledJob } from "./scheduled-job-task";
import BotConstants from "../utils/constants";
import cron from "cron";

const restartAllRunningCrons = async (client: DiscordClient): Promise<void> => {
  const runningCrons: MongoResult[] = await client.db.findAllStartedJobs();

  for (const dbData of runningCrons) {
    const serverData: ServerDataDTO = dbData;
    if (!serverData.minutesToCheck || !serverData.schedule) {
      serverData.minutesToCheck = BotConstants.DEFAULT_MINUTES_TO_CHECK;
      serverData.schedule = BotConstants.DEFAULT_SCHEDULE;
      await client.db.save(dbData._id, {
        minutesToCheck: serverData.minutesToCheck,
        schedule: serverData.schedule,
      });
    }
    client.serverCache.set(dbData._id, serverData);
    const scheduledMessage = new cron.CronJob(serverData.schedule, async () => {
      await getMintsScheduledJob(client, dbData._id);
    });
    client.scheduledJobs.set(dbData._id, { wallets: scheduledMessage });
    scheduledMessage.start();
  }
  if (runningCrons.length > 0)
    client?.user?.setActivity("the specified wallets", { type: "WATCHING" });
  console.log(`Restarted ${runningCrons.length} crons.`);
};
export { restartAllRunningCrons };
