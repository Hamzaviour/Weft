import type { Metadata } from "next";
import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard";

export const metadata: Metadata = { title: "Your week" };

async function WeekWithParams({ searchParams }: { searchParams: PageProps<"/week">["searchParams"] }) {
  const sp = await searchParams;
  return <Dashboard demo={sp.demo === "1"} autoplay={sp.story === "1"} />;
}

export default function WeekPage({ searchParams }: PageProps<"/week">) {
  return (
    <Suspense>
      <WeekWithParams searchParams={searchParams} />
    </Suspense>
  );
}
