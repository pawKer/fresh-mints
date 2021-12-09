export interface ServerDataDTO {
  alertChannelId?: string;
  infoChannelId?: string;
  areScheduledMessagesOn?: boolean;
  addressMap?: Map<string, string>;
  minutesToCheck?: number;
  schedule?: string;
  alertRole?: string | null;
  guildName?: string;
  contractMap?: Map<string, string>;
}
