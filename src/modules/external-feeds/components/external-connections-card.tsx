import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getInstanceIdFromSlug } from "@/lib/instance/server";
import { DisconnectProviderButton } from "./disconnect-provider-button";

interface ProviderConfig {
  id: string;
  label: string;
  authPath: string;
}

const SUPPORTED_PROVIDERS: ProviderConfig[] = [
  { id: "x", label: "X (Twitter)", authPath: "/api/x/auth" },
];

export async function ExternalConnectionsCard({ slug }: { slug: string }) {
  const instanceId = await getInstanceIdFromSlug(slug);
  const supabase = await createClient();

  const { data: connections } = await supabase
    .from("external_connections")
    .select("id, provider, provider_username, created_at")
    .eq("instance_id", instanceId)
    .order("created_at");

  const connectedProviders = new Set((connections ?? []).map((c) => c.provider));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Feed Connections</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {SUPPORTED_PROVIDERS.map((provider) => {
          const connection = (connections ?? []).find(
            (c) => c.provider === provider.id
          );

          return (
            <div
              key={provider.id}
              className="flex items-center justify-between py-2"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{provider.label}</p>
                {connection ? (
                  <p className="text-xs text-muted-foreground">
                    @{connection.provider_username}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Not connected</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {connection ? (
                  <>
                    <Badge variant="secondary">Connected</Badge>
                    <DisconnectProviderButton
                      slug={slug}
                      connectionId={connection.id}
                      providerUsername={connection.provider_username}
                    />
                  </>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`${provider.authPath}?slug=${slug}`}>Connect</a>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
