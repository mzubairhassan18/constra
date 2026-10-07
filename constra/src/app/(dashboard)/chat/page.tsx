import Link from "next/link";
import { requireAccess } from "@/lib/access";
import ChatApp from "./ChatApp";

export default async function ChatPage() {
  await requireAccess("chat.read");
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chat</h1>
        <Link href="/dashboard" className="text-sm underline">Dashboard</Link>
      </header>
      <ChatApp />
    </main>
  );
}
