import { QueryProvider } from "@/lib/query/provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <QueryProvider>{children}</QueryProvider>;
}
