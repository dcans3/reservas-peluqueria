// Layout de /panel/ajustes/...: título y pestañas. Solo para el rol 'admin'.

import type { ReactNode } from "react";
import { exigirAdmin } from "@/lib/supabase/sesion";
import { Pestanas } from "./Pestanas";

export default async function LayoutAjustes({ children }: { children: ReactNode }) {
  await exigirAdmin();

  return (
    <div className="grid gap-4">
      <h1 className="rotulo text-5xl sm:text-6xl">Ajustes</h1>
      <Pestanas />
      {children}
    </div>
  );
}
