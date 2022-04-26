import axios from "axios";
import { TextChannel } from "discord.js";
import {
  DiscordClient,
  EthApiResponse,
  MintCountObject,
  MintCountResponse,
} from "../../@types/bot";
import { AddressData } from "../../@types/bot/ServerDataDTO";
import { getErrorEmbed } from "../embeds/embeds";
import { MetricClient } from "../metrics/metric-client";

const getMintsForAddress = async (
  client: DiscordClient,
  address: string,
  data: AddressData,
  minutesToCheck: number,
  serverId: string,
  infoChannel: undefined | TextChannel,
  isContract?: boolean
): Promise<MintCountResponse | undefined> => {
  let mintCount: Map<string, MintCountObject>;
  let osMintCount: Map<string, MintCountObject>;
  const cacheItem = client.requestCache.get(address);
  if (cacheItem && cacheItem.nextUpdate && Date.now() < cacheItem.nextUpdate) {
    if (data.lastIdRead && data.lastIdRead === cacheItem.id) {
      return;
    }
    mintCount = cacheItem.mintedMap;
    osMintCount = cacheItem.osMintedMap;
    data.lastIdRead = cacheItem.id;
  } else {
    try {
      const res: EthApiResponse = await client.apiClient.getApiResponseAsMap(
        serverId,
        address,
        minutesToCheck,
        client.metrics,
        isContract
      );
      mintCount = res.mintCount;
      osMintCount = res.osMintCount;
      client.requestCache.set(address, {
        mintedMap: mintCount,
        osMintedMap: osMintCount,
        nextUpdate: res.nextUpdate,
        lastUpdated: Date.now().toString(),
        id: res.id,
      });
      data.lastIdRead = res.id;
    } catch (e) {
      handleApiErrors(
        e,
        serverId,
        infoChannel,
        data.name,
        address,
        minutesToCheck,
        client.metrics
      );
      return;
    }
  }
  return {
    forAddress: address,
    forAddressData: data,
    mintCount,
    osMintCount,
  };
};

const handleApiErrors = (
  e: any,
  serverId: string,
  infoChannel: TextChannel | undefined,
  name: string,
  address: string,
  minutesToCheck: number,
  metricClient: MetricClient
) => {
  let message: string;
  let apiResp: string;
  let statusCode = 0;
  if (axios.isAxiosError(e) && e.response) {
    statusCode = e.response.status;
    apiResp = JSON.stringify(e.response.data);
    message = `${statusCode} - ${apiResp}`;
  } else {
    message = e.message;
    apiResp = e.message;
  }
  infoChannel &&
    infoChannel.send({
      embeds: [getErrorEmbed(name, address, message, minutesToCheck)],
    });
  console.error(`[${serverId}] [${address}] API_CLIENT_ERROR`, message);
  metricClient.exposeApiError(serverId, address, statusCode, apiResp);
};

export { getMintsForAddress };
