import { vaultV2Abi } from "@morpho-org/uikit/assets/abis/vault-v2";
import { Token } from "@morpho-org/uikit/lib/utils";
import { useMemo } from "react";
import { type Address, erc20Abi, zeroAddress } from "viem";
import { useAccount, useReadContracts } from "wagmi";

import { VAULT_V2_ADDRESSES } from "@/lib/vault-v2-addresses";

const STALE_TIME = 5 * 60 * 1000;

export interface VaultV2Data {
  address: Address;
  name: string;
  symbol: string;
  asset: Address;
  totalAssets: bigint;
  totalSupply: bigint;
  owner: Address;
  curator: Address;
  performanceFee: bigint;
  managementFee: bigint;
  decimals: number;
}

export interface VaultV2Row {
  vault: VaultV2Data;
  asset: Token;
  userShares: bigint | undefined;
  userAssets: bigint | undefined;
}

export function useVaultsV2({ chainId }: { chainId: number | undefined }) {
  const { address: userAddress } = useAccount();

  const vaultAddresses = useMemo(() => (chainId !== undefined ? (VAULT_V2_ADDRESSES[chainId] ?? []) : []), [chainId]);

  // Fetch vault metadata: name, symbol, asset, totalAssets, totalSupply, owner, curator, fees, decimals
  const { data: vaultMetadata } = useReadContracts({
    contracts: vaultAddresses.flatMap((vault) => [
      { chainId, address: vault, abi: vaultV2Abi, functionName: "name" } as const,
      { chainId, address: vault, abi: vaultV2Abi, functionName: "symbol" } as const,
      { chainId, address: vault, abi: vaultV2Abi, functionName: "asset" } as const,
      { chainId, address: vault, abi: vaultV2Abi, functionName: "totalAssets" } as const,
      { chainId, address: vault, abi: vaultV2Abi, functionName: "totalSupply" } as const,
      { chainId, address: vault, abi: vaultV2Abi, functionName: "owner" } as const,
      { chainId, address: vault, abi: vaultV2Abi, functionName: "curator" } as const,
      { chainId, address: vault, abi: vaultV2Abi, functionName: "performanceFee" } as const,
      { chainId, address: vault, abi: vaultV2Abi, functionName: "managementFee" } as const,
      { chainId, address: vault, abi: vaultV2Abi, functionName: "decimals" } as const,
    ]),
    allowFailure: true,
    query: {
      enabled: chainId !== undefined && vaultAddresses.length > 0,
      staleTime: STALE_TIME,
      gcTime: Infinity,
    },
  });

  const vaults = useMemo(() => {
    if (!vaultMetadata) return [];
    const fieldsPerVault = 10;
    const result: VaultV2Data[] = [];
    for (let i = 0; i < vaultAddresses.length; i++) {
      const base = i * fieldsPerVault;
      const name = vaultMetadata[base + 0]?.result as string | undefined;
      const symbol = vaultMetadata[base + 1]?.result as string | undefined;
      const asset = vaultMetadata[base + 2]?.result as Address | undefined;
      const totalAssets = vaultMetadata[base + 3]?.result as bigint | undefined;
      const totalSupply = vaultMetadata[base + 4]?.result as bigint | undefined;
      const owner = vaultMetadata[base + 5]?.result as Address | undefined;
      const curator = vaultMetadata[base + 6]?.result as Address | undefined;
      const performanceFee = vaultMetadata[base + 7]?.result as bigint | undefined;
      const managementFee = vaultMetadata[base + 8]?.result as bigint | undefined;
      const decimals = vaultMetadata[base + 9]?.result as number | undefined;

      // Skip vaults with missing essential data
      if (
        name === undefined ||
        name === "" ||
        symbol === undefined ||
        asset === undefined ||
        totalAssets === undefined ||
        totalSupply === undefined ||
        decimals === undefined
      ) {
        continue;
      }

      result.push({
        address: vaultAddresses[i],
        name,
        symbol,
        asset,
        totalAssets,
        totalSupply,
        owner: owner ?? zeroAddress,
        curator: curator ?? zeroAddress,
        performanceFee: performanceFee ?? 0n,
        managementFee: managementFee ?? 0n,
        decimals,
      });
    }
    return result;
  }, [vaultMetadata, vaultAddresses]);

  // Fetch underlying asset token metadata
  const tokenAddresses = useMemo(() => {
    const set = new Set(vaults.map((v) => v.asset));
    set.delete(zeroAddress);
    return [...set].sort();
  }, [vaults]);

  const { data: tokenData } = useReadContracts({
    contracts: tokenAddresses.flatMap((asset) => [
      { chainId, address: asset, abi: erc20Abi, functionName: "symbol" } as const,
      { chainId, address: asset, abi: erc20Abi, functionName: "decimals" } as const,
    ]),
    allowFailure: true,
    query: { staleTime: Infinity, gcTime: Infinity },
  });

  const tokens = useMemo(() => {
    const tokens = new Map<Address, { decimals?: number; symbol?: string }>();
    tokenAddresses.forEach((addr, idx) => {
      const symbol = tokenData?.[idx * 2]?.result as string | undefined;
      const decimals = tokenData?.[idx * 2 + 1]?.result as number | undefined;
      tokens.set(addr, { decimals, symbol });
    });
    return tokens;
  }, [tokenAddresses, tokenData]);

  // Fetch user's shares in each vault
  const { data: balanceData, refetch: refetchBalances } = useReadContracts({
    contracts: vaults.map(
      (vault) =>
        ({
          chainId,
          address: vault.address,
          abi: vaultV2Abi,
          functionName: "balanceOf",
          args: [userAddress ?? "0x"],
        }) as const,
    ),
    allowFailure: true,
    query: {
      enabled: chainId !== undefined && !!userAddress && vaults.length > 0,
      staleTime: STALE_TIME,
      gcTime: Infinity,
    },
  });

  // Fetch user's convertible assets for each vault (using previewRedeem)
  const userShares = useMemo(
    () => vaults.map((_, idx) => (balanceData?.[idx]?.result as bigint | undefined) ?? undefined),
    [vaults, balanceData],
  );

  const { data: redeemPreviewData, refetch: refetchRedeemPreviews } = useReadContracts({
    contracts: vaults.map(
      (vault, idx) =>
        ({
          chainId,
          address: vault.address,
          abi: vaultV2Abi,
          functionName: "previewRedeem",
          args: [userShares[idx] ?? 0n],
        }) as const,
    ),
    allowFailure: true,
    query: {
      enabled: chainId !== undefined && !!userAddress && vaults.length > 0 && userShares.some((s) => s !== undefined),
      staleTime: STALE_TIME,
      gcTime: Infinity,
    },
  });

  const refetchPositions = () => {
    void refetchBalances();
    void refetchRedeemPreviews();
  };

  const rows: VaultV2Row[] = useMemo(
    () =>
      vaults.map((vault, idx) => {
        const token = tokens.get(vault.asset);
        return {
          vault,
          asset: {
            address: vault.asset,
            symbol: token?.symbol,
            decimals: token?.decimals,
          } as Token,
          userShares: userShares[idx],
          userAssets: (redeemPreviewData?.[idx]?.result as bigint | undefined) ?? undefined,
        };
      }),
    [vaults, tokens, userShares, redeemPreviewData],
  );

  return {
    vaults,
    tokens,
    rows,
    refetchPositions,
    isLoading: vaultMetadata === undefined,
  };
}
