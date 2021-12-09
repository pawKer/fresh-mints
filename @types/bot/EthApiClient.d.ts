import { EthApiResponse, MintCountObject } from ".";
export interface EthApiClient {
  API_REQUEST_COUNT: number;
  NAME: string;
  getApiResponseAsMap(
    address: string,
    minutesToCheck: number
  ): Promise<EthApiResponse>;
}
