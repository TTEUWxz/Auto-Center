import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { ClipboardList, Users, DollarSign, Package, Bell } from "lucide-react";

const DEV_TENANT_ID = "cmqh7evrp000051qpcj5ebji7";

async function getDashboardData(tenantId: string) {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  const [totalOSMes, osPorStatus, faturamentoMes, retornosPendentes, totalClientes] =
    await Promise.all([
      prisma.ordemServico.count({
        where: { tenantId, createdAt: { gte: inicioMes, lte: fimMes } },
      }),
      prisma.ordemServico.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: true,
      }),
      prisma.lancamentoFinanceiro.aggregate({
        where: {
          tenantId,
          tipo: "RECEITA",
          status: "PAGO",
          dataPagamento: { gte: inicioMes, lte: fimMes },
        },
        _sum: { valor: true },
      }),
      prisma.lembreteRetorno.count({
        where: {
          tenantId,
          status: "AGENDADO",
          dataPrevista: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.cliente.count({ where: { tenantId, ativo: true } }),
    ]);

  const pecasEstoqueBaixo = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM pecas
    WHERE "tenantId" = ${tenantId} AND ativo = true AND quantidade <= "estoqueMinimo"
  `;

  return {
    totalOSMes,
    osPorStatus,
    faturamentoMes: Number(faturamentoMes._sum.valor ?? 0),
    estoqueBaixo: Number(pecasEstoqueBaixo[0]?.count ?? 0),
    retornosPendentes,
    totalClientes,
  };
}

const statusMap: Record<string, string> = {
  ORCAMENTO: "Orçamento",
  APROVADA: "Aprovada",
  EM_EXECUCAO: "Em Execução",
  CONCLUIDA: "Concluída",
  ENTREGUE: "Entregue",
  CANCELADA: "Cancelada",
};

export default async function DashboardPage() {
  const data = await getDashboardData(DEV_TENANT_ID);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Visão geral da oficina</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="OS no mês"
          value={data.totalOSMes.toString()}
          icon={<ClipboardList className="w-5 h-5 text-blue-600" />}
          bg="bg-blue-50"
        />
        <StatCard
          title="Faturamento (mês)"
          value={formatCurrency(data.faturamentoMes)}
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
          bg="bg-green-50"
        />
        <StatCard
          title="Clientes ativos"
          value={data.totalClientes.toString()}
          icon={<Users className="w-5 h-5 text-purple-600" />}
          bg="bg-purple-50"
        />
        <StatCard
          title="Estoque baixo"
          value={data.estoqueBaixo.toString()}
          icon={<Package className="w-5 h-5 text-orange-600" />}
          bg="bg-orange-50"
          alert={data.estoqueBaixo > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">OS por Status</h2>
          <div className="space-y-2">
            {data.osPorStatus.length === 0 && (
              <p className="text-sm text-slate-400">Nenhuma OS cadastrada ainda.</p>
            )}
            {data.osPorStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{statusMap[item.status] ?? item.status}</span>
                <span className="font-medium text-slate-900">{item._count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-slate-900">Retornos Próximos (7 dias)</h2>
          </div>
          <div className="text-3xl font-bold text-blue-600">{data.retornosPendentes}</div>
          <p className="text-sm text-slate-500 mt-1">lembretes pendentes</p>
          {data.retornosPendentes > 0 && (
            <a href="/retornos" className="text-sm text-blue-600 hover:underline mt-3 block">
              Ver todos →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title, value, icon, bg, alert,
}: {
  title: string; value: string; icon: React.ReactNode; bg: string; alert?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-5 ${alert ? "border-orange-300 bg-orange-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-600">{title}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
