import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import {
  listMaterials,
  listSuppliers,
} from "@/modules/finance/adapters/ledger-neon";
import { addMaterialAction, addSupplierAction } from "./actions";

export const instant = false;

const input =
  "rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900";
const btn = "rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700";

export default async function MastersPage() {
  if (!(await getSessionUser())) redirect("/login");
  const [suppliers, materials] = await Promise.all([listSuppliers(), listMaterials()]);
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Masters</h1>
        <Link href="/dashboard" className="text-sm underline">Dashboard</Link>
      </header>
      <section className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="font-semibold">Suppliers</h2>
        <form action={addSupplierAction} className="mt-2 flex flex-wrap gap-2">
          <input name="name" required maxLength={200} placeholder="Name" className={input} />
          <input name="phone" maxLength={50} placeholder="Phone" className={input} />
          <input name="trnNo" maxLength={50} placeholder="TRN" className={input} />
          <button className={btn}>Add</button>
        </form>
        <ul className="mt-2 text-sm">
          {suppliers.map((s) => <li key={s.id}>{s.name}{s.trnNo ? ` · TRN ${s.trnNo}` : ""}</li>)}
        </ul>
      </section>
      <section className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="font-semibold">Materials</h2>
        <form action={addMaterialAction} className="mt-2 flex flex-wrap gap-2">
          <input name="name" required maxLength={200} placeholder="Name" className={input} />
          <input name="unit" maxLength={20} placeholder="Unit" className={input} />
          <button className={btn}>Add</button>
        </form>
        <ul className="mt-2 text-sm">
          {materials.map((m) => <li key={m.id}>{m.name}{m.unit ? ` (${m.unit})` : ""}</li>)}
        </ul>
      </section>
    </main>
  );
}
