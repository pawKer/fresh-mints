import mongoose from "mongoose";

const reqString = {
  type: String,
  required: true,
};
const noReqstring = {
  type: String,
  required: false,
};
const ServerSettingsSchema = new mongoose.Schema({
  _id: reqString,
  alertChannelId: noReqstring,
  infoChannelId: noReqstring,
  areScheduledMessagesOn: {
    type: Boolean,
    default: false,
  },
  addressMap: Map,
});

const ServerSettings = mongoose.model("server-settings", ServerSettingsSchema);

export { ServerSettings };
