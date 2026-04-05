import entries from "@/data/entries.json";
import events from "@/data/events.json";
import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const serverNow = new Date().toISOString();

  return (
    <HomeClient
      initialEntries={entries}
      initialEvents={events}
      initialServerNow={serverNow}
    />
  );
}
