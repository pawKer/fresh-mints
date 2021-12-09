import axios from "axios";
import { Guild, MessageEmbed, TextChannel } from "discord.js";
import {
  DiscordClient,
  MintCountObject,
  MongoResult,
  ServerData,
} from "../@types/bot";
import {
  getBasicMintInfoEmbed,
  getErrorEmbed,
  getNoUpdatesEmbed,
} from "./embeds/embeds";
import BotConstants from "./utils/constants";
import { isWithinMinutes } from "./utils/utils";
import cron from "cron";

const addFieldsToEmbed = (
  mintCountMap: Map<string, MintCountObject>,
  embed: MessageEmbed,
  minutesToCheck: number
): void => {
  let colNames: string[] = [];
  for (const [nftAddress, info] of mintCountMap.entries()) {
    const etherscanLink = `[Etherscan](${BotConstants.ETHERSCAN_ADDRESS_URL}/${nftAddress})`;
    const openseaLink = `[Opensea](${BotConstants.OPENSEA_URL}/${nftAddress}/${
      info.tokenIds[0] || "1"
    })`;
    const collectionName = info.collectionName
      ? info.collectionName
      : "<Name not available>";
    embed.addField(
      `${collectionName} - Qty: ${info.tokenIds.length}`,
      `${etherscanLink} - ${openseaLink}`
    );
    if (collectionName !== "<Name not available>") {
      colNames.push(collectionName);
    }
  }
  embed.setDescription(
    `Minted ${
      colNames.length > 0 ? colNames : "these"
    } in the last ${minutesToCheck} minutes`
  );
};

const getMintedForFollowingAddresses = async (
  client: DiscordClient,
  serverId: string
): Promise<void> => {
  let cacheResult: ServerData | undefined = client.serverCache.get(serverId);
  if (!cacheResult) {
    return;
  }
  const {
    alertChannelId,
    infoChannelId,
    addressMap,
    contractMap,
    minutesToCheck,
    alertRole,
  } = cacheResult;

  if (!alertChannelId || !minutesToCheck) {
    console.error(`[${serverId}] GET_DATA`, "Some fields were not populated.");
    return;
  }

  const guild: Guild | undefined = client.guilds.cache.get(serverId);

  const channel: TextChannel = guild?.channels.cache.get(
    alertChannelId
  ) as TextChannel;

  let infoChannel: TextChannel | undefined = undefined;
  if (infoChannelId) {
    infoChannel = guild?.channels.cache.get(infoChannelId) as TextChannel;
  }

  let noUpdates: boolean = true;
  if (addressMap) {
    for (const [address, name] of addressMap.entries()) {
      let mintCount: Map<string, MintCountObject>;
      let cacheItem = client.requestCache.get(address);
      if (cacheItem && isWithinMinutes(cacheItem.lastUpdated, minutesToCheck)) {
        mintCount = cacheItem.mintedMap;
      } else {
        try {
          mintCount = await client.apiClient.getApiResponseAsMap(
            address,
            minutesToCheck
          );
          client.requestCache.set(address, {
            mintedMap: mintCount,
            lastUpdated: Date.now().toString(),
          });
        } catch (e) {
          handleApiErrors(
            e,
            serverId,
            infoChannel,
            name,
            address,
            minutesToCheck
          );
          continue;
        }
      }

      const mintInfoEmbed: MessageEmbed = getBasicMintInfoEmbed(name, address);

      addFieldsToEmbed(mintCount, mintInfoEmbed, minutesToCheck);

      if (mintCount.size > 0) {
        channel.send({ embeds: [mintInfoEmbed] });
        noUpdates = false;
      }
    }
  }
  if (contractMap) {
    for (const [address, name] of contractMap.entries()) {
      let mintCount: Map<string, MintCountObject>;
      let cacheItem = client.contractRequestCache.get(address);
      if (cacheItem && isWithinMinutes(cacheItem.lastUpdated, minutesToCheck)) {
        mintCount = cacheItem.mintedMap;
      } else {
        try {
          mintCount = await client.apiClient.getApiResponseAsMap(
            address,
            minutesToCheck,
            true
          );
          client.contractRequestCache.set(address, {
            mintedMap: mintCount,
            lastUpdated: Date.now().toString(),
          });
        } catch (e) {
          handleApiErrors(
            e,
            serverId,
            infoChannel,
            name,
            address,
            minutesToCheck
          );
          continue;
        }
      }

      const mintInfoEmbed: MessageEmbed = getBasicContractMintInfoEmbed(
        name,
        address
      );

      addFieldsToEmbed(mintCount, mintInfoEmbed, minutesToCheck);

      if (mintCount.size > 0) {
        channel.send({ embeds: [mintInfoEmbed] });
        noUpdates = false;
      }
    }
  }

  if (!noUpdates) {
    if (alertRole) {
      channel.send(`<@&${alertRole}>`);
    }
  } else {
    if (infoChannel) {
      infoChannel.send({ embeds: [getNoUpdatesEmbed(minutesToCheck)] });
    }
  }
};

const handleApiErrors = (
  e: any,
  serverId: string,
  infoChannel: TextChannel | undefined,
  name: string,
  address: string,
  minutesToCheck: number
) => {
  let message: string;
  if (axios.isAxiosError(e) && e.response) {
    message = `${e.response.status} - ${JSON.stringify(e.response.data)}`;
  } else {
    message = e.message;
  }
  infoChannel &&
    infoChannel.send({
      embeds: [getErrorEmbed(name, address, message, minutesToCheck)],
    });
  console.error(`[${serverId}] API_CLIENT_ERROR`, message);
};

const restartAllRunningCrons = async (client: DiscordClient): Promise<void> => {
  const runningCrons: MongoResult[] = await client.db.findAllStartedJobs();

  for (const dbData of runningCrons) {
    const serverData: ServerData = dbData;
    if (!serverData.minutesToCheck || !serverData.schedule) {
      serverData.minutesToCheck = BotConstants.DEFAULT_MINUTES_TO_CHECK;
      serverData.schedule = BotConstants.DEFAULT_SCHEDULE;
      await client.db.save(dbData._id, {
        minutesToCheck: serverData.minutesToCheck,
        schedule: serverData.schedule,
      });
    }
    client.serverCache.set(dbData._id, serverData);
    let cacheItem = client.serverCache.get(dbData._id);
    cacheItem!.scheduledMessage = new cron.CronJob(
      serverData.schedule,
      async () => {
        getMintedForFollowingAddresses(client, dbData._id);
      }
    );
    cacheItem!.scheduledMessage.start();
  }
  if (runningCrons.length > 0)
    client?.user?.setActivity("the specified wallets", { type: "WATCHING" });
  console.log(`Restarted ${runningCrons.length} crons.`);
};

export { getMintedForFollowingAddresses, restartAllRunningCrons };
function getBasicContractMintInfoEmbed(
  name: string,
  address: string
): MessageEmbed {
  throw new Error("Function not implemented.");
}
