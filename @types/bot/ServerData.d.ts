import { CronJob } from "cron";
import { ServerDataDTO } from ".";

export interface ServerData extends ServerDataDTO {
  scheduledMessage?: CronJob;
}
