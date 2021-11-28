import { CronJob } from "cron";

export interface ServerDataDTO {
  alertChannelId?: string;
  infoChannelId?: string;
  areScheduledMessagesOn?: boolean;
  addressMap?: Map<string, string>;
}
