import { ServerSettings } from "../db-models/server-settings";
import {
  ServerDataDTO,
  MongoResult,
  IServerSettingsRepository,
} from "../../@types/bot";

class ServerSettingsRepository implements IServerSettingsRepository {
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
    }
    return Promise.reject();
  }
}
export default ServerSettingsRepository;
