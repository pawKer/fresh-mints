interface DecodedParams {
  name: string;
  type: string;
  indexed: boolean;
  decoded: boolean;
  value: string;
}

interface CovalentLogEvents {
  block_signed_at: string;
  block_height: number;
  tx_offset: number;
  log_offset: number;
  tx_hash: string;
  _raw_log_topics_bytes: string | null;
  raw_log_topics: string[];
  sender_contract_decimals: number;
  sender_name: string;
  sender_contract_ticker_symbol: string;
  sender_address: string;
  sender_address_label: string | null;
  sender_logo_url: string;
  raw_log_data: string;
  decoded: {
    name: string;
    signature: string;
    params: DecodedParams[];
  };
}

interface CovalentApiResultDataItem {
  block_signed_at: string;
  block_height: number;
  tx_hash: string;
  tx_offset: number;
  successful: boolean;
  from_address: string;
  from_address_label: string | null;
  to_address: string;
  to_address_label: string | null;
  value: string;
  value_quote: number;
  gas_offered: number;
  gas_spent: number;
  gas_price: number;
  gas_quote: number;
  gas_quote_rate: number;
  log_events: CovalentLogEvents[];
}

interface CovalentApiResultData {
  address: string;
  updated_at: string;
  next_update_at: string;
  quote_currency: string;
  chain_id: number;
  items: CovalentApiResultDataItem[];
  patgination: {
    has_more: boolean;
    page_number: number;
    page_size: number;
    total_count: number | null;
  };
}

export interface CovalentApiResult {
  data: CovalentApiResultData;
  error: boolean;
  error_message: string | null;
  error_code: number | string | null;
}
