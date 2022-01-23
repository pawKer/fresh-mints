import { MessageEmbed } from "discord.js";

const getErrorEmbed = (
  name: string,
  address: string,
  errorCode: string,
  minutesToCheck: number
): MessageEmbed => {
  return new MessageEmbed()
    .setColor("#FF0000")
    .setTitle(name)
    .setURL(`https://etherscan.io/address/${address}`)
    .setDescription(
      `Failed to fetch results for last ${minutesToCheck} minutes. Error code/reason: ${errorCode}`
    )
    .setTimestamp();
};

const getBasicMintInfoEmbed = (name: string, address: string): MessageEmbed => {
  return new MessageEmbed()
    .setColor("#7bbb57")
    .setTitle(`💸 - ${name}`)
    .setURL(`https://etherscan.io/address/${address}`)
    .setTimestamp();
};

const getBasicContractMintInfoEmbed = (
  name: string,
  address: string
): MessageEmbed => {
  return new MessageEmbed()
    .setColor("#FF7F50")
    .setTitle(`📜 - ${name}`)
    .setURL(`https://etherscan.io/address/${address}`)
    .setTimestamp();
};

const getFollowingInfoEmbed = (
  count: number,
  contractCount: number
): MessageEmbed => {
  return new MessageEmbed()
    .setColor("#7bbb57")
    .setTitle("Following list")
    .setDescription(
      `Currently watching ${count} addresses and ${contractCount} contracts.`
    )
    .setTimestamp();
};

const getNoUpdatesEmbed = (minutes: number): MessageEmbed => {
  return new MessageEmbed()
    .setColor("#FFFF00")
    .setTitle(`No updates in the last ${minutes} minutes`)
    .setTimestamp();
};

const getHelpEmbed = (): MessageEmbed => {
  return new MessageEmbed()
    .setColor("#7bbb57")
    .setTitle("Commands")
    .setDescription(`The following commands are available:`)
    .addFields(
      {
        name: "/alert-channel `<channel>`",
        value: "Sets the provided channel as the channel for the bot alerts.",
      },
      {
        name: "/info-channel `<channel>`",
        value: "Sets the provided channel as the channel for bot info.",
      },
      {
        name: "/add `<address>` `<nickname>`",
        value: "Adds new ETH wallet address to watchlist. ",
      },
      {
        name: "/add-contract `<address>` `<nickname>`",
        value: "Adds new ETH contract address to watchlist. ",
      },
      {
        name: "/remove `<address>`",
        value: "Removes ETH address from watchlist.",
      },
      {
        name: "/who",
        value: "Shows the addresses the bot is currently tracking.",
      },
      { name: "/toggle", value: "Starts/stops the scheduled messages." },
      {
        name: "/set-schedule `<minutes>`",
        value:
          "Sets the interval at which the bot will check the addresses. Needs to be between 1 and 60 minutes.",
      },
      {
        name: "/set-alert-role `@<role>`",
        value: "Sets a role that will be tagged when there is a new alert.",
      },
      {
        name: "/clear-alert-role",
        value: "Clears the alert role.",
      },
      {
        name: "/track-opensea-buys",
        value: "Toggle the tracking of NFTs bought on OpenSea.",
      },
      {
        name: "/info",
        value: "Displays the current server configuration.",
      },
      { name: "/help", value: "Get the list of all possible commands." }
    )
    .setTimestamp();
};

const getInfoEmbed = (
  alertChannelId: string | undefined,
  infoChannelId: string | undefined,
  schedule: string,
  alertRole: string | undefined | null,
  messagesStatus: boolean | undefined,
  trackOpenseaBuys?: boolean
): MessageEmbed => {
  const infoEmbed = new MessageEmbed()
    .setColor("#7bbb57")
    .setTitle("Config info")
    .setDescription(`These are the current bot settings:`)
    .addFields(
      {
        name: "Scheduled messages status",
        value: messagesStatus ? "ON 🟢" : "OFF 🔴",
      },
      {
        name: "Alert channel",
        value: `<#${alertChannelId}>`,
      },
      {
        name: "Info channel",
        value: infoChannelId ? `<#${infoChannelId}>` : "Not set.",
      },
      {
        name: "Schedule",
        value: `The bot will check the addresses: \`${schedule}\`.`,
      },
      {
        name: "Alert role",
        value: alertRole ? `<@&${alertRole}>` : "No role set.",
      },
      {
        name: "Tracking OpenSea Buys",
        value: trackOpenseaBuys ? "ON 🟢" : "OFF 🔴",
      }
    )
    .setTimestamp();
  return infoEmbed;
};

const getActivationEmbed = (): MessageEmbed => {
  const infoEmbed = new MessageEmbed()
    .setColor("#e81224")
    .setTitle("Server not activated")
    .setDescription(
      "This server is not currently activated. If you have an activation key use the `/activate` command to activate it. To get an activation key you need to get the Fresh Mints NFT and join the Discord server to verify ownership."
    )
    .addFields(
      {
        name: "OpenSea",
        value: "[Click here](https://opensea.io/collection/fresh-mints-bot)",
      },
      {
        name: "Discord",
        value: `[Click here](https://discord.gg/7EPagRsSCH)`,
      }
    )
    .setTimestamp();
  return infoEmbed;
};

export {
  getErrorEmbed,
  getBasicMintInfoEmbed,
  getFollowingInfoEmbed,
  getNoUpdatesEmbed,
  getHelpEmbed,
  getInfoEmbed,
  getBasicContractMintInfoEmbed,
  getActivationEmbed,
};
