import axios, { AxiosResponse } from "axios";
import {
  EthApiClient,
  EtherscanApiResult,
  EtherscanParams,
  MintCountObject,
  ResultTransaction,
} from "../../@types/bot";
import { isWithinMinutes } from "../utils";

class EtherscanClient implements EthApiClient {
  NAME: string = "Etherscan";
  ETHERSCAN_API_URL: string = "https://api.etherscan.io/api";
  ETHERSCAN_PARAMS: EtherscanParams = {
    module: "account",
    action: "tokennfttx",
    page: 1,
    offset: 100,
    startblock: 0,
    endblock: 27025780,
    sort: "desc",
    apikey: process.env.ETHERSCAN_API_SECRET,
  };
  BLACK_HOLE_ADDRESS: string = "0x0000000000000000000000000000000000000000";
  API_REQUEST_COUNT = 0;

  async getApiResponseAsMap(
    address: string,
    minutesToCheck: number
  ): Promise<Map<string, MintCountObject>> {
    const params: EtherscanParams = this.ETHERSCAN_PARAMS;
    params.address = address;
    const apiRes: AxiosResponse<any, any> = await axios.get(
      this.ETHERSCAN_API_URL,
      {
        params: params,
      }
    );
    this.API_REQUEST_COUNT++;
    const res: EtherscanApiResult = apiRes.data;
    if (res.status === "0") {
      throw new Error("Failed to get results from Etherscan.");
    }
    const mintCount: Map<string, MintCountObject> = this.#getApiResponseAsMap(
      res.result,
      minutesToCheck
    );
    return mintCount;
  }

  #getApiResponseAsMap = (
    apiResponse: ResultTransaction[],
    minutesToCheck: number
  ): Map<string, MintCountObject> => {
    const mintCount: Map<string, MintCountObject> = new Map();
    if (apiResponse) {
      for (let result of apiResponse) {
        if (isWithinMinutes(result["timeStamp"], minutesToCheck)) {
          if (result["from"] === this.BLACK_HOLE_ADDRESS) {
            const itemFromMap = mintCount.get(result["contractAddress"]);
            if (!itemFromMap) {
              mintCount.set(result["contractAddress"], {
                tokenIds: [result["tokenID"]],
                collectionName: result["tokenName"] || result["tokenSymbol"],
              });
            } else {
              itemFromMap.tokenIds.push(result["tokenID"]);
            }
          }
        } else {
          break;
        }
      }
    }
    return mintCount;
  };
}
export default EtherscanClient;
