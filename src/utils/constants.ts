class BotConstants {
  static readonly ETHERSCAN_ADDRESS_URL: string =
    "https://etherscan.io/address";
  static readonly ETHERSCAN_TX_URL: string = "https://etherscan.io/tx";
  static readonly OPENSEA_URL: string = "https://opensea.io/assets";
  static readonly OWNER_ID: string = "<OWNER-ID>";
  static readonly DEFAULT_SCHEDULE: string = "* * * * *";
  static readonly DEFAULT_MINUTES_TO_CHECK: number = 6;
  static readonly BLACK_HOLE_ADDRESS: string =
    "0x0000000000000000000000000000000000000000";
  static readonly TEST_GUILD_ID = "<TEST-SERVER-ID>";
  static readonly TEST_BOT_ID = "<TEST-BOT-ID>";
  static readonly PROD_BOT_ID = "<PROD-BOT-ID>";
  static readonly ADDRESS_FOLLOW_LIMIT = 50;
}
export default BotConstants;
