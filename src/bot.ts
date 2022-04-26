import { Client, Collection, Intents } from "discord.js";
import dotenv from "dotenv";
import {
  ServerDataDTO,
  EthApiClient,
  RequestCacheItem,
  Command,
  DiscordEvent,
  DiscordClient,
} from "../@types/bot";
import CovalentClient from "./api-clients/covalent-client";
import { readCommands, readEvents } from "./utils/utils";
import Database from "./db";
import ServerSettingsRepository from "./repositories/server-settings-repository";
import { ActivationKeysRepository } from "./repositories/activation-keys-repository";
import { ScheduledJobData } from "../@types/bot/DiscordClient";
import { MetricServer } from "./metrics/metric-server";
import { MetricClient } from "./metrics/metric-client";
dotenv.config();

const metricClient = new MetricClient();
const metricServer = new MetricServer(metricClient.getRegister());

const MONGO_URI = `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@cluster0.fx8o1.mongodb.net/nft-bot?retryWrites=true&w=majority`;
const mongo = new Database(MONGO_URI);

const apiClient: EthApiClient = new CovalentClient();
const serverCache: Collection<string, ServerDataDTO> = new Collection();
const requestCache: Collection<string, RequestCacheItem> = new Collection();

const client: DiscordClient = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
}) as DiscordClient;

client.commands = new Collection<string, Command>();
client.events = new Collection<string, DiscordEvent>();
client.scheduledJobs = new Collection<string, ScheduledJobData>();
client.serverCache = serverCache;
client.requestCache = requestCache;
client.db = new ServerSettingsRepository(metricClient);
client.activationKeysDb = new ActivationKeysRepository(metricClient);
client.apiClient = apiClient;
client.metrics = metricClient;
client.useEtherscan = false;
client.MAINTAINANCE_MODE = false;

readCommands().then((commands) => {
  commands.forEach((cmd) => {
    if (client && client.commands) client.commands.set(cmd.data.name, cmd);
  });
});

readEvents().then((events) => {
  events.forEach((ev) => {
    console.log(ev);
    if (ev.once) {
      client.once(ev.name, (...args: unknown[]) => ev.execute(...args));
    } else {
      client.on(ev.name, (...args: unknown[]) => ev.execute(...args));
    }
  });
});

metricServer.start();
client.login(process.env.DISCORD_API_SECRET);
