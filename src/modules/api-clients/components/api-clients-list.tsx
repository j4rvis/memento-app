import { listApiClients } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateClientDialog } from "./create-client-dialog";
import { RevokeClientButton } from "./revoke-client-button";

export async function ApiClientsList({ slug }: { slug: string }) {
  const clients = await listApiClients(slug);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>API Clients</CardTitle>
        <CreateClientDialog slug={slug} />
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No API clients yet. Create one to allow external tools to access this workspace.
          </p>
        ) : (
          <div className="divide-y">
            {clients.map((client) => (
              <div key={client.id} className="flex items-center justify-between py-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{client.name}</p>
                    {!client.is_active && (
                      <Badge variant="destructive" className="text-xs">Revoked</Badge>
                    )}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">{client.client_id}</p>
                  <div className="flex flex-wrap gap-1">
                    {client.scopes.map((scope: string) => (
                      <Badge key={scope} variant="secondary" className="text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(client.created_at).toLocaleDateString()}
                    {client.last_used_at && (
                      <> · Last used {new Date(client.last_used_at).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                {client.is_active && (
                  <RevokeClientButton slug={slug} clientId={client.id} clientName={client.name} />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
