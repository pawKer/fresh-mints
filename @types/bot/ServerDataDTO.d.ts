interface AddressData {
  name: string;
  lastIdRead?: string;
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
  contractMap?: Map<string, AddressData>;
  activated?: boolean;
  activatedAt?: string;
}
