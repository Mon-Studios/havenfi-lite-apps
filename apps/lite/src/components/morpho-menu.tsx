//import WordmarkSvg from "@morpho-org/uikit/assets/morpho-horizontal-lite.svg?react";
//import MorphoSvg from "@morpho-org/uikit/assets/morpho.svg?react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@morpho-org/uikit/components/shadcn/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { ReactNode } from "react";

import HavenFiSvg from "@/assets/havenfi.svg?react";

function DropdownMenuLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <a href={href} rel="noopener noreferrer" target="_blank">
      <DropdownMenuItem className="text-tertiary-foreground py-1">{children}</DropdownMenuItem>
    </a>
  );
}

export function MorphoMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex cursor-pointer items-center gap-1">
          <HavenFiSvg height={36} />
          <ChevronDown className="hidden h-4 w-4 md:block" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={30} alignOffset={0} align="start" className="bg-card w-56 rounded-2xl p-2">
        <DropdownMenuLabel className="font-normal">Company</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuLink href="https://havenfi.co/">Website</DropdownMenuLink>
          <DropdownMenuLink href="https://app.havenfi.co/">Main App</DropdownMenuLink>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
