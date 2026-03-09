"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { syncGoogleAccount, disconnectGoogleAccount } from "../actions";
import { toast } from "sonner";

interface Account {
  id: string;
  google_email: string;
  synced_at: string | null;
}

export function GoogleAccountsList({ accounts, slug }: { accounts: Account[]; slug: string }) {
  if (accounts.length === 0) return null;

  return (
    <ul className="space-y-3">
      {accounts.map((account) => (
        <AccountRow key={account.id} account={account} slug={slug} />
      ))}
    </ul>
  );
}

function AccountRow({ account, slug }: { account: Account; slug: string }) {
  const [syncing, startSync] = useTransition();
  const [disconnecting, startDisconnect] = useTransition();

  function handleSync() {
    startSync(async () => {
      try {
        await syncGoogleAccount(slug, account.id);
        toast.success("Calendar synced");
      } catch {
        toast.error("Sync failed");
      }
    });
  }

  function handleDisconnect() {
    startDisconnect(async () => {
      try {
        await disconnectGoogleAccount(slug, account.id);
        toast.success("Account disconnected");
      } catch {
        toast.error("Disconnect failed");
      }
    });
  }

  const lastSynced = account.synced_at
    ? new Date(account.synced_at).toLocaleString()
    : "Never";

  return (
    <li className="flex items-center justify-between rounded-md border p-3 text-sm">
      <div>
        <p className="font-medium">{account.google_email}</p>
        <p className="text-muted-foreground text-xs">Last synced: {lastSynced}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          {syncing ? "Syncing…" : "Sync Now"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="text-destructive hover:text-destructive"
        >
          {disconnecting ? "Removing…" : "Disconnect"}
        </Button>
      </div>
    </li>
  );
}
