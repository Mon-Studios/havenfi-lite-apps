import { AvatarImage, AvatarFallback, Avatar } from "@morpho-org/uikit/components/shadcn/avatar";
import { Sheet, SheetTrigger } from "@morpho-org/uikit/components/shadcn/sheet";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@morpho-org/uikit/components/shadcn/table";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@morpho-org/uikit/components/shadcn/tooltip";
import { formatBalanceWithSymbol, abbreviateAddress } from "@morpho-org/uikit/lib/utils";
import { blo } from "blo";
import { ExternalLink } from "lucide-react";
import { Chain, Address } from "viem";

import { EarnSheetContent } from "@/components/earn-sheet-content";
import { type VaultV2Row } from "@/hooks/use-vaults-v2";

export type Row = VaultV2Row;

function VaultTableCell({
  address,
  name,
  imageSrc,
  chain,
}: {
  address: Address;
  name: string;
  imageSrc?: string;
  chain: Chain | undefined;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="hover:bg-secondary flex w-min items-center gap-2 rounded-sm p-2">
            <Avatar className="h-4 w-4 rounded-full">
              <AvatarImage src={imageSrc} alt="Avatar" />
              <AvatarFallback delayMs={1000}>
                <img src={blo(address)} />
              </AvatarFallback>
            </Avatar>
            {name || "－"}
          </div>
        </TooltipTrigger>
        <TooltipContent
          className="text-primary-foreground rounded-3xl p-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="underline">Vault V2</p>
          <div className="flex items-center gap-1">
            <p>
              Vault: <code>{abbreviateAddress(address)}</code>
            </p>
            {chain?.blockExplorers?.default.url && (
              <a
                href={`${chain.blockExplorers.default.url}/address/${address}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function FeesTableCell({ performanceFee, managementFee }: { performanceFee: bigint; managementFee: bigint }) {
  // Fees are stored as WAD (1e18 = 100%)
  const perfFeePercent = Number(performanceFee) / 1e16;
  const mgmtFeePercent = Number(managementFee) / 1e16;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default">
            {perfFeePercent > 0 || mgmtFeePercent > 0
              ? `${perfFeePercent > 0 ? `${perfFeePercent.toFixed(1)}% perf` : ""}${perfFeePercent > 0 && mgmtFeePercent > 0 ? " / " : ""}${mgmtFeePercent > 0 ? `${mgmtFeePercent.toFixed(1)}% mgmt` : ""}`
              : "None"}
          </span>
        </TooltipTrigger>
        <TooltipContent
          className="text-primary-foreground rounded-3xl p-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="underline">Fee Breakdown</p>
          <p>Performance Fee: {perfFeePercent.toFixed(2)}%</p>
          <p>Management Fee: {mgmtFeePercent.toFixed(2)}%/year</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function CuratorTableCell({ curator, chain }: { curator: Address; chain: Chain | undefined }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-4 w-4 rounded-full">
        <AvatarImage src={blo(curator)} alt="Avatar" />
      </Avatar>
      <a
        href={chain?.blockExplorers?.default.url ? `${chain.blockExplorers.default.url}/address/${curator}` : "#"}
        rel="noopener noreferrer"
        target="_blank"
        className="hover:underline"
      >
        {abbreviateAddress(curator)}
      </a>
    </div>
  );
}

export function EarnTable({
  chain,
  rows,
  depositsMode,
  tokens,
  refetchPositions,
}: {
  chain: Chain | undefined;
  rows: Row[];
  depositsMode: "totalAssets" | "userAssets";
  tokens: Map<Address, { decimals?: number; symbol?: string }>;
  refetchPositions: () => void;
}) {
  return (
    <div className="text-primary-foreground w-full max-w-7xl px-2 lg:px-8">
      <Table className="border-separate border-spacing-y-3">
        <TableHeader className="bg-primary">
          <TableRow>
            <TableHead className="text-secondary-foreground rounded-l-lg pl-4 text-xs font-light">Vault</TableHead>
            <TableHead className="text-secondary-foreground text-xs font-light">Deposits</TableHead>
            <TableHead className="text-secondary-foreground text-xs font-light">Curator</TableHead>
            <TableHead className="text-secondary-foreground text-xs font-light">Fees</TableHead>
            <TableHead className="text-secondary-foreground rounded-r-lg text-xs font-light">Asset</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const token = tokens.get(row.vault.asset);
            const assetDecimals = token?.decimals ?? row.asset.decimals;
            const assetSymbol = token?.symbol ?? row.asset.symbol;
            const deposits = depositsMode === "userAssets" ? row.userAssets : row.vault.totalAssets;

            return (
              <Sheet
                key={row.vault.address}
                onOpenChange={(isOpen) => {
                  if (!isOpen) void refetchPositions();
                }}
              >
                <SheetTrigger asChild>
                  <TableRow className="bg-primary hover:bg-secondary">
                    <TableCell className="rounded-l-lg py-3">
                      <VaultTableCell
                        address={row.vault.address}
                        name={row.vault.name}
                        imageSrc={row.asset.imageSrc}
                        chain={chain}
                      />
                    </TableCell>
                    <TableCell>
                      {deposits !== undefined && assetDecimals !== undefined
                        ? formatBalanceWithSymbol(deposits, assetDecimals, assetSymbol, 5, true)
                        : "－"}
                    </TableCell>
                    <TableCell>
                      <CuratorTableCell curator={row.vault.curator} chain={chain} />
                    </TableCell>
                    <TableCell>
                      <FeesTableCell
                        performanceFee={row.vault.performanceFee}
                        managementFee={row.vault.managementFee}
                      />
                    </TableCell>
                    <TableCell className="rounded-r-lg">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-4 w-4 rounded-full">
                          <AvatarImage src={row.asset.imageSrc} alt="Avatar" />
                          <AvatarFallback delayMs={500}>
                            <img src={blo(row.vault.asset)} />
                          </AvatarFallback>
                        </Avatar>
                        {assetSymbol ?? "－"}
                      </div>
                    </TableCell>
                  </TableRow>
                </SheetTrigger>
                <EarnSheetContent vaultAddress={row.vault.address} asset={row.asset} />
              </Sheet>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
