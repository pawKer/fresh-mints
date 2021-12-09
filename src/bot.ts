import { Client, Collection, Intents } from "discord.js";
import dotenv from "dotenv";
import MongoDb from "./mongo";
import {
  DatabaseRepository,
  ServerData,
  EthApiClient,
  RequestCacheItem,
  Command,
  DiscordEvent,
  DiscordClient,
} from "../@types/bot";
import EtherscanClient from "./api-clients/etherscan-client";
import CovalentClient from "./api-clients/covalent-client";
import { readCommands, readEvents } from "./utils/utils";
dotenv.config();

const MONGO_URI = `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@cluster0.fx8o1.mongodb.net/nft-bot?retryWrites=true&w=majority`;
const mongo: DatabaseRepository = new MongoDb(MONGO_URI);

const apiClient: EthApiClient = new CovalentClient();

const serverCache: Collection<string, ServerData> = new Collection();
const requestCache: Collection<string, RequestCacheItem> = new Collection();
const contractRequestCache: Collection<string, RequestCacheItem> =
  new Collection();

let client: DiscordClient;

const tempClient: any = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

tempClient.commands = new Collection<string, Command>();
tempClient.events = new Collection<string, DiscordEvent>();
tempClient.serverCache = serverCache;
tempClient.requestCache = requestCache;
tempClient.contractRequestCache = contractRequestCache;
tempClient.db = mongo;
tempClient.apiClient = apiClient;
tempClient.useEtherscan = false;

client = tempClient;

readCommands().then((commands) => {
  commands.forEach((cmd) => {
    if (client && client.commands) client.commands.set(cmd.data.name, cmd);
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
