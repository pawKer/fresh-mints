import { ServerSettings } from "../db-models/server-settings";
import {
  ServerDataDTO,
  MongoResult,
  IServerSettingsRepository,
} from "../../@types/bot";
import { MetricClient } from "../metrics/metric-client";

class ServerSettingsRepository implements IServerSettingsRepository {
  #metricClient: MetricClient;

  constructor(metricClient: MetricClient) {
    this.#metricClient = metricClient;
  }

  async save(serverId: string, serverSettings: ServerDataDTO): Promise<void> {
    try {
      await ServerSettings.findOneAndUpdate(
        {
          _id: serverId,
        },
        serverSettings,
        {
          upsert: true,
        }
      );
      console.log(`[${serverId}] - Saved server settings!`);
    } catch (error) {
      console.error(`${serverId}`, error);
      this.#metricClient.exposeDbError(
        serverId,
        "Failed to save server settings"
      );
    }
  }

  async find(serverId: string): Promise<MongoResult | null> {
    let res: MongoResult | null;
    try {
      res = (await ServerSettings.findOne({
        _id: serverId,
      })) as MongoResult;
      console.log(`[${serverId}] Fetched server data from DB`);
      return res;
    } catch (error) {
      console.error(`${serverId}`, error);
      this.#metricClient.exposeDbError(serverId, "Failed to fetch server data");
    }
    return Promise.reject();
  }

  async findAllStartedJobs(): Promise<MongoResult[]> {
    let res: MongoResult[];
    try {
      res = (await ServerSettings.find({
        areScheduledMessagesOn: true,
      })) as MongoResult[];
      return res;
    } catch (error) {
      console.error(error);
      this.#metricClient.exposeDbError(
        "",
        "Failed to retrieve all started jobs"
      );
    }
    return Promise.reject();
  }
}
export default ServerSettingsRepository;
