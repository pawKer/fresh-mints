import { ActivationKeyDTO, MongoResultActivationKeys } from "../../@types/bot";
import { IActivationKeysRepository } from "../../@types/bot/IActivationKeysRepository";
import { ActivationKeys } from "../db-models/activation-keys";

class ActivationKeysRepository implements IActivationKeysRepository {
  async findByUserId(
    userId: string
  ): Promise<MongoResultActivationKeys | null> {
    let res: MongoResultActivationKeys | null;
    try {
      res = (await ActivationKeys.findOne({
        userId: userId,
      })) as MongoResultActivationKeys;
      console.log(`[user: ${userId}] - Fetched data from DB`);
      return res;
    } catch (error) {
      console.error(`user: ${userId}`, error);
      throw error;
    }
  }
  async save(id: string, data: ActivationKeyDTO): Promise<void> {
    try {
      await ActivationKeys.create({
        _id: id,
        ...data,
      });
      console.log(`[user: ${data.userId}] - Created new activation key!`);
    } catch (error) {
      console.error(`user: ${data.userId}`, error);
      throw error;
    }
  }

  async saveAndUpdate(id: string, data: ActivationKeyDTO): Promise<void> {
    try {
      await ActivationKeys.findOneAndUpdate(
        {
          _id: id,
        },
        data,
        {
          upsert: true,
        }
      );
      console.log(`[actKey: ${id}] - Saved activation key!`);
    } catch (error) {
      console.error(
        `[actKey: ${id}] - Error saving activation key state.`,
        error
      );
      throw error;
    }
  }

  async saveAndUpdateByServerId(
    serverId: string,
    data: ActivationKeyDTO
  ): Promise<void> {
    try {
      await ActivationKeys.findOneAndUpdate(
        {
          serverId: serverId,
        },
        data,
        {
          upsert: true,
        }
      );
      console.log(`[serverId: ${serverId}] - Saved / updated activation key!`);
    } catch (error) {
      console.error(
        `[serverId: ${serverId}] - Error saving activation key state.`,
        error
      );
      throw error;
    }
  }

  async find(id: string): Promise<MongoResultActivationKeys | null> {
    let res: MongoResultActivationKeys | null;
    try {
      res = (await ActivationKeys.findOne({
        _id: id,
      })) as MongoResultActivationKeys;
      console.log(`[actKey: ${id}] - Fetched data from DB`);
      return res;
    } catch (error) {
      console.error(`[actKey: ${id}[]`, error);
      throw error;
    }
  }

  async findAllUsedKeys(): Promise<MongoResultActivationKeys[] | null> {
    let res: MongoResultActivationKeys[] | null;
    try {
      res = (await ActivationKeys.find({
        used: true,
      })) as MongoResultActivationKeys[];
      console.log(`Fetched all used keys from DB.`);
      return res;
    } catch (error) {
      console.error(`Error fetching all used keys`, error);
      throw error;
    }
  }
}
export { ActivationKeysRepository };
