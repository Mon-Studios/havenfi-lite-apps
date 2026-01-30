import { vaultV2Abi } from "@morpho-org/uikit/assets/abis/vault-v2";
import { Dialog } from "@morpho-org/uikit/components/shadcn/dialog";
import { Token } from "@morpho-org/uikit/lib/utils";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { Address, defineChain, erc20Abi, ExtractAbiItem, formatUnits, http, Log, parseEther, parseUnits } from "viem";
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";
import { mainnet } from "viem/chains";
import { describe, expect } from "vitest";
import { mock, useConnect } from "wagmi";

import { testWithMainnetFork } from "../config";
import { render, screen, waitFor } from "../providers";

import { EarnSheetContent } from "@/components/earn-sheet-content";
import { createConfig } from "@/lib/wagmi-config";

function TestableEarnSheetContent(params: Parameters<typeof EarnSheetContent>[0]) {
  const { status, connect, connectors } = useConnect();
  useEffect(() => connect({ connector: connectors[0] }), [connect, connectors]);

  if (status !== "success") return undefined;

  return (
    <Dialog open={true}>
      <EarnSheetContent {...params} />
    </Dialog>
  );
}

type ApprovalLog = Log<bigint, number, false, ExtractAbiItem<typeof erc20Abi, "Approval">, true>;
type DepositLog = Log<bigint, number, false, ExtractAbiItem<typeof vaultV2Abi, "Deposit">, true>;
type WithdrawLog = Log<bigint, number, false, ExtractAbiItem<typeof vaultV2Abi, "Withdraw">, true>;

// Use a known Vault V2 on Ethereum mainnet
// 0x093272C07700d3cA5301C3Bf9B3A392624179E2F is a Steakhouse USDC vault
const VAULT_V2_ADDRESS: Address = "0x093272C07700d3cA5301C3Bf9B3A392624179E2F";
const USDC: Token = {
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  symbol: "USDC",
  decimals: 6,
  imageSrc: "./morpho.svg",
};

describe("V2 deposit flow", () => {
  testWithMainnetFork(
    "encodes approval and deposit correctly for Vault V2",
    async ({ client }) => {
      const account = privateKeyToAddress(generatePrivateKey());
      const chain = defineChain({ ...mainnet, rpcUrls: { default: { http: [client.transport.url!] } } });
      const wagmiConfig = createConfig({
        chains: [chain],
        transports: { [chain.id]: http(client.transport.url) },
        connectors: [
          mock({
            accounts: [account],
            features: { defaultConnected: true, reconnect: true },
          }),
        ],
      });

      const amount = "100";
      await client.deal({ account, amount: parseEther("0.1") }); // for gas
      await client.deal({ account, amount: parseUnits(amount, 6), erc20: USDC.address }); // for deposit
      await client.impersonateAccount({ address: account });

      render(<TestableEarnSheetContent vaultAddress={VAULT_V2_ADDRESS} asset={USDC} />, {
        wagmiConfig,
      });

      // Wait for tabs — this implies the Testable wrapper has connected the mock account
      await waitFor(() => screen.findAllByRole("tab"));
      const tabs = screen.getAllByRole("tab");
      await userEvent.click(tabs.find((tab) => tab.textContent === "Deposit")!);

      expect(screen.getByPlaceholderText("0")).toBeInTheDocument();

      // Wait for MAX button — this implies the component has loaded account balances
      await waitFor(() => screen.findAllByText("MAX"), { timeout: 10_000 });
      await userEvent.click(screen.getByText("MAX"));

      expect(screen.getByDisplayValue(amount)).toBeInTheDocument();

      // Wait for Approve button — this implies the component has loaded account allowance
      await waitFor(() => screen.findByText("Approve"), { timeout: 10_000 });
      const transactionButton = screen.getByText("Approve");

      // Wait for approval to be automined
      const [, approval] = await Promise.all([
        userEvent.click(transactionButton),
        new Promise<ApprovalLog>((resolve) => {
          const unwatch = client.watchContractEvent({
            abi: erc20Abi,
            address: USDC.address,
            eventName: "Approval",
            strict: true,
            onLogs(logs) {
              unwatch();
              expect(logs.length).toBe(1);
              resolve(logs[0]);
            },
          });
        }),
      ]);

      expect(approval.args.owner).toBe(account);
      expect(approval.args.spender).toBe(VAULT_V2_ADDRESS);
      expect(approval.args.value).toBe(parseUnits(amount, 6));

      // Wait for deposit to be automined
      const [, deposit] = await Promise.all([
        userEvent.click(transactionButton),
        new Promise<DepositLog>((resolve) => {
          const unwatch = client.watchContractEvent({
            abi: vaultV2Abi,
            address: VAULT_V2_ADDRESS,
            eventName: "Deposit",
            strict: true,
            onLogs(logs) {
              unwatch();
              expect(logs.length).toBe(1);
              resolve(logs[0]);
            },
          });
        }),
      ]);

      expect(deposit.args.sender).toBe(account);
      expect(deposit.args.owner).toBe(account);
      expect(deposit.args.assets).toBe(parseUnits(amount, 6));
      expect(deposit.args.shares).toBeGreaterThan(0n);
    },
    60_000,
  );
});

describe("V2 withdraw flow", () => {
  testWithMainnetFork(
    "encodes withdraw max correctly for Vault V2",
    async ({ client }) => {
      const account = privateKeyToAddress(generatePrivateKey());
      const chain = defineChain({ ...mainnet, rpcUrls: { default: { http: [client.transport.url!] } } });
      const wagmiConfig = createConfig({
        chains: [chain],
        transports: { [chain.id]: http(client.transport.url) },
        connectors: [
          mock({
            accounts: [account],
            features: { defaultConnected: true, reconnect: true },
          }),
        ],
      });

      const shares = "100000000"; // 100 shares (6 decimals)
      await client.deal({ account, amount: parseEther("0.1") }); // for gas
      await client.deal({ account, amount: BigInt(shares), erc20: VAULT_V2_ADDRESS }); // vault shares
      await client.impersonateAccount({ address: account });

      // For V2 vaults, max functions return 0. We use previewRedeem to determine max withdraw.
      const userShareBalance = await client.readContract({
        abi: vaultV2Abi,
        address: VAULT_V2_ADDRESS,
        functionName: "balanceOf",
        args: [account],
      });
      const previewRedeemValue = await client.readContract({
        abi: vaultV2Abi,
        address: VAULT_V2_ADDRESS,
        functionName: "previewRedeem",
        args: [userShareBalance],
      });
      const maxText = formatUnits(previewRedeemValue, USDC.decimals!);

      render(<TestableEarnSheetContent vaultAddress={VAULT_V2_ADDRESS} asset={USDC} />, {
        wagmiConfig,
      });

      // Wait for tabs
      await waitFor(() => screen.findAllByRole("tab"));
      const tabs = screen.getAllByRole("tab");
      await userEvent.click(tabs.find((tab) => tab.textContent === "Withdraw")!);

      expect(screen.getByPlaceholderText("0")).toBeInTheDocument();

      // Wait for MAX button
      await waitFor(() => screen.findAllByText("MAX"), { timeout: 10_000 });
      await userEvent.click(screen.getByText("MAX"));

      expect(screen.getByDisplayValue(maxText)).toBeInTheDocument();

      const transactionButton = screen.getAllByText("Withdraw").find((element) => element.role !== "tab")!;

      // Wait for withdraw to be automined — max withdraw uses redeem
      const [, withdraw] = await Promise.all([
        userEvent.click(transactionButton),
        new Promise<WithdrawLog>((resolve) => {
          const unwatch = client.watchContractEvent({
            abi: vaultV2Abi,
            address: VAULT_V2_ADDRESS,
            eventName: "Withdraw",
            strict: true,
            onLogs(logs) {
              unwatch();
              expect(logs.length).toBe(1);
              resolve(logs[0]);
            },
          });
        }),
      ]);

      expect(withdraw.args.owner).toBe(account);
      expect(withdraw.args.receiver).toBe(account);
      // For max withdraw, we expect redeem to burn all shares
      expect(withdraw.args.shares).toBe(userShareBalance);
    },
    60_000,
  );
});
