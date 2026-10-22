import { redirect } from "next/navigation";
import { Suspense } from "react";

async function Redirector({ searchParams }: { searchParams: PageProps<"/story">["searchParams"] }) {
  const sp = await searchParams;
  redirect(sp.demo === "1" ? "/week?demo=1&story=1" : "/week?story=1");
  return null;
}

export default function StoryPage({ searchParams }: PageProps<"/story">) {
  return (
    <Suspense>
      <Redirector searchParams={searchParams} />
    </Suspense>
  );
}
