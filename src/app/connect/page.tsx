import type { Metadata } from "next";
import { Suspense } from "react";
import { ConnectView } from "@/components/connect-view";

export const metadata: Metadata = { title: "Gather your threads" };

async function ConnectWithParams({ searchParams }: { searchParams: PageProps<"/connect">["searchParams"] }) {
  const sp = await searchParams;
  return (
    <ConnectView
      connected={typeof sp.connected === "string" ? sp.connected : null}
      error={typeof sp.error === "string" ? sp.error : null}
    />
  );
}

export default function ConnectPage({ searchParams }: PageProps<"/connect">) {
  return (
    <Suspense>
      <ConnectWithParams searchParams={searchParams} />
    </Suspense>
  );
}
