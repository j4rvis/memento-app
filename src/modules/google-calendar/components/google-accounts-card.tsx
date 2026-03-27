import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listGoogleAccounts } from "../actions";
import { DisconnectGoogleButton } from "./disconnect-google-button";
import { SyncGoogleButton } from "./sync-google-button";

export async function GoogleAccountsCard({ slug }: { slug: string }) {
  const accounts = await listGoogleAccounts(slug);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Google Calendar</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/google/auth?slug=${slug}`}>Connect account</a>
        </Button>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No Google accounts connected. Connect one to sync your calendar events.
          </p>
        ) : (
          <div className="divide-y">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{account.google_email}</p>
                  <p className="text-xs text-muted-foreground">
                    Last synced {new Date(account.updated_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <SyncGoogleButton slug={slug} accountId={account.id} />
                  <DisconnectGoogleButton
                    slug={slug}
                    accountId={account.id}
                    email={account.google_email}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
