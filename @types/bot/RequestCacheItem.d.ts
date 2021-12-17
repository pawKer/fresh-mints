import { MintCountObject } from ".";
export interface RequestCacheItem {
  lastUpdated: string;
  nextUpdate?: number;
  mintedMap: Map<string, MintCountObject>;
  id: string;
}
