import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useState } from "react";

interface BalanceInputsProps {
  tokenProcessId: string;
  wallet: string;
  onTokenChange: (token: string) => void;
  onWalletChange: (wallet: string) => void;
}

export function BalanceInputs({
  tokenProcessId,
  wallet,
  onTokenChange,
  onWalletChange,
}: BalanceInputsProps) {
  const [inputToken, setInputToken] = useState(tokenProcessId);
  const [inputWallet, setInputWallet] = useState(wallet);

  const handleSave = () => {
    if (inputToken.trim()) onTokenChange(inputToken);
    if (inputWallet.trim()) onWalletChange(inputWallet);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {/* <div>
            <h2 className="text-lg font-semibold">Balance Checker</h2>
            <p className="text-sm text-muted-foreground">
              Compare token balances across HB nodes and CUs
            </p>
          </div> */}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Token Process ID</label>
              <Input
                placeholder="Enter token process ID"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
              />
              {tokenProcessId && (
                <div className="text-sm text-muted-foreground">
                  Current: {tokenProcessId}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Wallet Address</label>
              <Input
                placeholder="Enter wallet address"
                value={inputWallet}
                onChange={(e) => setInputWallet(e.target.value)}
              />
              {wallet && (
                <div className="text-sm text-muted-foreground">
                  Current: {wallet}
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={!inputToken.trim() || !inputWallet.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    </Card>
  );
}
