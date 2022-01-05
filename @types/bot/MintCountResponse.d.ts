import { MintCountObject } from ".";
import { AddressData } from "./ServerDataDTO";

export interface MintCountResponse {
  // TODO: The address info can probably be removed, have access to it from for loop
  forAddress: string;
  forAddressData: AddressData;
  mintCount: Map<string, MintCountObject>;
  osMintCount: Map<string, MintCountObject>;
}
