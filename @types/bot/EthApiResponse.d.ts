import { MintCountObject } from ".";

export interface EthApiResponse {
  mintCount: Map<string, MintCountObject>;
  nextUpdate?: number;
}
