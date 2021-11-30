import axios, { AxiosResponse } from "axios";
import {
  CovalentApiResult,
  EthApiClient,
  MintCountObject,
} from "../../@types/bot";
import { isWithinMinutes } from "../utils";

interface CovalentParams {
  pageNumber: number;
  pageSize: number;
}

class CovalentClient implements EthApiClient {
  NAME: string = "Covalent";
  COVALENT_PARAMS: CovalentParams = {
    pageNumber: 0,
    pageSize: 25,
  };
  BLACK_HOLE_ADDRESS: string = "0x0000000000000000000000000000000000000000";
  public API_REQUEST_COUNT = 0;

  async getApiResponseAsMap(
    address: string,
    minutesToCheck: number
  ): Promise<Map<string, MintCountObject>> {
    const url: string = `https://api.covalenthq.com/v1/1/address/${address}/transactions_v2/?page-number=${this.COVALENT_PARAMS.pageNumber}&page-size=${this.COVALENT_PARAMS.pageSize}`;
    const apiRes: AxiosResponse<any, any> = await axios.get(url, {
      auth: {
        username: process.env.COVALENT_USER ? process.env.COVALENT_USER : "",
        password: "",
      },
    });
    this.API_REQUEST_COUNT++;
    const res: CovalentApiResult = apiRes.data;
    const mintCount: Map<string, MintCountObject> = this.#getApiResponseAsMap(
      res,
      minutesToCheck
    );
    return mintCount;
  }

  #getApiResponseAsMap = (
    apiResponse: CovalentApiResult,
    minutesToCheck: number
  ): Map<string, MintCountObject> => {
    const mintCount: Map<string, MintCountObject> = new Map();
    if (apiResponse.data && apiResponse.data.items) {
      for (let item of apiResponse.data.items) {
        const date = new Date(item.block_signed_at);
        const timestamp = date.getTime();
        if (item.from_address !== apiResponse.data.address) {
          continue;
        }
        if (isWithinMinutes(timestamp.toString(), minutesToCheck)) {
          if (!item.log_events || !(item.log_events.length > 0)) {
            continue;
          }

          let log_event = item.log_events[0];

          if (
            !log_event.decoded ||
            !log_event.decoded.params ||
            !(log_event.decoded.params.length >= 2)
          ) {
            continue;
          }

          let fromAddr = log_event.decoded.params[0].value;
          let toAddr = log_event.decoded.params[1].value;
          let collectionName = log_event.sender_name;
          let collectionTicker = log_event.sender_contract_ticker_symbol;
          let collectionAddress = log_event.sender_address;
          let operation = log_event.decoded.name;

          if (
            fromAddr === this.BLACK_HOLE_ADDRESS &&
            operation === "Transfer"
          ) {
            const itemFromMap = mintCount.get(collectionAddress);
            if (!itemFromMap) {
              mintCount.set(collectionAddress, {
                tokenIds: [""],
                collectionName: collectionName || collectionTicker,
              });
            } else {
              itemFromMap.tokenIds.push("");
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
export default CovalentClient;
