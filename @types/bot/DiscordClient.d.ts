import { Client, Collection } from "discord.js";
import {
  Command,
  DatabaseRepository,
  DiscordEvent,
  EthApiClient,
  ServerData,
  WalletCacheItem,
} from ".";
interface DiscordClient extends Client {
  commands: Collection<string, Command>;
  events: Collection<string, DiscordEvent>;
  serverCache: Collection<string, ServerData>;
  requestCache: Collection<string, WalletCacheItem>;
  db: DatabaseRepository;
  apiClient: EthApiClient;
  useEtherscan: boolean;
}
