import mongoose from "mongoose";
import { MongoResult, ServerDataDTO } from ".";
export interface DatabaseRepository {
  db: mongoose.Connection;
  find(serverId: string): Promise<MongoResult | null>;
  findAllStartedJobs(): Promise<MongoResult[]>;
  save(serverId: string, data: ServerDataDTO): Promise<void>;
}
