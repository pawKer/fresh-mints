import { CronJob } from "cron";
import { Client, Collection } from "discord.js";
import {
  Command,
  IServerSettingsRepository,
  DiscordEvent,
  EthApiClient,
  RequestCacheItem,
  IActivationKeysRepository,
  ServerDataDTO,
} from ".";
import { MetricClient } from "../../src/metrics/metric-client";

interface ScheduledJobData {
  wallets: CronJob;
}
interface DiscordClient extends Client {
  commands: Collection<string, Command>;
  events: Collection<string, DiscordEvent>;
  scheduledJobs: Collection<string, ScheduledJobData>;
  serverCache: Collection<string, ServerDataDTO>;
  requestCache: Collection<string, RequestCacheItem>;
  db: IServerSettingsRepository;
  activationKeysDb: IActivationKeysRepository;
  apiClient: EthApiClient;
  metrics: MetricClient;
  useEtherscan: boolean;
  MAINTAINANCE_MODE: boolean;
}
