import { ActivationKeyDTO } from ".";

export interface MongoResultActivationKeys extends ActivationKeyDTO {
  _id: string;
  __v: number;
}
