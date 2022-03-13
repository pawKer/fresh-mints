import { TextChannel } from "discord.js";
import { DiscordClient } from "../../@types/bot";
import { AddressData } from "../../@types/bot/ServerDataDTO";
import { getErrorEmbed } from "../embeds/embeds";
import { getMintEmbeds } from "./get-mint-embeds";
import { getMintsForAddress } from "./get-mints-for-address";

const checkAndSendUpdates = async (
  client: DiscordClient,
  address: string,
  data: AddressData,
  minutesToCheck: number,
  serverId: string,
  alertChannel: TextChannel,
  infoChannel?: TextChannel,
  trackOpenseaBuys?: boolean
): Promise<string | undefined> => {
  try {
    const mintCountResp = await getMintsForAddress(
      client,
      address,
      data,
      minutesToCheck,
      serverId,
      infoChannel,
      data.isContract
    );

    if (!mintCountResp) return;

    const embedsToSend = getMintEmbeds(
      mintCountResp,
      minutesToCheck,
      trackOpenseaBuys,
      mintCountResp.forAddressData.isContract
    );

    if (embedsToSend.length > 0) {
      for (const embed of embedsToSend) {
        await alertChannel.send({ embeds: [embed] });
      }
      return data.name;
    }
    return;
  } catch (e) {
    console.error(`[${serverId}] [${address}] BOT_ERROR`, e);
    infoChannel &&
      infoChannel.send({
        embeds: [getErrorEmbed(data.name, address, e.message, minutesToCheck)],
      });
  }
};
export { checkAndSendUpdates };
