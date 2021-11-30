export interface MongoResult {
  _id: string;
  __v: number;
  alertChannelId?: string;
  infoChannelId?: string;
  areScheduledMessagesOn?: boolean;
  addressMap?: Map<string, string>;
  minutesToCheck?: number;
  schedule?: string;
  alertRole?: string;
}
