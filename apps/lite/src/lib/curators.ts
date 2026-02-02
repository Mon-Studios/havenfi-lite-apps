import { Address, isAddressEqual } from "viem";
import { arbitrum, base, mainnet } from "wagmi/chains";

import { graphql, FragmentOf } from "@/graphql/graphql";

export const CuratorFragment = graphql(`
  fragment Curator on Curator @_unmask {
    addresses {
      address
      chainId
    }
    image
    name
    url
  }
`);

export const MANUALLY_WHITELISTED_CURATORS: FragmentOf<typeof CuratorFragment>[] = [
  {
    addresses: [
      /*
      { address: "0x6D3AB84Fb7Fc04961a15663C980feC275b889402", chainId: customChains.tac.id },
      { address: "0xd6316AE37dDE77204b9A94072544F1FF9f3d6d54", chainId: plumeMainnet.id },
      { address: "0x4681fbeD0877815D5869Cf16e8A6C6Ceee365c02", chainId: lisk.id },
      { address: "0x6D3AB84Fb7Fc04961a15663C980feC275b889402", chainId: soneium.id },
      { address: "0xD8B0F4e54a8dac04E0A57392f5A630cEdb99C940", chainId: worldchain.id },
       */
      { address: "0x143524bd8938e375445767BFe3960Ddf58FfaC77", chainId: base.id },
      { address: "0x143524bd8938e375445767BFe3960Ddf58FfaC77", chainId: arbitrum.id },
      { address: "0x143524bd8938e375445767BFe3960Ddf58FfaC77", chainId: mainnet.id },
    ],
    image: "https://cdn.morpho.org/v2/assets/images/re7.png",
    name: "HavenFi",
    url: "https://havenfi.co/",
  },
];

export const ADDITIONAL_OFFCHAIN_CURATORS: Record<Address, DisplayableCurators> = {};

export type DisplayableCurators = {
  [name: string]: {
    name: string;
    roles: { name: string; address: Address }[];
    url: string | null;
    imageSrc: string | null;
    shouldAlwaysShow: boolean;
  };
};

const ROLE_NAMES = ["owner", "curator", "guardian"] as const;
export function getDisplayableCurators(
  vault: { [role in (typeof ROLE_NAMES)[number]]: Address } & { address: Address },
  curators: FragmentOf<typeof CuratorFragment>[],
  chainId: number | undefined,
) {
  const result: DisplayableCurators = {};
  for (const roleName of ROLE_NAMES) {
    for (const curator of curators) {
      const address = curator.addresses?.find(
        (entry) => entry.chainId === chainId && isAddressEqual(entry.address as Address, vault[roleName]),
      )?.address as Address | undefined;
      if (!address) continue;

      const roleNameCapitalized = `${roleName.charAt(0).toUpperCase()}${roleName.slice(1)}`;
      const shouldAlwaysShow = roleName === "owner" || roleName === "curator";
      if (result[curator.name]) {
        result[curator.name].shouldAlwaysShow ||= shouldAlwaysShow;
        result[curator.name].roles.push({ name: roleNameCapitalized, address });
      } else {
        result[curator.name] = {
          name: curator.name,
          roles: [{ name: roleNameCapitalized, address }],
          url: curator.url,
          imageSrc: curator.image,
          shouldAlwaysShow,
        };
      }
    }
  }
  if (ADDITIONAL_OFFCHAIN_CURATORS[vault.address]) {
    return { ...result, ...ADDITIONAL_OFFCHAIN_CURATORS[vault.address] };
  }
  return result;
}
