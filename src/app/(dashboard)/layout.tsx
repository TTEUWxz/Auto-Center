import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";

// Tenant fixo do seed para desenvolvimento sem login
const DEV_TENANT_ID = "cmqh7evrp000051qpcj5ebji7";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: DEV_TENANT_ID },
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar tenantNome={tenant?.nome ?? "AutoCenter"} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
