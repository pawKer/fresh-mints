import { MintCountObject } from ".";
export interface EthApiClient {
  getApiResponseAsMap(
    address: string,
    minutesToCheck: number
  ): Promise<Map<string, MintCountObject>>;
}
