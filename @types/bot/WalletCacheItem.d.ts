import { MintCountObject } from ".";
export interface WalletCacheItem {
  lastUpdated: string;
  nextUpdate?: number;
  mintedMap: Map<string, MintCountObject>;
}
