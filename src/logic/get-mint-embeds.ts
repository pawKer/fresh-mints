import { MessageEmbed } from "discord.js";
import { MintCountResponse } from "../../@types/bot";
import {
  getBasicContractMintInfoEmbed,
  getBasicMintInfoEmbed,
} from "../embeds/embeds";
import BotConstants from "../utils/constants";

const getMintEmbeds = (
  mintCountResp: MintCountResponse,
  minutesToCheck: number,
  trackOpenseaBuys?: boolean,
  isContract?: boolean
): MessageEmbed[] => {
  const { forAddress, forAddressData, mintCount, osMintCount } = mintCountResp;
  const mintCountMaps = [mintCount, osMintCount];
  const embedsToReturn = [];

  let maxIndex = 0;
  if (trackOpenseaBuys && !isContract) {
    maxIndex = 1;
  }

  for (let i = 0; i <= maxIndex; i++) {
    let embed: MessageEmbed;
    if (isContract) {
      embed = getBasicContractMintInfoEmbed(forAddressData.name, forAddress);
    } else {
      embed = getBasicMintInfoEmbed(forAddressData.name, forAddress);
    }

    embed.setFooter(forAddressData.lastIdRead || "");
    const collectionNames: string[] = [];
    for (const [nftAddress, info] of mintCountMaps[i].entries()) {
      const etherscanLink = `[Etherscan](${BotConstants.ETHERSCAN_ADDRESS_URL}/${nftAddress})`;
      const openseaLink = `[Opensea](${
        BotConstants.OPENSEA_URL
      }/${nftAddress}/${info.tokenIds[0] || "1"})`;
      const etherscanTxLink = `[Etherscan TX](${BotConstants.ETHERSCAN_TX_URL}/${info.txHashes[0]})`;

      let collectionName;
      if (info.collectionName) {
        collectionName = info.collectionName;
        collectionNames.push(collectionName);
      } else {
        collectionName = "<Name not available>";
      }

      const fieldTitle = `${collectionName} - Qty: ${info.tokenIds.length}`;

      embed.addField(
        fieldTitle,
        `${etherscanLink} - ${openseaLink} - ${etherscanTxLink}`
      );
    }
    if (mintCountMaps[i].size > 0) {
      const names =
        collectionNames.length > 0 ? collectionNames.join(", ") : "these";
      if (i === 1) {
        embed.setDescription(
          `Bought ${names} on OpenSea in the last ${minutesToCheck} minutes`
        );
      } else {
        if (isContract) {
          embed.setDescription(
            `${names} was minted in the last ${minutesToCheck} minutes`
          );
        } else {
          embed.setDescription(
            `Minted ${names} in the last ${minutesToCheck} minutes`
          );
        }
      }
      embedsToReturn.push(embed);
    }
  }
  return embedsToReturn;
};
export { getMintEmbeds };
