import { ServerDataDTO } from ".";

export interface MongoResult extends ServerDataDTO {
  _id: string;
  __v: number;
}
