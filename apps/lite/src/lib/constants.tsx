import { SafeLink } from "@morpho-org/uikit/components/safe-link";
import { type Deployments } from "@morpho-org/uikit/lib/deployments";
import { ReactNode } from "react";
import { hemi, mainnet } from "wagmi/chains";

export const APP_DETAILS = {
  // NOTE: Should always match the title in `index.html` (won't break anything, but should be correct)
  name: import.meta.env.VITE_APP_TITLE,
  description: "A minimal and open-source version of the main Morpho App",
  url: "https://lite.havenfi.co",
  icon: "/favicon.svg",
};

export const WORDMARK = ""; // Replace with "/your-wordmark.svg" to customize interface

export const MIN_TIMELOCK = 3 * 24 * 60 * 60; // For filtering vaults

export const DEFAULT_CHAIN = mainnet;

export const TRANSACTION_DATA_SUFFIX = "0x117E"; // (L I T E)

export const TERMS_OF_USE = "https://cdn.morpho.org/documents/Morpho_Terms_of_Use.pdf";
export const RISKS_DOCUMENTATION = "https://docs.morpho.org/learn/resources/risks/";
export const ADDRESSES_DOCUMENTATION = "https://docs.morpho.org/getting-started/resources/addresses/";
export const SHARED_LIQUIDITY_DOCUMENTATION = "https://docs.morpho.org/build/borrow/concepts/public-allocator";

export const BANNERS: Record<keyof Deployments, { color: string; text: ReactNode }> = {
  [hemi.id]: {
    color: "bg-[rgb(238,117,53)]",
    text: (
      <span className="grow py-2 text-center text-black">
        Access additional features and explore incentives via the interface offered by{" "}
        <SafeLink className="underline" href="https://morpho.solera.market/earn?chains=Hemi">
          Solera
        </SafeLink>
        .
      </span>
    ),
  },
};
