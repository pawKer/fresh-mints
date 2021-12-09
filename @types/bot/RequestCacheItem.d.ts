import { MintCountObject } from ".";
export interface RequestCacheItem {
  lastUpdated: string;
  mintedMap: Map<string, MintCountObject>;
}
