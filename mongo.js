import mongoose from "mongoose";
import { ServerSettings } from "./models.js";

class MongoDb {
  constructor(uri) {
    mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    this.db = mongoose.connection;
    this.db.on("error", console.error.bind(console, "connection error: "));
    this.db.once("open", function () {
      console.log("Connected to MongoDb successfully");
    });
  }
  async save(serverId, serverSettings) {
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

  async find(serverId) {
    let res;
    try {
      res = await ServerSettings.findOne({
        _id: serverId,
      });
    } catch (error) {
      console.error(error);
    }
    return res;
  }
}
export default MongoDb;
