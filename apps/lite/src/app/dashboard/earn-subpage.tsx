import { useMemo } from "react";
import { useOutletContext } from "react-router";
import { type Chain } from "viem";
import { useAccount } from "wagmi";

import { CtaCard } from "@/components/cta-card";
import { EarnTable } from "@/components/earn-table";
import { useVaultsV2 } from "@/hooks/use-vaults-v2";
import { getTokenURI } from "@/lib/tokens";

export function EarnSubPage() {
  const { status } = useAccount();
  const { chain } = useOutletContext() as { chain?: Chain };
  const chainId = chain?.id;

  const { rows, tokens, refetchPositions } = useVaultsV2({ chainId });

  const enrichedRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        asset: {
          ...row.asset,
          imageSrc: getTokenURI({ symbol: row.asset.symbol, address: row.asset.address, chainId }),
        },
      })),
    [rows, chainId],
  );

  const userRows = enrichedRows.filter((row) => (row.userShares ?? 0n) > 0n);

  if (status === "reconnecting") return undefined;

  return (
    <div className="flex min-h-screen flex-col px-2.5 pt-16">
      {status === "disconnected" ? (
        <div className="bg-linear-to-b flex w-full flex-col from-transparent to-white/[0.03] px-8 pb-20 pt-8">
          <CtaCard
            className="md:w-7xl flex flex-col gap-4 md:mx-auto md:max-w-full md:flex-row md:items-center md:justify-between"
            bigText="Earn on your terms"
            littleText="Connect wallet to get started"
            videoSrc={{
              mov: "https://cdn.morpho.org/v2/assets/videos/earn-animation.mov",
              webm: "https://cdn.morpho.org/v2/assets/videos/earn-animation.webm",
            }}
          />
        </div>
      ) : (
        userRows.length > 0 && (
          <div className="bg-linear-to-b lg:pt-22 flex h-fit w-full flex-col items-center from-transparent to-white/[0.03] pb-20">
            <EarnTable
              chain={chain}
              rows={userRows}
              depositsMode="userAssets"
              tokens={tokens}
              refetchPositions={refetchPositions}
            />
          </div>
        )
      )}
      <div className="flex grow flex-col bg-white/[0.03]">
        <div className="bg-linear-to-b from-background to-primary flex h-full grow justify-center rounded-t-xl pb-16 pt-8">
          <EarnTable
            chain={chain}
            rows={enrichedRows}
            depositsMode="totalAssets"
            tokens={tokens}
            refetchPositions={refetchPositions}
          />
        </div>
      </div>
    </div>
  );
}
