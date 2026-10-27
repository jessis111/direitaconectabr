import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp"];

function extensao(tipo: string) {
  return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" }[tipo] ?? "bin";
}

export function arquivoValido(v: FormDataEntryValue | null): v is File {
  return v instanceof File && v.size > 0;
}

// Sobe a foto de perfil em avatars/<membro>/ e devolve a URL pública.
export async function enviarAvatar(supabase: SupabaseClient, membroId: string, arquivo: File) {
  if (!TIPOS_IMAGEM.includes(arquivo.type)) throw new Error("Use uma foto JPG, PNG ou WebP");
  if (arquivo.size > 5 * 1024 * 1024) throw new Error("A foto precisa ter até 5 MB");
  const caminho = `${membroId}/${Date.now()}.${extensao(arquivo.type)}`;
  const { error } = await supabase.storage.from("avatars").upload(caminho, arquivo, {
    contentType: arquivo.type,
    upsert: true,
  });
  if (error) throw new Error("Não foi possível enviar a foto");
  return supabase.storage.from("avatars").getPublicUrl(caminho).data.publicUrl;
}
