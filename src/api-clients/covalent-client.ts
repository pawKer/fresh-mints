import axios, { AxiosResponse } from "axios";
import {
  CovalentApiResult,
  EthApiClient,
  EthApiResponse,
  MintCountObject,
} from "../../@types/bot";
import { getUniqueId, isWithinMinutes } from "../utils/utils";
import BotConstants from "../utils/constants";

interface CovalentParams {
  pageNumber: number;
  pageSize: number;
}

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
    const mintCounts: Map<string, MintCountObject>[] = this.getMintsAsMap(
      res,
      minutesToCheck,
      isContract
    );

    return {
      mintCount: mintCounts[0],
      osMintCount: mintCounts[1],
      nextUpdate: new Date(res.data.next_update_at).getTime(),
      id: getUniqueId(),
    };
  }

  private getMintsAsMap = (
    apiResponse: CovalentApiResult,
    minutesToCheck: number,
    isContract?: boolean
  ): Map<string, MintCountObject>[] => {
    const mintCount: Map<string, MintCountObject> = new Map();
    const osMintCount: Map<string, MintCountObject> = new Map();
    if (apiResponse.data && apiResponse.data.items) {
      for (const item of apiResponse.data.items) {
        const date = new Date(item.block_signed_at);
        const toAddrLabel = item.to_address_label;
        const timestamp = date.getTime();
        let tokenId = "";
        if (!isWithinMinutes(timestamp.toString(), minutesToCheck)) {
          break;
        }

        if (!item.log_events || !(item.log_events.length > 0)) {
          continue;
        }

        for (const log_event of item.log_events) {
          if (
            !log_event.decoded ||
            !log_event.decoded.params ||
            !(log_event.decoded.params.length > 0)
          ) {
            continue;
          }
          const operation = log_event.decoded.name;
          const collectionName = log_event.sender_name;
          const collectionTicker = log_event.sender_contract_ticker_symbol;
          const collectionAddress = log_event.sender_address;
          const txHash = log_event.tx_hash;
          let shouldAdd = false;

          if (operation === "TransferSingle") {
            const fromAddr = log_event.decoded.params[1].value;
            const toAddr = log_event.decoded.params[2].value;
            const valueName = log_event.decoded.params[4].name;
            const value = log_event.decoded.params[4].value;
            tokenId = log_event.decoded.params[3].value
              ? log_event.decoded.params[3].value
              : "";
            // shouldAdd = toAddr === apiResponse.data.address;
            // Disabled as there's no way to know who initiated
            // so gives false positive when someone sends NFTs to
            // the address
            shouldAdd = false;
          } else if (operation === "Transfer") {
            const fromAddr = log_event.decoded.params[0].value;
            const toAddr = log_event.decoded.params[1].value;
            const valueName = log_event.decoded.params[2].name;
            const value = log_event.decoded.params[2].value;
            tokenId =
              log_event.raw_log_topics.length === 4
                ? BigInt(log_event.raw_log_topics[3]).toString()
                : "";
            shouldAdd = this.shouldAdd(
              fromAddr,
              toAddr,
              item.from_address,
              collectionAddress,
              apiResponse.data.address,
              value,
              valueName,
              toAddrLabel,
              isContract
            );
          }
          if (shouldAdd) {
            this.addToMap(
              mintCount,
              osMintCount,
              collectionAddress,
              collectionName,
              collectionTicker,
              tokenId,
              toAddrLabel,
              txHash,
              isContract
            );
          }
        }
      }
    }
    return [mintCount, osMintCount];
  };

  private addToMap(
    mintCount: Map<string, MintCountObject>,
    osMintCount: Map<string, MintCountObject>,
    collectionAddress: string,
    collectionName: string,
    collectionTicker: string,
    tokenId: string,
    toAddrLabel: string | null,
    txHash: string,
    isContract?: boolean
  ) {
    const itemFromOsMap = osMintCount.get(collectionAddress);
    if (toAddrLabel === "OpenSea" && !isContract) {
      if (!itemFromOsMap) {
        osMintCount.set(collectionAddress, {
          tokenIds: [tokenId],
          collectionName: collectionName || collectionTicker,
          txHashes: [txHash],
        });
      } else {
        itemFromOsMap.tokenIds.push(tokenId);
        itemFromOsMap.txHashes.push(txHash);
      }

      return;
    }
    const itemFromMap = mintCount.get(collectionAddress);
    if (!itemFromMap) {
      mintCount.set(collectionAddress, {
        tokenIds: [tokenId],
        collectionName: collectionName || collectionTicker,
        txHashes: [txHash],
      });
    } else {
      itemFromMap.tokenIds.push(tokenId);
      itemFromMap.txHashes.push(txHash);
    }
  }

  private shouldAdd(
    fromAddr: string,
    toAddr: string,
    txFrom: string,
    collectionAddr: string,
    trackedAddr: string,
    txValue: string | null,
    txValueName: string,
    toAddrLabel: string | null,
    isContract?: boolean
  ): boolean {
    if (txValueName === "value" && txValue !== null) {
      return false;
    }

    if (isContract) {
      if (
        fromAddr === BotConstants.BLACK_HOLE_ADDRESS &&
        collectionAddr === trackedAddr
      ) {
        return true;
      }
    } else {
      if (toAddr === trackedAddr && txFrom === trackedAddr) {
        return true;
      }
      if (toAddrLabel === "OpenSea" && toAddr === trackedAddr) {
        return true;
      }
    }
    return false;
  }
}
export default CovalentClient;
