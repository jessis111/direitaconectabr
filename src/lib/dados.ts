import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";
import { SLUG_UGC } from "./constantes";
import type { Categoria } from "./types";

export const categorias = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, nome, slug, ordem, ativa, campos_extras")
    .eq("ativa", true)
    .order("ordem");
  const lista = (data ?? []) as Categoria[];
  const porId = new Map(lista.map((c) => [c.id, c]));
  const ugc = lista.find((c) => c.slug === SLUG_UGC) ?? null;
  return { lista, porId, ugc, gerais: lista.filter((c) => c.slug !== SLUG_UGC) };
});
