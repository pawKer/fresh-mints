export interface EtherscanParams {
  address?: string;
  module: string;
  action: string;
  page: number;
  offset: number;
  startblock: number;
  endblock: number;
  sort: string;
  apikey: string | undefined;
}
