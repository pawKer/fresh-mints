import { Guild, TextChannel } from "discord.js";
import { DiscordClient, ServerDataDTO } from "../../@types/bot";
import { getNoUpdatesEmbed } from "../embeds/embeds";
import { checkAndSendUpdates } from "./check-and-send-updates";

const getMintsScheduledJob = async (
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
    console.warn(
      `[${serverId}] GET_DATA`,
      "Cache not populated. Fetching from DB..."
    );
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
    minutesToCheck,
    alertRole,
    activated,
    trackOpenseaBuys,
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
      console.log(
        `[${guild.id}] Server not active anymore, turning off active messages.`
      );
      await client.db.save(guild.id, { areScheduledMessagesOn: false });
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

  if (!addressMap) {
    console.error(`[${serverId}] GET_DATA`, "Address map not populated");
    return;
  }

  let infoChannel: TextChannel | undefined = undefined;
  if (infoChannelId) {
    infoChannel = guild.channels.cache.get(infoChannelId) as TextChannel;
  }

  let noUpdates = true;

  const startTime = Date.now();

  const walletPromises = [];

  for (const [address, data] of addressMap.entries()) {
    walletPromises.push(
      checkAndSendUpdates(
        client,
        address,
        data,
        minutesToCheck,
        serverId,
        channel,
        infoChannel,
        trackOpenseaBuys
      )
    );
  }

  const results = await Promise.all(walletPromises);

  for (const sentUpdates of results) {
    if (sentUpdates) {
      noUpdates = false;
      break;
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
  const endTime = Date.now();
  const elapsed = (endTime - startTime) / 1000;
  console.log("Full check for server took", elapsed, "seconds");
};

export { getMintsScheduledJob };
