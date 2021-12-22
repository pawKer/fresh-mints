import { Client, Collection } from "discord.js";
import {
  Command,
  IServerSettingsRepository,
  DiscordEvent,
  EthApiClient,
  ServerData,
  RequestCacheItem,
  IActivationKeysRepository,
} from ".";
interface DiscordClient extends Client {
  commands: Collection<string, Command>;
  events: Collection<string, DiscordEvent>;
  serverCache: Collection<string, ServerData>;
  requestCache: Collection<string, RequestCacheItem>;
  db: IServerSettingsRepository;
  activationKeysDb: IActivationKeysRepository;
  apiClient: EthApiClient;
  useEtherscan: boolean;
}
