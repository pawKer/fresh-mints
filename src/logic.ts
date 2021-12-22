import axios from "axios";
import { Guild, MessageEmbed, TextChannel } from "discord.js";
import {
  DiscordClient,
  EthApiResponse,
  MintCountObject,
  MongoResult,
  ServerDataDTO,
} from "../@types/bot";
import {
  getBasicContractMintInfoEmbed,
  getBasicMintInfoEmbed,
  getErrorEmbed,
  getNoUpdatesEmbed,
} from "./embeds/embeds";
import BotConstants from "./utils/constants";
import cron from "cron";
import { AddressData } from "../@types/bot/ServerDataDTO";

const addFieldsToEmbed = (
  mintCountMap: Map<string, MintCountObject>,
  embed: MessageEmbed,
  minutesToCheck: number
): void => {
  const colNames: string[] = [];
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

const getMintsForAddress = async (
  client: DiscordClient,
  address: string,
  data: AddressData,
  minutesToCheck: number,
  serverId: string,
  infoChannel: undefined | TextChannel,
  isContract?: boolean
): Promise<Map<string, MintCountObject> | undefined> => {
  let mintCount: Map<string, MintCountObject>;
  const cacheItem = client.requestCache.get(address);
  if (cacheItem && cacheItem.nextUpdate && Date.now() < cacheItem.nextUpdate) {
    if (data.lastIdRead && data.lastIdRead === cacheItem.id) {
      return;
    }
    mintCount = cacheItem.mintedMap;
    data.lastIdRead = cacheItem.id;
  } else {
    try {
      const res: EthApiResponse = await client.apiClient.getApiResponseAsMap(
        address,
        minutesToCheck,
        isContract
      );
      mintCount = res.mintCount;
      client.requestCache.set(address, {
        mintedMap: mintCount,
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
        minutesToCheck
      );
      return;
    }
  }
  return mintCount;
};

const getMintedForFollowingAddresses = async (
  client: DiscordClient,
  serverId: string
): Promise<void> => {
  const guild: Guild | undefined = client.guilds.cache.get(serverId);

  if (!guild) {
    console.error(`[${serverId}] GET_DATA`, "Guild not populated");
    return;
  }

  let cacheResult: ServerDataDTO | undefined = client.serverCache.get(serverId);
  if (!cacheResult) {
    console.warn(`[${serverId}] GET_DATA`, "Cache not populated");
    cacheResult = (await client.db.find(serverId)) as ServerDataDTO;
    if (!cacheResult) {
      console.error(
        `[${serverId}] GET_DATA`,
        "Data from DB not populated. Returning..."
      );
      return;
    }
    client.serverCache.set(serverId, cacheResult);
  }
  const {
    alertChannelId,
    infoChannelId,
    addressMap,
    contractMap,
    minutesToCheck,
    alertRole,
    activated,
  } = cacheResult;

  if (!alertChannelId || !minutesToCheck) {
    console.error(
      `[${serverId}] GET_DATA`,
      "Alert channel or minutes to check not populated."
    );
    return;
  }

  if (!activated) {
    cacheResult.areScheduledMessagesOn = false;
    try {
      await client.db.save(guild.id, { areScheduledMessagesOn: false });
      console.log(
        `[${guild.id}] Server not active anymore, turning off active messages.`
      );
    } catch (e) {
      console.log(`[${guild.id}] Failed to disable scheduled messages`, e);
    }
    const scheduledJob = client.scheduledJobs.get(serverId);
    if (scheduledJob) scheduledJob.wallets.stop();
    return;
  }

  const channel: TextChannel | null = guild.channels.cache.get(
    alertChannelId
  ) as TextChannel;

  if (!channel) {
    console.error(`[${serverId}] GET_DATA`, "Alert channel not populated");
    return;
  }

  let infoChannel: TextChannel | undefined = undefined;
  if (infoChannelId) {
    infoChannel = guild.channels.cache.get(infoChannelId) as TextChannel;
  }

  let noUpdates = true;
  if (addressMap) {
    for (const [address, data] of addressMap.entries()) {
      const mintCount = await getMintsForAddress(
        client,
        address,
        data,
        minutesToCheck,
        serverId,
        infoChannel
      );

      if (!mintCount) continue;

      const mintInfoEmbed: MessageEmbed = getBasicMintInfoEmbed(
        data.name,
        address
      );

      addFieldsToEmbed(mintCount, mintInfoEmbed, minutesToCheck);

      if (mintCount.size > 0) {
        await channel.send({ embeds: [mintInfoEmbed] });
        noUpdates = false;
      }
    }
  }
  if (contractMap) {
    for (const [address, data] of contractMap.entries()) {
      const mintCount = await getMintsForAddress(
        client,
        address,
        data,
        minutesToCheck,
        serverId,
        infoChannel,
        true
      );

      if (!mintCount) continue;

      const mintInfoEmbed: MessageEmbed = getBasicContractMintInfoEmbed(
        data.name,
        address
      );

      addFieldsToEmbed(mintCount, mintInfoEmbed, minutesToCheck);

      if (mintCount.size > 0) {
        await channel.send({ embeds: [mintInfoEmbed] });
        noUpdates = false;
      }
    }
  }

  if (!noUpdates) {
    if (alertRole) {
      await channel.send(`<@&${alertRole}>`);
    }
  } else {
    if (infoChannel) {
      await infoChannel.send({ embeds: [getNoUpdatesEmbed(minutesToCheck)] });
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
  console.error(`[${serverId}] [${address}] API_CLIENT_ERROR`, message);
};

const restartAllRunningCrons = async (client: DiscordClient): Promise<void> => {
  const runningCrons: MongoResult[] = await client.db.findAllStartedJobs();

  for (const dbData of runningCrons) {
    const serverData: ServerDataDTO = dbData;
    if (!serverData.minutesToCheck || !serverData.schedule) {
      serverData.minutesToCheck = BotConstants.DEFAULT_MINUTES_TO_CHECK;
      serverData.schedule = BotConstants.DEFAULT_SCHEDULE;
      await client.db.save(dbData._id, {
        minutesToCheck: serverData.minutesToCheck,
        schedule: serverData.schedule,
      });
    }
    client.serverCache.set(dbData._id, serverData);
    const scheduledMessage = new cron.CronJob(serverData.schedule, async () => {
      await getMintedForFollowingAddresses(client, dbData._id);
    });
    client.scheduledJobs.set(dbData._id, { wallets: scheduledMessage });
    scheduledMessage.start();
  }
  if (runningCrons.length > 0)
    client?.user?.setActivity("the specified wallets", { type: "WATCHING" });
  console.log(`Restarted ${runningCrons.length} crons.`);
};

export { getMintedForFollowingAddresses, restartAllRunningCrons };
