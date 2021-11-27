import { Client, Intents } from "discord.js";
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
dotenv.config();

const MONGO_URI = `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@cluster0.fx8o1.mongodb.net/nft-bot?retryWrites=true&w=majority`;
const mongo = new MongoDb(MONGO_URI);

const ETHERSCAN_ADDRESS_URL = "https://etherscan.io/address";
const ETHERSCAN_API_URL = "https://api.etherscan.io/api";
const OPENSEA_URL = "https://opensea.io/assets";

const BLACK_HOLE_ADDRESS = "0x0000000000000000000000000000000000000000";

const cache = new Map();

const CRON_STRING = "* * * * *";
const MINUTES_TO_CHECK = 2;

const ETHERSCAN_PARAMS = {
  module: "account",
  action: "tokennfttx",
  page: 1,
  offset: 100,
  startblock: 0,
  endblock: 27025780,
  sort: "desc",
  apikey: process.env.ETHERSCAN_API_SECRET,
};

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

const isWithinMinutes = (timestamp, mins) => {
  return Date.now() - parseInt(timestamp) * 1000 <= mins * 60 * 1000;
};

const getMintedForFollowingAddresses = async (serverId, data) => {
  const { alertChannelId, infoChannelId, addressMap } = data;
  const guild = client.guilds.cache.get(serverId);
  const channel = guild.channels.cache.get(alertChannelId);
  let no_updates_channel;
  if (infoChannelId) {
    no_updates_channel = guild.channels.cache.get(infoChannelId);
  }
  let noUpdates = true;
  for (const [address, name] of addressMap.entries()) {
    let res;
    try {
      ETHERSCAN_PARAMS.address = address;
      res = await axios.get(ETHERSCAN_API_URL, {
        params: ETHERSCAN_PARAMS,
      });
    } catch (e) {
      channel.send({
        embeds: [
          getErrorEmbed(name, address, e.response.status, MINUTES_TO_CHECK),
        ],
      });
      return;
    }

    if (res.data.status === "0") {
      channel.send({
        embeds: [
          getErrorEmbed(name, address, res.data.message, MINUTES_TO_CHECK),
        ],
      });
      return;
    }

    const mintInfoEmbed = getBasicMintInfoEmbed(
      name,
      address,
      MINUTES_TO_CHECK
    );

    const mintCount = getApiResponseAsMap(res.data["result"]);

    addFieldsToEmbed(mintCount, mintInfoEmbed, name);

    if (mintCount.size > 0) {
      channel.send({ embeds: [mintInfoEmbed] });
      noUpdates = false;
    }
  }
  if (no_updates_channel && noUpdates) {
    no_updates_channel.send({ embeds: [getNoUpdatesEmbed(MINUTES_TO_CHECK)] });
  }
};

const getApiResponseAsMap = (apiResponse) => {
  const mintCount = new Map();
  if (apiResponse) {
    for (let result of apiResponse) {
      if (
        result["from"] === BLACK_HOLE_ADDRESS &&
        isWithinMinutes(result["timeStamp"], MINUTES_TO_CHECK)
      ) {
        if (!mintCount.get(result["contractAddress"])) {
          mintCount.set(result["contractAddress"], {
            tokenIds: [result["tokenID"]],
            collectionName: result["tokenName"],
          });
        } else {
          const item = mintCount.get(result["contractAddress"]);
          item.tokenIds.push(result["tokenID"]);
        }
      }
    }
  }
  return mintCount;
};

const addFieldsToEmbed = (mintCountMap, embed, ownerName) => {
  let colNames = [];
  for (const [nftAddress, info] of mintCountMap.entries()) {
    const etherscanLink = `[Etherscan](${ETHERSCAN_ADDRESS_URL}/${nftAddress})`;
    const openseaLink = `[Opensea](${OPENSEA_URL}/${nftAddress}/${info.tokenIds[0]})`;
    embed.addField(
      `${info.collectionName} - Qty: ${info.tokenIds.length}`,
      `${etherscanLink} - ${openseaLink}`
    );
    colNames.push(info.collectionName);
  }
  embed.setDescription(
    `${ownerName} minted ${colNames} in the last ${MINUTES_TO_CHECK} minutes`
  );
};

const getFollowingListAsMessage = (serverId) => {
  const addressMap = cache.get(serverId).addressMap;
  const exampleEmbed = getFollowingInfoEmbed(addressMap.size);
  let index = 1;
  addressMap.forEach((value, key) => {
    exampleEmbed.addField(
      `${index}. ${value}`,
      `[${key}](${ETHERSCAN_ADDRESS_URL}/${key})`
    );
    index++;
  });
  return exampleEmbed;
};

client.once("ready", () => {
  console.log(`Online as ${client.user.tag}`);
  client.user.setActivity("Candy Crush");
});

client.on("guildCreate", (guild) => {
  console.log(`Joined a new guild: ${guild.name} - ${guild.id}`);
  mongo.save(serverId, {});
});

client.on("messageCreate", async (msg) => {
  const { content, channel, guild } = msg;
  let data = cache.get(guild.id);
  if (!data) {
    data = await mongo.find(guild.id);
    if (!data) {
      data = {};
    }
    cache.set(guild.id, data);
  }

  if (content === "!help") {
    msg.reply({ embeds: [getHelpEmbed()] });
  }

  if (
    content.startsWith("!") &&
    content !== "!help" &&
    content !== "!alertHere" &&
    content !== "!infoHere" &&
    !data.alertChannelId
  ) {
    msg.reply(
      "You need to set a channel for the alerts by using the `!alertHere` command."
    );
    msg.reply(
      "You can also set a channel for other info using the `!infoHere` command"
    );
    return;
  }

  if (content === "!alertHere") {
    data.alertChannelId = channel.id;
    mongo.save(guild.id, {
      alertChannelId: data.alertChannelId,
    });
    msg.reply(`Alert channel set to <#${data.alertChannelId}>.`);
  }

  if (content === "!infoHere") {
    data.infoChannelId = channel.id;
    mongo.save(guild.id, {
      infoChannelId: data.infoChannelId,
    });
    msg.reply(`Info channel set to <#${data.infoChannelId}>.`);
  }

  if (content === "!info") {
    msg.reply({
      embeds: [getInfoEmbed(data.alertChannelId, data.infoChannelId)],
    });
  }

  if (content === "!who") {
    msg.reply({ embeds: [getFollowingListAsMessage(guild.id)] });
  }

  if (content.startsWith("!add")) {
    const tokens = content.split(" ");
    if (tokens.length !== 3) {
      msg.reply("Message needs to be in format `!add <address> <name>`!");
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

  if (content.startsWith("!remove")) {
    const tokens = content.split(" ");
    if (tokens.length !== 2) {
      msg.reply("Message needs to be in format `!remove <address>`!");
      return;
    }
    const address = tokens[1];
    if (!data.addressMap || data.addressMap.size === 0) {
      msg.reply(
        "You are currently not following any ETH addresses. Use the `!add` command to add some."
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

  if (content === "!toggle") {
    if (!data.addressMap || data.addressMap.size === 0) {
      msg.reply(
        "You are currently not following any ETH addresses. Use the `!add` command to add some."
      );
      return;
    }
    if (data.areScheduledMessagesOn) {
      client.user.setActivity("Candy Crush");
      data.areScheduledMessagesOn = false;
      mongo.save(guild.id, { areScheduledMessagesOn: false });
      data.scheduledMessage.stop();
      msg.reply("Turned scheduled messages off.");
      console.log("Turned scheduled messages off.");
    } else {
      client.user.setActivity("the specified wallets", { type: "WATCHING" });
      data.areScheduledMessagesOn = true;
      mongo.save(guild.id, { areScheduledMessagesOn: true });
      data.scheduledMessage = new cron.CronJob(CRON_STRING, async () => {
        getMintedForFollowingAddresses(guild.id, data);
      });
      data.scheduledMessage.start();
      msg.reply("Turned scheduled messages on.");
      console.log("Turned scheduled messages on.");
    }
  }
});

client.login(process.env.DISCORD_API_SECRET);
