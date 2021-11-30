import { ResultTransaction } from "./ResultTransaction";

export interface EtherscanApiResult {
  status: string;
  message: string;
  result: ResultTransaction[];
}
