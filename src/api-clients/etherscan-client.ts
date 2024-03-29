import axios, { AxiosResponse } from "axios";
import {
  EthApiClient,
  EthApiResponse,
  EtherscanApiResult,
  EtherscanParams,
  MintCountObject,
  ResultTransaction,
} from "../../@types/bot";
import { MetricClient } from "../metrics/metric-client";
import BotConstants from "../utils/constants";
import { getUniqueId, isWithinMinutes } from "../utils/utils";

// TODO: Review this class to make sure it still meets reqs
class EtherscanClient implements EthApiClient {
  NAME = "Etherscan";
  ETHERSCAN_API_URL = "https://api.etherscan.io/api";
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
  API_REQUEST_COUNT = 0;

  async getApiResponseAsMap(
    serverId: string,
    address: string,
    minutesToCheck: number,
    metricsClient: MetricClient
  ): Promise<EthApiResponse> {
    const params: EtherscanParams = this.ETHERSCAN_PARAMS;
    params.address = address;
    const apiRes: AxiosResponse<never, never> = await axios.get(
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
    return {
      mintCount,
      osMintCount: new Map<string, MintCountObject>(),
      nextUpdate: Date.now() + 60 * 1000,
      id: getUniqueId(),
    };
  }

  #getApiResponseAsMap = (
    apiResponse: ResultTransaction[],
    minutesToCheck: number
  ): Map<string, MintCountObject> => {
    const mintCount: Map<string, MintCountObject> = new Map();
    if (apiResponse) {
      for (const result of apiResponse) {
        if (isWithinMinutes(result["timeStamp"], minutesToCheck)) {
          if (result["from"] === BotConstants.BLACK_HOLE_ADDRESS) {
            const itemFromMap = mintCount.get(result["contractAddress"]);
            if (!itemFromMap) {
              mintCount.set(result["contractAddress"], {
                tokenIds: [result["tokenID"]],
                collectionName: result["tokenName"] || result["tokenSymbol"],
                txHashes: [result["hash"]],
              });
            } else {
              itemFromMap.tokenIds.push(result["tokenID"]);
              itemFromMap.txHashes.push(result["hash"]);
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
