import { MintCountObject } from ".";
export interface WalletCacheItem {
  lastUpdated: string;
  mintedMap: Map<string, MintCountObject>;
}
