import { exigirAdmin } from "@/lib/auth";
import { AbasAdmin } from "./AbasAdmin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await exigirAdmin();
  return (
    <div>
      <AbasAdmin />
      {children}
    </div>
  );
}
