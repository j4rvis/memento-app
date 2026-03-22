import { createClient } from "@/lib/supabase/server";
import { getInstanceIdFromSlug } from "@/lib/instance/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateApiKeyDialog } from "./create-api-key-dialog";
import { RevokeKeyButton } from "./revoke-key-button";

interface ApiKey {
  id: string;
  name: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
}

export async function ApiKeysCard({ slug }: { slug: string }) {
  const instanceId = await getInstanceIdFromSlug(slug);
  const supabase = await createClient();

  const { data: keys } = await supabase
    .from("newspaper_api_keys")
    .select("id, name, scopes, created_at, last_used_at")
    .eq("instance_id", instanceId)
    .order("created_at", { ascending: false });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>API Keys</CardTitle>
        <CreateApiKeyDialog slug={slug} />
      </CardHeader>
      <CardContent>
        {!keys || keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No API keys yet. Create one to allow external access to your newspaper PDFs.
          </p>
        ) : (
          <div className="divide-y">
            {(keys as ApiKey[]).map((key) => (
              <div key={key.id} className="flex items-center justify-between py-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{key.name}</p>
                  <div className="flex gap-1">
                    {key.scopes.map((scope) => (
                      <Badge key={scope} variant="secondary" className="text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(key.created_at).toLocaleDateString()}
                    {key.last_used_at && (
                      <> · Last used {new Date(key.last_used_at).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                <RevokeKeyButton slug={slug} keyId={key.id} keyName={key.name} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
