import {
  Client,
  Guild,
  GuildMember,
  Intents,
  Message,
  MessageEmbed,
  TextChannel,
} from "discord.js";
import dotenv from "dotenv";
import cron from "cron";
import axios from "axios";
import {
  getErrorEmbed,
  getBasicMintInfoEmbed,
  getFollowingInfoEmbed,
  getNoUpdatesEmbed,
  getHelpEmbed,
  getInfoEmbed,
} from "./embeds.js";
import MongoDb from "./mongo.js";
import ethereum_address from "ethereum-address";
import {
  DatabaseRepository,
  ServerData,
  MongoResult,
  MintCountObject,
  EthApiClient,
} from "../@types/bot";
import EtherscanClient from "./api-clients/etherscan-client.js";
import CovalentClient from "./api-clients/covalent-client.js";
dotenv.config();

const MONGO_URI = `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@cluster0.fx8o1.mongodb.net/nft-bot?retryWrites=true&w=majority`;
const mongo: DatabaseRepository = new MongoDb(MONGO_URI);

let useEtherscan = false;
let apiClient: EthApiClient = new CovalentClient();

const ETHERSCAN_ADDRESS_URL = "https://etherscan.io/address";
const OPENSEA_URL = "https://opensea.io/assets";
const ADMIN_ID = "204731639438376970";

const cache: Map<string, ServerData> = new Map();

const CRON_STRING = "* * * * *";
let MINUTES_TO_CHECK = 2;

const CMD_PREFIX = ".";

const client: Client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

const getMintedForFollowingAddresses = async (
  serverId: string
): Promise<void> => {
  let cacheResult: ServerData | undefined = cache.get(serverId);
  if (!cacheResult) {
    return;
  }
  const { alertChannelId, infoChannelId, addressMap } = cacheResult;

  if (!alertChannelId || !addressMap) {
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
  for (const [address, name] of addressMap.entries()) {
    let mintCount: Map<string, MintCountObject>;
    try {
      mintCount = await apiClient.getApiResponseAsMap(
        address,
        MINUTES_TO_CHECK
      );
    } catch (e) {
      let message: string;
      if (axios.isAxiosError(e) && e.response) {
        message = `${e.response.status} - ${JSON.stringify(e.response.data)}`;
      } else {
        message = e.message;
      }
      infoChannel &&
        infoChannel.send({
          embeds: [getErrorEmbed(name, address, message, MINUTES_TO_CHECK)],
        });
      console.error(message);
      continue;
    }

    const mintInfoEmbed: MessageEmbed = getBasicMintInfoEmbed(name, address);

    addFieldsToEmbed(mintCount, mintInfoEmbed);

    if (mintCount.size > 0) {
      channel.send({ embeds: [mintInfoEmbed] });
      noUpdates = false;
    }
  }
  if (infoChannel && noUpdates) {
    infoChannel.send({ embeds: [getNoUpdatesEmbed(MINUTES_TO_CHECK)] });
  }
};

const addFieldsToEmbed = (
  mintCountMap: Map<string, MintCountObject>,
  embed: MessageEmbed
): void => {
  let colNames: string[] = [];
  for (const [nftAddress, info] of mintCountMap.entries()) {
    const etherscanLink = `[Etherscan](${ETHERSCAN_ADDRESS_URL}/${nftAddress})`;
    const openseaLink = `[Opensea](${OPENSEA_URL}/${nftAddress}/${
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
    } in the last ${MINUTES_TO_CHECK} minutes`
  );
};

const getFollowingListAsMessage = (serverId: string): MessageEmbed => {
  let cacheResult: ServerData | undefined = cache.get(serverId);
  const addressMap: Map<string, string> | undefined = cacheResult?.addressMap;
  const exampleEmbed = getFollowingInfoEmbed(addressMap ? addressMap.size : 0);
  let index = 1;
  if (addressMap && addressMap.size > 0) {
    addressMap.forEach((value, key) => {
      exampleEmbed.addField(
        `${index}. ${value}`,
        `[${key}](${ETHERSCAN_ADDRESS_URL}/${key})`
      );
      index++;
    });
  }
  return exampleEmbed;
};

const restartAllRunningCrons = async (): Promise<void> => {
  const runningCrons: MongoResult[] = await mongo.findAllStartedJobs();

  runningCrons.forEach((dbData) => {
    const serverData: ServerData = mongoResultToServerData(dbData);
    cache.set(dbData._id, serverData);
    let cacheItem = cache.get(dbData._id);
    cacheItem!.scheduledMessage = new cron.CronJob(CRON_STRING, async () => {
      getMintedForFollowingAddresses(dbData._id);
    });
    cacheItem!.scheduledMessage.start();
  });
  console.log(`Restarted ${runningCrons.length} crons.`);
};

const mongoResultToServerData = (dbData: MongoResult): ServerData => {
  return {
    alertChannelId: dbData.alertChannelId,
    infoChannelId: dbData.infoChannelId,
    areScheduledMessagesOn: dbData.areScheduledMessagesOn,
    addressMap: dbData.addressMap,
  };
};

client.once("ready", async () => {
  console.log(`Online as ${client?.user?.tag}`);
  client?.user?.setActivity("Candy Crush");
  await restartAllRunningCrons();
});

client.on("guildCreate", (guild) => {
  console.log(`Joined a new guild: ${guild.name} - ${guild.id}`);
  mongo.save(guild.id, {});
});

client.on("messageCreate", async (msg: Message<boolean>): Promise<void> => {
  const {
    content,
    guild,
    member,
  }: {
    content: string;
    guild: Guild | null;
    member: GuildMember | null;
  } = msg;

  let channel: TextChannel;

  if (msg.channel.type === "GUILD_TEXT") {
    channel = msg.channel as TextChannel;
  } else {
    return;
  }

  if (msg.author.bot || !content.startsWith(".") || !guild || !member) {
    return;
  }

  if (!guild.me?.permissionsIn(channel).has("SEND_MESSAGES")) {
    console.log("No permissions in channel");
    return;
  }

  if (!member.permissions.has("ADMINISTRATOR")) {
    msg.reply("You do not have permission to run this command.");
    return;
  }

  let data: ServerData | undefined = cache.get(guild.id);
  if (!data) {
    const dbData: MongoResult = await mongo.find(guild.id);
    if (!dbData) {
      data = {};
    } else {
      data = mongoResultToServerData(dbData);
    }
    cache.set(guild.id, data);
  }

  if (member.id === ADMIN_ID) {
    if (content === ".changeApiClient") {
      if (useEtherscan) {
        apiClient = new CovalentClient();
        useEtherscan = false;
        msg.reply("Changed API client to Covalent.");
      } else {
        apiClient = new EtherscanClient();
        useEtherscan = true;
        msg.reply("Changed API client to Etherscan.");
      }
    }

    if (content.startsWith(".setMinutes")) {
      const tokens = content.split(" ");
      const mins = parseInt(tokens[1]);
      MINUTES_TO_CHECK = mins;
      msg.reply(`Set minutes to check to ${MINUTES_TO_CHECK}.`);
    }
  }

  if (content === ".help") {
    msg.reply({ embeds: [getHelpEmbed()] });
  }

  if (!data.alertChannelId && content !== ".help") {
    msg.reply(
      "You need to set a channel for the alerts by using the `.alertHere` command."
    );
    msg.reply(
      "You can also set a channel for other info using the `.infoHere` command"
    );
    return;
  }

  if (content === ".alertHere") {
    data.alertChannelId = channel.id;
    mongo.save(guild.id, {
      alertChannelId: data.alertChannelId,
    });
    msg.reply(`Alert channel set to <#${data.alertChannelId}>.`);
  }

  if (content === ".infoHere") {
    data.infoChannelId = channel.id;
    mongo.save(guild.id, {
      infoChannelId: data.infoChannelId,
    });
    msg.reply(`Info channel set to <#${data.infoChannelId}>.`);
  }

  if (content === ".info") {
    msg.reply({
      embeds: [getInfoEmbed(data.alertChannelId, data.infoChannelId)],
    });
  }

  if (content === ".who") {
    msg.reply({ embeds: [getFollowingListAsMessage(guild.id)] });
  }

  if (content.startsWith(".add")) {
    const tokens = content.split(" ");
    if (tokens.length !== 3) {
      msg.reply("Message needs to be in format `.add <address> <name>`!");
      return;
    }
    const address = tokens[1];
    const name = tokens[2];
    if (ethereum_address.isAddress(address)) {
      if (!data.addressMap) {
        data.addressMap = new Map();
      }
      data.addressMap.set(address, name);
      mongo.save(guild.id, { addressMap: data.addressMap });
      msg.reply("New address saved.");
    } else {
      msg.reply("Provided ETH address is not valid.");
    }
  }

  if (content.startsWith(".remove")) {
    const tokens = content.split(" ");
    if (tokens.length !== 2) {
      msg.reply("Message needs to be in format `.remove <address>`!");
      return;
    }
    const address = tokens[1];
    if (!data.addressMap || data.addressMap.size === 0) {
      msg.reply(
        "You are currently not following any ETH addresses. Use the `.add` command to add some."
      );
      return;
    }
    if (data.addressMap.get(address)) {
      data.addressMap.delete(address);
      mongo.save(guild.id, { addressMap: data.addressMap });
      msg.reply("Address removed from watchlist.");
    } else {
      msg.reply("Address provided was not found in watchlist.");
    }
  }

  if (content === ".toggle") {
    if (!data.addressMap || data.addressMap.size === 0) {
      msg.reply(
        "You are currently not following any ETH addresses. Use the `.add` command to add some."
      );
      return;
    }
    if (data.areScheduledMessagesOn) {
      client?.user?.setActivity("Candy Crush");
      data.areScheduledMessagesOn = false;
      mongo.save(guild.id, { areScheduledMessagesOn: false });
      if (data.scheduledMessage) data.scheduledMessage.stop();
      msg.reply("Turned scheduled messages off.");
      console.log("Turned scheduled messages off.");
    } else {
      client?.user?.setActivity("the specified wallets", { type: "WATCHING" });
      data.areScheduledMessagesOn = true;
      mongo.save(guild.id, { areScheduledMessagesOn: true });
      if (!data.scheduledMessage) {
        data.scheduledMessage = new cron.CronJob(CRON_STRING, async () => {
          getMintedForFollowingAddresses(guild.id);
        });
      }
      data.scheduledMessage.start();
      msg.reply("Turned scheduled messages on.");
      console.log("Turned scheduled messages on.");
    }
  }
});

client.login(process.env.DISCORD_API_SECRET);
