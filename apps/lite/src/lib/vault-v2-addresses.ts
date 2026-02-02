import { type Address } from "viem";
import { arbitrum, base, mainnet } from "wagmi/chains";

/**
 * Known Vault V2 addresses per chain, sourced from the Morpho API metadata.
 * This serves as the vault discovery mechanism for V2 vaults until factory
 * event indexing is available.
 *
 * See: https://github.com/morpho-org/morpho-blue-api-metadata
 */
export const VAULT_V2_ADDRESSES: Record<number, Address[]> = {
  [mainnet.id]: ["0x14A90D27338f40E22E1458A92934061cCAe144fC"],
  [base.id]: [],
  [arbitrum.id]: ["0xdE072b494d757041548F2c9c95DCf2B7F12F55b9"],
};
