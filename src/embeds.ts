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
    .setColor("#0099ff")
    .setTitle(name)
    .setURL(`https://etherscan.io/address/${address}`)
    .setTimestamp();
};

const getFollowingInfoEmbed = (count: number): MessageEmbed => {
  return new MessageEmbed()
    .setColor("#0099ff")
    .setTitle("Minting updates")
    .setDescription(`Currently watching ${count} addresses:`)
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
    .setColor("#0099ff")
    .setTitle("Commands")
    .setDescription(`The following commands are available:`)
    .addFields(
      {
        name: ".alertHere",
        value: "Sets the current channel as the channel for the bot alerts.",
      },
      {
        name: ".infoHere",
        value: "Sets the current channel as the channel for bot info.",
      },
      {
        name: ".add `<address>` `<nickname>`",
        value: "Adds new ETH address to watchlist. ",
      },
      {
        name: ".remove `<address>`",
        value: "Removes ETH address to watchlist.",
      },
      {
        name: ".who",
        value: "Shows the addresses the bot is currently tracking.",
      },
      { name: ".toggle", value: "Starts/stops the scheduled messages." },
      {
        name: ".info",
        value: "Displays the current channels used for bot messages.",
      },
      { name: ".help", value: "Get the list of all possible commands." }
    )
    .setTimestamp();
};

const getInfoEmbed = (
  alertChannelId: string | undefined,
  infoChannelId: string | undefined
): MessageEmbed => {
  return new MessageEmbed()
    .setColor("#0099ff")
    .setTitle("Channel config info")
    .setDescription(`The following channels are being used for bot messages:`)
    .addFields(
      {
        name: "Alert channel",
        value: `<#${alertChannelId}>`,
      },
      {
        name: "Info channel",
        value: infoChannelId ? `<#${infoChannelId}>` : "Not set.",
      }
    )
    .setTimestamp();
};

export {
  getErrorEmbed,
  getBasicMintInfoEmbed,
  getFollowingInfoEmbed,
  getNoUpdatesEmbed,
  getHelpEmbed,
  getInfoEmbed,
};
