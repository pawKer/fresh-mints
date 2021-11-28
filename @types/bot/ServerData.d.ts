import { CronJob } from "cron";

export interface ServerData {
  alertChannelId?: string;
  infoChannelId?: string;
  areScheduledMessagesOn?: boolean;
  scheduledMessage?: CronJob;
  addressMap?: Map<string, string>;
}
