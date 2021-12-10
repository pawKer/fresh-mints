import mongoose from "mongoose";
import { MongoResult, ServerDataDTO } from "../../@types/bot";

const reqString: mongoose.SchemaDefinitionProperty = {
  type: String,
  required: true,
};
const noReqstring: mongoose.SchemaDefinitionProperty = {
  type: String,
  required: false,
};
const ServerSettingsSchema: mongoose.Schema<MongoResult> =
  new mongoose.Schema<MongoResult>({
    _id: reqString,
    alertChannelId: noReqstring,
    infoChannelId: noReqstring,
    areScheduledMessagesOn: {
      type: Boolean,
      default: false,
    },
    addressMap: Map,
    minutesToCheck: Number,
    schedule: String,
    alertRole: String,
    guildName: String,
    contractMap: Map,
  });

const ServerSettings: mongoose.Model<MongoResult> = mongoose.model<MongoResult>(
  "server-settings",
  ServerSettingsSchema
);

export { ServerSettings };
