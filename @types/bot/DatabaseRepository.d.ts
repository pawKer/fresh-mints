import { MongoResult, ServerDataDTO } from ".";
export interface IServerSettingsRepository {
  find(serverId: string): Promise<MongoResult | null>;
  findAllStartedJobs(): Promise<MongoResult[]>;
  save(serverId: string, data: ServerDataDTO): Promise<void>;
}
