import { MintCountObject } from ".";

export interface EthApiResponse {
  mintCount: Map<string, MintCountObject>;
  osMintCount: Map<string, MintCountObject>;
  nextUpdate?: number;
  id: string;
}
