import { MintCountObject } from ".";
export interface RequestCacheItem {
  lastUpdated: string;
  nextUpdate?: number;
  mintedMap: Map<string, MintCountObject>;
  osMintedMap: Map<string, MintCountObject>;
  id: string;
}
