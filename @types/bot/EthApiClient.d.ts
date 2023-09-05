import { EthApiResponse } from ".";
import { MetricClient } from "../../src/metrics/metric-client";
export interface EthApiClient {
  API_REQUEST_COUNT: number;
  NAME: string;
  getApiResponseAsMap(
    serverId: string,
    address: string,
    minutesToCheck: number,
    metricsClient: MetricClient,
    isContract?: boolean
  ): Promise<EthApiResponse>;
}
