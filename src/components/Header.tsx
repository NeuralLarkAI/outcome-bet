import React from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

type HeaderProps = {
  title?: string;
  subtitle?: string;
};

export function Header({
  title = "YesNo",
  subtitle = "Simple outcome markets on Solana (Devnet)",
}: HeaderProps) {
  return (
    <header className="w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:py-5 flex items-center justify-between gap-4">
        {/* Left: Brand */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center font-bold text-foreground">
              YN
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">
              {title}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {subtitle}
          </p>
        </div>

        {/* Right: Wallet */}
        <div className="flex items-center gap-2">
          <WalletMultiButton className="!rounded-full !px-4 !py-2 !text-sm !font-semibold !bg-primary hover:!bg-primary/90" />
        </div>
      </div>
    </header>
  );
}
