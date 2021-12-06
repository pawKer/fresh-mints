import { Client, Collection, Intents } from "discord.js";
import dotenv from "dotenv";
import MongoDb from "./mongo";
import {
  DatabaseRepository,
  ServerData,
  EthApiClient,
  WalletCacheItem,
} from "../@types/bot";
import EtherscanClient from "./api-clients/etherscan-client";
import CovalentClient from "./api-clients/covalent-client";
import { readCommands, readEvents } from "./utils/utils";
dotenv.config();

const MONGO_URI = `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@cluster0.fx8o1.mongodb.net/nft-bot?retryWrites=true&w=majority`;
const mongo: DatabaseRepository = new MongoDb(MONGO_URI);

let apiClient: EthApiClient = new CovalentClient();

const serverCache: Collection<string, ServerData> = new Collection();
const requestCache: Collection<string, WalletCacheItem> = new Collection();

const client: any = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

client.commands = new Collection();
client.events = new Collection();
client.serverCache = serverCache;
client.requestCache = requestCache;
client.db = mongo;
client.apiClient = apiClient;
client.useEtherscan = false;

readCommands().then((commands) => {
  commands.forEach((cmd) => {
    client.commands.set(cmd.data.name, cmd);
  });
});

readEvents().then((events) => {
  events.forEach((ev) => {
    console.log(ev);
    if (ev.once) {
      client.once(ev.name, (...args: any[]) => ev.execute(...args));
    } else {
      client.on(ev.name, (...args: any[]) => ev.execute(...args));
    }
  });
});

client.login(process.env.DISCORD_API_SECRET);
