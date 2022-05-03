import { collectDefaultMetrics, Registry } from "prom-client";
import promClient from "prom-client";
export class MetricClient {
  #register: Registry;

  #apiCallsCounter = new promClient.Counter({
    name: "covalent_api_calls",
    help: "Number of api calls to Covalent",
    labelNames: ["guildId", "address"],
  });

  #apiErrorsCounter = new promClient.Counter({
    name: "covalent_api_errors",
    help: "Number of api errors from Covalent",
    labelNames: ["guildId", "address", "statusCode", "errorMessage"],
  });

  #dbErrorsCounter = new promClient.Counter({
    name: "db_errors",
    help: "Number of database errors",
    labelNames: ["guildId", "errorMessage"],
  });

  #keyDbErrorsCounter = new promClient.Counter({
    name: "key_db_errors",
    help: "Number of activation key database errors",
    labelNames: ["userId", "errorMessage"],
  });

  constructor() {
    this.#register = new Registry();
    collectDefaultMetrics({ register: this.#register });
    this.#apiCallsCounter.inc(0);
    this.#apiErrorsCounter.inc(0);
    this.#dbErrorsCounter.inc(0);
    this.#keyDbErrorsCounter.inc(0);
    this.#register.registerMetric(this.#apiCallsCounter);
    this.#register.registerMetric(this.#apiErrorsCounter);
    this.#register.registerMetric(this.#dbErrorsCounter);
    this.#register.registerMetric(this.#keyDbErrorsCounter);
  }

  exposeApiCall(guildId: string, address: string) {
    this.#apiCallsCounter.labels({ guildId, address }).inc();
  }

  exposeApiError(
    guildId: string,
    address: string,
    statusCode: number,
    errorMessage: string
  ) {
    this.#apiErrorsCounter
      .labels({ guildId, address, statusCode, errorMessage })
      .inc();
  }

  exposeDbError(guildId: string, errorMessage: string) {
    this.#dbErrorsCounter.labels({ guildId, errorMessage }).inc();
  }

  exposeGenericDbError(errorMessage: string) {
    this.#dbErrorsCounter.labels({ errorMessage }).inc();
  }

  exposeKeyDbError(userId: string | undefined, errorMessage: string) {
    this.#keyDbErrorsCounter.labels({ userId, errorMessage }).inc();
  }

  getRegister() {
    return this.#register;
  }
}
