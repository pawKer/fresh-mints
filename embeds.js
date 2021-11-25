import { MessageEmbed } from "discord.js";
const getErrorEmbed = (name, address, errorCode, minutesToCheck) => {
  return new MessageEmbed()
    .setColor("#FF0000")
    .setTitle(name)
    .setURL(`https://etherscan.io/address/${address}`)
    .setAuthor("Vary Gee BOT")
    .setDescription(
      `Failed to fetch results for last ${minutesToCheck} minutes. Error code/reason: ${errorCode}`
    )
    .setTimestamp();
};

const getBasicMintInfoEmbed = (name, address, minutesToCheck) => {
  return new MessageEmbed()
    .setColor("#0099ff")
    .setTitle(name)
    .setURL(`https://etherscan.io/address/${address}`)
    .setAuthor("Vary Gee BOT")
    .setTimestamp();
};

const getFollowingInfoEmbed = (count) => {
  return new MessageEmbed()
    .setColor("#0099ff")
    .setTitle("Minting updates")
    .setAuthor("Vary Gee BOT")
    .setDescription(`Currently watching ${count} addresses:`)
    .setTimestamp();
};

const getNoUpdatesEmbed = (minutes) => {
  return new MessageEmbed()
    .setColor("#FFFF00")
    .setTitle(`No updates in the last ${minutes} minutes`)
    .setAuthor("Vary Gee BOT")
    .setTimestamp();
};

export {
  getErrorEmbed,
  getBasicMintInfoEmbed,
  getFollowingInfoEmbed,
  getNoUpdatesEmbed,
};
