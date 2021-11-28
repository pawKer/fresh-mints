import mongoose from "mongoose";
import { ServerSettings } from "./models.js";
import { DatabaseRepository, ServerDataDTO, MongoResult } from "../@types/bot";

class MongoDb implements DatabaseRepository {
  db: mongoose.Connection;
  constructor(uri: string) {
    mongoose.connect(uri);
    this.db = mongoose.connection;
    this.db.on("error", console.error.bind(console, "connection error: "));
    this.db.once("open", function () {
      console.log("Connected to MongoDb successfully");
    });
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
      console.log("Saved server settings!");
    } catch (error) {
      console.error(error);
    }
  }

  async find(serverId: string): Promise<MongoResult | null> {
    let res: MongoResult | null;
    try {
      res = await ServerSettings.findOne({
        _id: serverId,
      });
      console.log("Fetched data from DB");
      return res;
    } catch (error) {
      console.error(error);
    }
    return Promise.reject();
  }

  async findAllStartedJobs(): Promise<MongoResult[]> {
    let res: MongoResult[];
    try {
      res = await ServerSettings.find({ areScheduledMessagesOn: true });
      return res;
    } catch (error) {
      console.error(error);
    }
    return Promise.reject();
  }
}
export default MongoDb;
