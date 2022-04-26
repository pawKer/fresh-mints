import { ActivationKeyDTO, MongoResultActivationKeys } from "../../@types/bot";
import { IActivationKeysRepository } from "../../@types/bot/IActivationKeysRepository";
import { ActivationKeys } from "../db-models/activation-keys";
import { MetricClient } from "../metrics/metric-client";

class ActivationKeysRepository implements IActivationKeysRepository {
  #metricClient: MetricClient;

  constructor(metricClient: MetricClient) {
    this.#metricClient = metricClient;
  }

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
      this.#metricClient.exposeKeyDbError(
        userId,
        `Failed to retrieve activation key for user: ${error.message}`
      );
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
      this.#metricClient.exposeKeyDbError(
        data.userId,
        `Failed to save activation key for user: ${error.message}`
      );
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
      this.#metricClient.exposeGenericDbError(
        `[actKey: ${id}] - Error saving activation key state.`
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
      this.#metricClient.exposeGenericDbError(
        `[serverId: ${serverId}] - Error saving activation key state.`
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
      this.#metricClient.exposeGenericDbError(
        `[actKey: ${id}] Failed to find activation key by id: ${error.message}`
      );
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
      this.#metricClient.exposeGenericDbError(
        `Failed to get all used activation keys: ${error.message}`
      );
      throw error;
    }
  }
}
export { ActivationKeysRepository };
