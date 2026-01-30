import { getAddress, isAddress } from "viem";
import { mainnet, base, arbitrum, polygon } from "viem/chains";
import { describe, expect, it } from "vitest";

import { VAULT_V2_ADDRESSES } from "@/lib/vault-v2-addresses";

describe("VAULT_V2_ADDRESSES", () => {
  it("contains entries for mainnet", () => {
    const addresses = VAULT_V2_ADDRESSES[mainnet.id];
    expect(addresses).toBeDefined();
    expect(addresses.length).toBeGreaterThan(0);
  });

  it("contains entries for base", () => {
    const addresses = VAULT_V2_ADDRESSES[base.id];
    expect(addresses).toBeDefined();
    expect(addresses.length).toBeGreaterThan(0);
  });

  it("contains entries for arbitrum", () => {
    const addresses = VAULT_V2_ADDRESSES[arbitrum.id];
    expect(addresses).toBeDefined();
    expect(addresses.length).toBeGreaterThan(0);
  });

  it("contains entries for polygon", () => {
    const addresses = VAULT_V2_ADDRESSES[polygon.id];
    expect(addresses).toBeDefined();
    expect(addresses.length).toBeGreaterThan(0);
  });

  it("all addresses are valid Ethereum addresses", () => {
    for (const [chainId, addresses] of Object.entries(VAULT_V2_ADDRESSES)) {
      for (const address of addresses) {
        expect(isAddress(address), `Invalid address ${address} on chain ${chainId}`).toBe(true);
      }
    }
  });

  it("all addresses are checksummed", () => {
    for (const [chainId, addresses] of Object.entries(VAULT_V2_ADDRESSES)) {
      for (const address of addresses) {
        expect(address, `Address ${address} on chain ${chainId} is not checksummed`).toBe(getAddress(address));
      }
    }
  });

  it("no duplicate addresses within same chain", () => {
    for (const [chainId, addresses] of Object.entries(VAULT_V2_ADDRESSES)) {
      const normalized = addresses.map((a) => a.toLowerCase());
      const unique = new Set(normalized);
      expect(unique.size, `Duplicate addresses found on chain ${chainId}`).toBe(normalized.length);
    }
  });
});
