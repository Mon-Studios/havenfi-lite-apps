import { vaultV2Abi } from "@morpho-org/uikit/assets/abis/vault-v2";
import { vaultV2FactoryAbi } from "@morpho-org/uikit/assets/abis/vault-v2-factory";
import { describe, expect, it } from "vitest";

describe("Vault V2 ABI", () => {
  it("exports a valid ABI array", () => {
    expect(Array.isArray(vaultV2Abi)).toBe(true);
    expect(vaultV2Abi.length).toBeGreaterThan(0);
  });

  it("contains ERC4626 deposit function", () => {
    const deposit = vaultV2Abi.find((item) => item.type === "function" && "name" in item && item.name === "deposit");
    expect(deposit).toBeDefined();
    expect(deposit).toHaveProperty("inputs");
    if (deposit && "inputs" in deposit) {
      expect(deposit.inputs).toHaveLength(2);
      expect(deposit.inputs[0].type).toBe("uint256"); // assets
      expect(deposit.inputs[1].type).toBe("address"); // receiver
    }
  });

  it("contains ERC4626 withdraw function", () => {
    const withdraw = vaultV2Abi.find((item) => item.type === "function" && "name" in item && item.name === "withdraw");
    expect(withdraw).toBeDefined();
    if (withdraw && "inputs" in withdraw) {
      expect(withdraw.inputs).toHaveLength(3);
      expect(withdraw.inputs[0].type).toBe("uint256"); // assets
      expect(withdraw.inputs[1].type).toBe("address"); // receiver
      expect(withdraw.inputs[2].type).toBe("address"); // owner
    }
  });

  it("contains ERC4626 redeem function", () => {
    const redeem = vaultV2Abi.find((item) => item.type === "function" && "name" in item && item.name === "redeem");
    expect(redeem).toBeDefined();
    if (redeem && "inputs" in redeem) {
      expect(redeem.inputs).toHaveLength(3);
      expect(redeem.inputs[0].type).toBe("uint256"); // shares
      expect(redeem.inputs[1].type).toBe("address"); // receiver
      expect(redeem.inputs[2].type).toBe("address"); // owner
    }
  });

  it("contains previewRedeem function", () => {
    const previewRedeem = vaultV2Abi.find(
      (item) => item.type === "function" && "name" in item && item.name === "previewRedeem",
    );
    expect(previewRedeem).toBeDefined();
    if (previewRedeem && "inputs" in previewRedeem) {
      expect(previewRedeem.inputs).toHaveLength(1);
      expect(previewRedeem.inputs[0].type).toBe("uint256");
    }
  });

  it("contains V2-specific functions", () => {
    const v2Functions = ["owner", "curator", "performanceFee", "managementFee", "adaptersLength", "accrueInterest"];
    for (const fnName of v2Functions) {
      const found = vaultV2Abi.find((item) => item.type === "function" && "name" in item && item.name === fnName);
      expect(found, `Expected to find function ${fnName}`).toBeDefined();
    }
  });

  it("contains ERC20 balanceOf function", () => {
    const balanceOf = vaultV2Abi.find(
      (item) => item.type === "function" && "name" in item && item.name === "balanceOf",
    );
    expect(balanceOf).toBeDefined();
  });

  it("contains Deposit and Withdraw events", () => {
    const depositEvent = vaultV2Abi.find((item) => item.type === "event" && "name" in item && item.name === "Deposit");
    const withdrawEvent = vaultV2Abi.find(
      (item) => item.type === "event" && "name" in item && item.name === "Withdraw",
    );
    expect(depositEvent).toBeDefined();
    expect(withdrawEvent).toBeDefined();
  });

  it("contains totalAssets function", () => {
    const totalAssets = vaultV2Abi.find(
      (item) => item.type === "function" && "name" in item && item.name === "totalAssets",
    );
    expect(totalAssets).toBeDefined();
  });

  it("contains asset function", () => {
    const asset = vaultV2Abi.find((item) => item.type === "function" && "name" in item && item.name === "asset");
    expect(asset).toBeDefined();
  });

  it("contains convertToShares and convertToAssets", () => {
    const convertToShares = vaultV2Abi.find(
      (item) => item.type === "function" && "name" in item && item.name === "convertToShares",
    );
    const convertToAssets = vaultV2Abi.find(
      (item) => item.type === "function" && "name" in item && item.name === "convertToAssets",
    );
    expect(convertToShares).toBeDefined();
    expect(convertToAssets).toBeDefined();
  });

  it("contains gate functions", () => {
    const gateFunctions = ["canReceiveShares", "canSendShares", "canReceiveAssets", "canSendAssets"];
    for (const fnName of gateFunctions) {
      const found = vaultV2Abi.find((item) => item.type === "function" && "name" in item && item.name === fnName);
      expect(found, `Expected to find gate function ${fnName}`).toBeDefined();
    }
  });

  it("contains accrueInterestView with correct return types", () => {
    const accrueInterestView = vaultV2Abi.find(
      (item) => item.type === "function" && "name" in item && item.name === "accrueInterestView",
    );
    expect(accrueInterestView).toBeDefined();
    if (accrueInterestView && "outputs" in accrueInterestView) {
      expect(accrueInterestView.outputs).toHaveLength(3);
    }
  });
});

describe("VaultV2Factory ABI", () => {
  it("exports a valid ABI array", () => {
    expect(Array.isArray(vaultV2FactoryAbi)).toBe(true);
    expect(vaultV2FactoryAbi.length).toBeGreaterThan(0);
  });

  it("contains CreateVaultV2 event", () => {
    const event = vaultV2FactoryAbi.find(
      (item) => item.type === "event" && "name" in item && item.name === "CreateVaultV2",
    );
    expect(event).toBeDefined();
    if (event && "inputs" in event) {
      expect(event.inputs).toHaveLength(4);
      expect(event.inputs[0].name).toBe("owner");
      expect(event.inputs[1].name).toBe("asset");
      expect(event.inputs[2].name).toBe("salt");
      expect(event.inputs[3].name).toBe("newVaultV2");
    }
  });

  it("contains createVaultV2 function", () => {
    const createFn = vaultV2FactoryAbi.find(
      (item) => item.type === "function" && "name" in item && item.name === "createVaultV2",
    );
    expect(createFn).toBeDefined();
    if (createFn && "inputs" in createFn) {
      expect(createFn.inputs).toHaveLength(3);
      expect(createFn.inputs[0].name).toBe("owner");
      expect(createFn.inputs[1].name).toBe("asset");
      expect(createFn.inputs[2].name).toBe("salt");
    }
  });

  it("contains isVaultV2 function", () => {
    const isVaultV2 = vaultV2FactoryAbi.find(
      (item) => item.type === "function" && "name" in item && item.name === "isVaultV2",
    );
    expect(isVaultV2).toBeDefined();
    if (isVaultV2 && "outputs" in isVaultV2) {
      expect(isVaultV2.outputs[0].type).toBe("bool");
    }
  });
});
