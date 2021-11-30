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
  WalletCacheItem,
} from "../@types/bot";
import EtherscanClient from "./api-clients/etherscan-client.js";
import CovalentClient from "./api-clients/covalent-client.js";
import { isWithinMinutes } from "./utils.js";
import cronTime from "cron-time-generator";
import cronstrue from "cronstrue";
dotenv.config();

const MONGO_URI = `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@cluster0.fx8o1.mongodb.net/nft-bot?retryWrites=true&w=majority`;
const mongo: DatabaseRepository = new MongoDb(MONGO_URI);

let useEtherscan = false;
let apiClient: EthApiClient = new CovalentClient();

const ETHERSCAN_ADDRESS_URL = "https://etherscan.io/address";
const OPENSEA_URL = "https://opensea.io/assets";
const ADMIN_ID = "204731639438376970";

const cache: Map<string, ServerData> = new Map();
const requestCache: Map<string, WalletCacheItem> = new Map();

const DEFAULT_SCHEDULE = "* * * * *";
const DEFAULT_MINUTES_TO_CHECK = 2;

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
  const {
    alertChannelId,
    infoChannelId,
    addressMap,
    minutesToCheck,
    alertRole,
  } = cacheResult;

  if (!alertChannelId || !addressMap || !minutesToCheck) {
    console.error("GET_DATA", "Some fields were not populated.");
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
    let cacheItem = requestCache.get(address);
    if (cacheItem && isWithinMinutes(cacheItem.lastUpdated, minutesToCheck)) {
      mintCount = cacheItem.mintedMap;
    } else {
      try {
        mintCount = await apiClient.getApiResponseAsMap(
          address,
          minutesToCheck
        );
        requestCache.set(address, {
          mintedMap: mintCount,
          lastUpdated: Date.now().toString(),
        });
      } catch (e) {
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
        console.error("API_CLIENT_ERROR", message);
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

const addFieldsToEmbed = (
  mintCountMap: Map<string, MintCountObject>,
  embed: MessageEmbed,
  minutesToCheck: number
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
    } in the last ${minutesToCheck} minutes`
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

const restartAllRunningCrons = async (client: Client): Promise<void> => {
  const runningCrons: MongoResult[] = await mongo.findAllStartedJobs();

  runningCrons.forEach((dbData) => {
    const serverData: ServerData = dbData;
    if (!serverData.minutesToCheck || !serverData.schedule) {
      serverData.minutesToCheck = DEFAULT_MINUTES_TO_CHECK;
      serverData.schedule = DEFAULT_SCHEDULE;
      mongo.save(dbData._id, {
        minutesToCheck: serverData.minutesToCheck,
        schedule: serverData.schedule,
      });
    }
    cache.set(dbData._id, serverData);
    let cacheItem = cache.get(dbData._id);
    cacheItem!.scheduledMessage = new cron.CronJob(
      serverData.schedule,
      async () => {
        getMintedForFollowingAddresses(dbData._id);
      }
    );
    cacheItem!.scheduledMessage.start();
  });
  if (runningCrons.length > 0)
    client?.user?.setActivity("the specified wallets", { type: "WATCHING" });
  console.log(`Restarted ${runningCrons.length} crons.`);
};

const logApiRequests = () => {
  console.log("API REQUESTS in the last hour", apiClient.API_REQUEST_COUNT);
  apiClient.API_REQUEST_COUNT = 0;
};

client.once("ready", async () => {
  console.log(`Online as ${client?.user?.tag}`);
  client?.user?.setActivity("Candy Crush");
  await restartAllRunningCrons(client);
  let logApiReqs = new cron.CronJob("0 * * * *", async () => {
    logApiRequests();
  });
  logApiReqs.start();
});

client.on("guildCreate", (guild) => {
  console.log(`Joined a new guild: ${guild.name} - ${guild.id}`);
  mongo.save(guild.id, {
    minutesToCheck: DEFAULT_MINUTES_TO_CHECK,
    schedule: DEFAULT_SCHEDULE,
  });
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
      data = dbData;
      if (!data.minutesToCheck || !data.schedule) {
        data.minutesToCheck = DEFAULT_MINUTES_TO_CHECK;
        data.schedule = DEFAULT_SCHEDULE;
        mongo.save(guild.id, {
          minutesToCheck: data.minutesToCheck,
          schedule: data.schedule,
        });
      }
    }
    cache.set(guild.id, data);
  }

  if (member.id === ADMIN_ID) {
    if (content === ".changeApiClient") {
      if (useEtherscan) {
        apiClient = new CovalentClient();
        useEtherscan = false;
      } else {
        apiClient = new EtherscanClient();
        useEtherscan = true;
      }
      msg.reply(`Changed API client to ${apiClient.NAME}`);
    }
    if (content.startsWith(".setMinutes")) {
      const tokens = content.split(" ");
      if (tokens.length !== 2) {
        msg.reply(
          "Message must be in format `.setMinutes <number-of-minutes>`."
        );
        return;
      }
      const mins = parseInt(tokens[1]);
      if (!mins) {
        msg.reply("Second argument must be a number!");
        return;
      }
      data.minutesToCheck = mins;
      mongo.save(guild.id, {
        minutesToCheck: data.minutesToCheck,
      });
      msg.reply(`Set minutes to ${data.minutesToCheck}.`);
    }
  }

  if (content === ".help") {
    msg.reply({ embeds: [getHelpEmbed()] });
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

  if (!data.alertChannelId && content !== ".help") {
    msg.reply(
      "You need to set a channel for the alerts by using the `.alertHere` command."
    );
    msg.reply(
      "You can also set a channel for other info using the `.infoHere` command"
    );
    return;
  }

  if (content === ".info") {
    msg.reply({
      embeds: [
        getInfoEmbed(
          data.alertChannelId,
          data.infoChannelId,
          cronstrue.toString(data.schedule || DEFAULT_SCHEDULE),
          data.alertRole
        ),
      ],
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
        data.scheduledMessage = new cron.CronJob(
          data.schedule || DEFAULT_SCHEDULE,
          async () => {
            getMintedForFollowingAddresses(guild.id);
          }
        );
      }
      data.scheduledMessage.start();
      msg.reply("Turned scheduled messages on.");
      console.log("Turned scheduled messages on.");
    }
  }

  if (content.startsWith(".setSchedule")) {
    const tokens = content.split(" ");
    if (tokens.length !== 2) {
      msg.reply(
        "Message must be in format `.setSchedule <number-of-minutes>`."
      );
      return;
    }
    const mins = parseInt(tokens[1]);
    if (!mins) {
      msg.reply("Second argument must be a number!");
      return;
    }
    if (mins < 1 || mins > 60) {
      msg.reply("Interval needs to be between 1 and 60 minutes.");
      return;
    }
    data.minutesToCheck = mins + 1;
    data.schedule = cronTime.every(mins).minutes();
    mongo.save(guild.id, {
      minutesToCheck: data.minutesToCheck,
      schedule: data.schedule,
    });
    msg.reply(`Set schedule to \`${cronstrue.toString(data.schedule)}\`.`);
  }

  if (content.startsWith(".setAlertRole")) {
    console.log(msg.mentions);
    let mentionedRole = msg.mentions.roles.first()?.id;
    if (!mentionedRole) {
      msg.reply("Message must be in the format `.setAlertRole @<role>.`");
      return;
    }
    data.alertRole = mentionedRole;
    mongo.save(guild.id, { alertRole: data.alertRole });
    msg.reply(`Alert role set to: <@&${mentionedRole}>.`);
  }

  if (content === ".clearAlertRole") {
    data.alertRole = "";
    mongo.save(guild.id, { alertRole: data.alertRole });
    msg.reply(`Alert role has been reset.`);
  }
});

client.login(process.env.DISCORD_API_SECRET);
