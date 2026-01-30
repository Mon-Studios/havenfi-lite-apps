import { vaultV2Abi } from "@morpho-org/uikit/assets/abis/vault-v2";
import { erc20Abi } from "viem";
import { mainnet } from "viem/chains";
import { describe, expect } from "vitest";

import { testWithMainnetFork } from "../config";

import { VAULT_V2_ADDRESSES } from "@/lib/vault-v2-addresses";

describe("Vault V2 on-chain reads", () => {
  testWithMainnetFork(
    "reads vault metadata from a known V2 vault on mainnet",
    async ({ client }) => {
      const vaultAddresses = VAULT_V2_ADDRESSES[mainnet.id];
      expect(vaultAddresses).toBeDefined();
      expect(vaultAddresses.length).toBeGreaterThan(0);

      const vaultAddress = vaultAddresses[0];

      // Read basic ERC4626 metadata
      const [name, symbol, asset, totalAssets, totalSupply, decimals] = await Promise.all([
        client.readContract({ address: vaultAddress, abi: vaultV2Abi, functionName: "name" }),
        client.readContract({ address: vaultAddress, abi: vaultV2Abi, functionName: "symbol" }),
        client.readContract({ address: vaultAddress, abi: vaultV2Abi, functionName: "asset" }),
        client.readContract({ address: vaultAddress, abi: vaultV2Abi, functionName: "totalAssets" }),
        client.readContract({ address: vaultAddress, abi: vaultV2Abi, functionName: "totalSupply" }),
        client.readContract({ address: vaultAddress, abi: vaultV2Abi, functionName: "decimals" }),
      ]);

      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
      expect(typeof symbol).toBe("string");
      expect(symbol.length).toBeGreaterThan(0);
      expect(asset).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(totalAssets).toBeGreaterThanOrEqual(0n);
      expect(totalSupply).toBeGreaterThanOrEqual(0n);
      expect(decimals).toBeGreaterThan(0);
    },
    30_000,
  );

  testWithMainnetFork(
    "reads V2-specific fields from a known vault on mainnet",
    async ({ client }) => {
      const vaultAddress = VAULT_V2_ADDRESSES[mainnet.id][0];

      const [owner, curator, performanceFee, managementFee] = await Promise.all([
        client.readContract({ address: vaultAddress, abi: vaultV2Abi, functionName: "owner" }),
        client.readContract({ address: vaultAddress, abi: vaultV2Abi, functionName: "curator" }),
        client.readContract({ address: vaultAddress, abi: vaultV2Abi, functionName: "performanceFee" }),
        client.readContract({ address: vaultAddress, abi: vaultV2Abi, functionName: "managementFee" }),
      ]);

      expect(owner).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(curator).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(typeof performanceFee).toBe("bigint");
      expect(typeof managementFee).toBe("bigint");
      // Performance fee max is 50% (5e17)
      expect(performanceFee).toBeLessThanOrEqual(500000000000000000n);
      // Management fee max is 5% (5e16)
      expect(managementFee).toBeLessThanOrEqual(50000000000000000n);
    },
    30_000,
  );

  testWithMainnetFork(
    "max functions return 0 for V2 vaults",
    async ({ client }) => {
      const vaultAddress = VAULT_V2_ADDRESSES[mainnet.id][0];
      const testUser = "0x0000000000000000000000000000000000000001";

      const [maxDeposit, maxMint, maxWithdraw, maxRedeem] = await Promise.all([
        client.readContract({ address: vaultAddress, abi: vaultV2Abi, functionName: "maxDeposit", args: [testUser] }),
        client.readContract({ address: vaultAddress, abi: vaultV2Abi, functionName: "maxMint", args: [testUser] }),
        client.readContract({ address: vaultAddress, abi: vaultV2Abi, functionName: "maxWithdraw", args: [testUser] }),
        client.readContract({ address: vaultAddress, abi: vaultV2Abi, functionName: "maxRedeem", args: [testUser] }),
      ]);

      // V2 vaults always return 0 for max functions
      expect(maxDeposit).toBe(0n);
      expect(maxMint).toBe(0n);
      expect(maxWithdraw).toBe(0n);
      expect(maxRedeem).toBe(0n);
    },
    30_000,
  );

  testWithMainnetFork(
    "previewRedeem returns correct asset value for shares",
    async ({ client }) => {
      const vaultAddress = VAULT_V2_ADDRESSES[mainnet.id][0];

      const [totalAssets, totalSupply] = await Promise.all([
        client.readContract({ address: vaultAddress, abi: vaultV2Abi, functionName: "totalAssets" }),
        client.readContract({ address: vaultAddress, abi: vaultV2Abi, functionName: "totalSupply" }),
      ]);

      if (totalSupply > 0n) {
        const testShares = 1000000n; // 1M shares
        const previewValue = await client.readContract({
          address: vaultAddress,
          abi: vaultV2Abi,
          functionName: "previewRedeem",
          args: [testShares],
        });

        // previewRedeem should return a value proportional to totalAssets/totalSupply
        expect(previewValue).toBeGreaterThan(0n);

        // Rough check: the returned assets should be approximately testShares * totalAssets / totalSupply
        const expected = (testShares * totalAssets) / totalSupply;
        // Allow some rounding difference
        expect(previewValue).toBeGreaterThanOrEqual(expected - 1n);
        expect(previewValue).toBeLessThanOrEqual(expected + 1n);
      }
    },
    30_000,
  );

  testWithMainnetFork(
    "underlying asset token has valid ERC20 metadata",
    async ({ client }) => {
      const vaultAddress = VAULT_V2_ADDRESSES[mainnet.id][0];

      const asset = await client.readContract({
        address: vaultAddress,
        abi: vaultV2Abi,
        functionName: "asset",
      });

      const [tokenSymbol, tokenDecimals] = await Promise.all([
        client.readContract({ address: asset, abi: erc20Abi, functionName: "symbol" }),
        client.readContract({ address: asset, abi: erc20Abi, functionName: "decimals" }),
      ]);

      expect(typeof tokenSymbol).toBe("string");
      expect(tokenSymbol.length).toBeGreaterThan(0);
      expect(tokenDecimals).toBeGreaterThan(0);
      expect(tokenDecimals).toBeLessThanOrEqual(18);
    },
    30_000,
  );
});
