import axios, { AxiosResponse } from "axios";
import {
  CovalentApiResult,
  EthApiClient,
  EthApiResponse,
  MintCountObject,
} from "../../@types/bot";
import { isWithinMinutes } from "../utils/utils";
import BotConstants from "../utils/constants";

interface CovalentParams {
  pageNumber: number;
  pageSize: number;
}

class CovalentClient implements EthApiClient {
  NAME = "Covalent";
  COVALENT_PARAMS: CovalentParams = {
    pageNumber: 0,
    pageSize: 25,
  };
  public API_REQUEST_COUNT = 0;

  async getApiResponseAsMap(
    address: string,
    minutesToCheck: number,
    isContract?: boolean
  ): Promise<EthApiResponse> {
    const url = `https://api.covalenthq.com/v1/1/address/${address}/transactions_v2/?page-number=${this.COVALENT_PARAMS.pageNumber}&page-size=${this.COVALENT_PARAMS.pageSize}`;
    const apiRes: AxiosResponse<never, never> = await axios.get(url, {
      auth: {
        username: process.env.COVALENT_USER ? process.env.COVALENT_USER : "",
        password: "",
      },
    });
    this.API_REQUEST_COUNT++;
    const res: CovalentApiResult = apiRes.data;
    const mintCount: Map<string, MintCountObject> = this.getMintsAsMap(
      res,
      minutesToCheck,
      isContract
    );

    return {
      mintCount,
      nextUpdate: new Date(res.data.next_update_at).getTime(),
    };
  }

  private getMintsAsMap = (
    apiResponse: CovalentApiResult,
    minutesToCheck: number,
    isContract?: boolean
  ): Map<string, MintCountObject> => {
    const mintCount: Map<string, MintCountObject> = new Map();
    if (apiResponse.data && apiResponse.data.items) {
      for (const item of apiResponse.data.items) {
        const date = new Date(item.block_signed_at);
        const timestamp = date.getTime();
        if (isWithinMinutes(timestamp.toString(), minutesToCheck)) {
          if (!item.log_events || !(item.log_events.length > 0)) {
            continue;
          }
          for (const log_event of item.log_events) {
            if (
              !log_event.decoded ||
              !log_event.decoded.params ||
              !(log_event.decoded.params.length === 3)
            ) {
              continue;
            }

            const fromAddr = log_event.decoded.params[0].value;
            const toAddr = log_event.decoded.params[1].value;
            const value = log_event.decoded.params[2].value;
            const collectionName = log_event.sender_name;
            const collectionTicker = log_event.sender_contract_ticker_symbol;
            const collectionAddress = log_event.sender_address;
            const operation = log_event.decoded.name;
            /*
              Mints
              For wallet:
              * Need to come from black hole address
              * Need to go to the address of the owner
              * Transaction from address needs to be the owner address
              * The value should be null
              * The operation should be Transfer
              For contract:
              * Need to come from black hole address
              * The to_address should be the address of the contract
              * The value should be null
              * The operation should be Transfer
            */
            if (isContract) {
              if (
                fromAddr === BotConstants.BLACK_HOLE_ADDRESS &&
                collectionAddress === apiResponse.data.address &&
                value === null &&
                operation === "Transfer"
              ) {
                this.addToMap(
                  mintCount,
                  collectionAddress,
                  collectionName,
                  collectionTicker
                );
              }
            } else {
              if (
                fromAddr === BotConstants.BLACK_HOLE_ADDRESS &&
                toAddr === apiResponse.data.address &&
                item.from_address === apiResponse.data.address &&
                value === null &&
                operation === "Transfer"
              ) {
                this.addToMap(
                  mintCount,
                  collectionAddress,
                  collectionName,
                  collectionTicker
                );
              }
            }
          }
        } else {
          break;
        }
      }
    }
    return mintCount;
  };

  private addToMap(
    mintCount: Map<string, MintCountObject>,
    collectionAddress: string,
    collectionName: string,
    collectionTicker: string
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
}
export default CovalentClient;
