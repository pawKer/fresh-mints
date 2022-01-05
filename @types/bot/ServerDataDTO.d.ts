interface AddressData {
  name: string;
  lastIdRead?: string;
  isContract?: boolean;
}
export interface ServerDataDTO {
  alertChannelId?: string;
  infoChannelId?: string;
  areScheduledMessagesOn?: boolean;
  addressMap?: Map<string, AddressData>;
  minutesToCheck?: number;
  schedule?: string;
  alertRole?: string | null;
  guildName?: string;
  trackOpenseaBuys?: boolean;
  activated?: boolean;
  activatedAt?: string;
}
