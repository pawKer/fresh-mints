import mongoose from "mongoose";
class Database {
  constructor(uri: string) {
    mongoose.connect(uri, { keepAlive: true });
    mongoose.connection.on(
      "error",
      console.error.bind(console, "connection error: ")
    );
    mongoose.connection.once("open", function () {
      console.log("Connected to MongoDb successfully");
    });
  }
}
export default Database;
