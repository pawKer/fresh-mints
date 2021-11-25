import { Client, Intents } from "discord.js";
import dotenv from "dotenv";
import cron from "cron";
import axios from "axios";
import {
  getErrorEmbed,
  getBasicMintInfoEmbed,
  getFollowingInfoEmbed,
  getNoUpdatesEmbed,
} from "./embeds.js";
import { loadDefaultAddresses } from "./db.js";
dotenv.config();

const ETHERSCAN_ADDRESS_URL = "https://etherscan.io/address";
const ETHERSCAN_API_URL = "https://api.etherscan.io/api";
const OPENSEA_URL = "https://opensea.io/assets";

const SERVER_ID = process.env.SERVER_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;
const NOTHING_NEW_CHANNEL_ID = process.env.NOTHING_NEW_CHANNEL_ID;

const BLACK_HOLE_ADDRESS = "0x0000000000000000000000000000000000000000";

const ADDRESSES_TO_FOLLOW = loadDefaultAddresses();

const CRON_STRING = "* * * * *";
const MINUTES_TO_CHECK = 2;

let SCHEDULED_MSG = false;
let scheduledMessage;

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

const getMintedForFollowingAddresses = async () => {
  const guild = client.guilds.cache.get(SERVER_ID);
  const channel = guild.channels.cache.get(CHANNEL_ID);
  const no_updates_channel = guild.channels.cache.get(NOTHING_NEW_CHANNEL_ID);
  let noUpdates = true;
  for (const [address, name] of ADDRESSES_TO_FOLLOW.entries()) {
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
  if (noUpdates) {
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

const getFollowingListAsMessage = () => {
  const exampleEmbed = getFollowingInfoEmbed(ADDRESSES_TO_FOLLOW.size);
  let index = 1;
  ADDRESSES_TO_FOLLOW.forEach((value, key) => {
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
  scheduledMessage = new cron.CronJob(CRON_STRING, async () => {
    getMintedForFollowingAddresses();
  });
});

client.on("messageCreate", (msg) => {
  if (msg.content === "ping") {
    msg.reply("pong");
  }

  if (msg.content === "!who") {
    msg.reply({ embeds: [getFollowingListAsMessage()] });
  }

  if (msg.content === "!toggle") {
    if (SCHEDULED_MSG) {
      SCHEDULED_MSG = false;
      scheduledMessage.stop();
      msg.reply("Turned scheduled messages off.");
      console.log("Turned scheduled messages off.");
    } else {
      SCHEDULED_MSG = true;
      scheduledMessage.start();
      msg.reply("Turned scheduled messages on.");
      console.log("Turned scheduled messages on.");
    }
  }
});
console.log(ADDRESSES_TO_FOLLOW);
client.login(process.env.DISCORD_API_SECRET);
