import { Client, Collection } from "discord.js";
import {
  Command,
  DatabaseRepository,
  DiscordEvent,
  EthApiClient,
  ServerData,
  RequestCacheItem,
} from ".";
interface DiscordClient extends Client {
  commands: Collection<string, Command>;
  events: Collection<string, DiscordEvent>;
  serverCache: Collection<string, ServerData>;
  requestCache: Collection<string, RequestCacheItem>;
  contractRequestCache: Collection<string, RequestCacheItem>;
  db: DatabaseRepository;
  apiClient: EthApiClient;
  useEtherscan: boolean;
}
