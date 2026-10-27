import type { Metadata } from "next";
import { FormCadastro } from "./FormCadastro";

export const metadata: Metadata = { title: "Cadastro" };

export default function CadastroPage() {
  return <FormCadastro />;
}
