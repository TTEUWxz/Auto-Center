/**
 * Seed inicial: 1 oficina, 2 usuários, 5 clientes, 8 veículos,
 * catálogo de serviços e peças para testes.
 *
 * ATENÇÃO: Crie os usuários no Supabase Auth ANTES de rodar o seed.
 * O authId abaixo deve ser substituído pelo UUID real do Supabase.
 *
 * Como rodar:
 *   npm run db:seed
 */

import { PrismaClient, Combustivel } from "@prisma/client";

const prisma = new PrismaClient();

// Substitua pelos UUIDs reais do Supabase Auth após criar os usuários
const ADMIN_AUTH_ID = process.env.SEED_ADMIN_AUTH_ID ?? "00000000-0000-0000-0000-000000000001";
const ATEND_AUTH_ID = process.env.SEED_ATEND_AUTH_ID ?? "00000000-0000-0000-0000-000000000002";

async function main() {
  console.log("🌱 Iniciando seed...");

  // Tenant — Oficina do Tripinha
  const tenant = await prisma.tenant.upsert({
    where: { cnpj: "12.345.678/0001-99" },
    update: {},
    create: {
      nome: "Oficina do Tripinha",
      cnpj: "12.345.678/0001-99",
      telefone: "(21) 99999-0000",
      email: "tripinha@email.com",
      endereco: "Rua das Flores, 100",
      cidade: "Itaguaí",
      estado: "RJ",
      cep: "23810-000",
      horarios: {
        seg: "08:00-18:00",
        ter: "08:00-18:00",
        qua: "08:00-18:00",
        qui: "08:00-18:00",
        sex: "08:00-18:00",
        sab: "08:00-12:00",
        dom: "Fechado",
      },
      config: {
        corPrimaria: "#2563eb",
        templateWhatsApp:
          "Olá {cliente}! 👋 É hora de trazer seu {veiculo} ({placa}) para a {oficina}. Agende agora: (21) 99999-0000",
      },
      plano: "PRO",
    },
  });
  console.log(`✅ Tenant criado: ${tenant.nome}`);

  // Usuários
  const admin = await prisma.user.upsert({
    where: { authId: ADMIN_AUTH_ID },
    update: {},
    create: {
      tenantId: tenant.id,
      authId: ADMIN_AUTH_ID,
      nome: "Administrador",
      email: "admin@tripinha.com",
      papel: "ADMIN",
    },
  });

  const atendente = await prisma.user.upsert({
    where: { authId: ATEND_AUTH_ID },
    update: {},
    create: {
      tenantId: tenant.id,
      authId: ATEND_AUTH_ID,
      nome: "Maria Recepção",
      email: "maria@tripinha.com",
      papel: "ATENDENTE",
    },
  });
  console.log(`✅ Usuários: ${admin.nome}, ${atendente.nome}`);

  // Clientes
  const clientesData = [
    { nome: "João Silva", cpfCnpj: "111.222.333-44", telefone: "(21) 98765-4321", email: "joao@email.com", cidade: "Itaguaí" },
    { nome: "Maria Souza", cpfCnpj: "222.333.444-55", telefone: "(21) 91234-5678", email: "maria@email.com", cidade: "Itaguaí" },
    { nome: "Carlos Pereira", cpfCnpj: "333.444.555-66", telefone: "(21) 99876-5432", cidade: "Seropédica" },
    { nome: "Ana Costa", cpfCnpj: "444.555.666-77", telefone: "(21) 98888-7777", email: "ana@email.com", cidade: "Itaguaí" },
    { nome: "Pedro Martins", cpfCnpj: "555.666.777-88", telefone: "(21) 97777-6666", cidade: "Rio de Janeiro" },
  ];

  const clientes = [];
  for (const c of clientesData) {
    const cliente = await prisma.cliente.upsert({
      where: { id: `seed-${c.cpfCnpj}` },
      update: {},
      create: { id: `seed-${c.cpfCnpj}`, tenantId: tenant.id, ...c },
    });
    clientes.push(cliente);
  }
  console.log(`✅ ${clientes.length} clientes criados`);

  // Veículos (8)
  const veiculosData = [
    { clienteIdx: 0, placa: "ABC1D23", marca: "Volkswagen", modelo: "Gol", ano: 2018, cor: "Branco", kmAtual: 65000, combustivel: Combustivel.FLEX },
    { clienteIdx: 0, placa: "XYZ2E34", marca: "Fiat", modelo: "Uno", ano: 2015, cor: "Prata", kmAtual: 120000, combustivel: Combustivel.FLEX },
    { clienteIdx: 1, placa: "DEF3F45", marca: "Chevrolet", modelo: "Onix", ano: 2021, cor: "Preto", kmAtual: 28000, combustivel: Combustivel.FLEX },
    { clienteIdx: 2, placa: "GHI4G56", marca: "Toyota", modelo: "Corolla", ano: 2020, cor: "Prata", kmAtual: 45000, combustivel: Combustivel.FLEX },
    { clienteIdx: 2, placa: "JKL5H67", marca: "Honda", modelo: "Civic", ano: 2019, cor: "Azul", kmAtual: 78000, combustivel: Combustivel.GASOLINA },
    { clienteIdx: 3, placa: "MNO6I78", marca: "Renault", modelo: "Sandero", ano: 2017, cor: "Vermelho", kmAtual: 92000, combustivel: Combustivel.FLEX },
    { clienteIdx: 4, placa: "PQR7J89", marca: "Ford", modelo: "Ka", ano: 2016, cor: "Branco", kmAtual: 110000, combustivel: Combustivel.FLEX },
    { clienteIdx: 4, placa: "STU8K90", marca: "Hyundai", modelo: "HB20", ano: 2022, cor: "Cinza", kmAtual: 15000, combustivel: Combustivel.FLEX },
  ];

  for (const v of veiculosData) {
    await prisma.veiculo.upsert({
      where: { id: `seed-${v.placa}` },
      update: {},
      create: {
        id: `seed-${v.placa}`,
        tenantId: tenant.id,
        clienteId: clientes[v.clienteIdx].id,
        placa: v.placa,
        marca: v.marca,
        modelo: v.modelo,
        ano: v.ano,
        cor: v.cor,
        kmAtual: v.kmAtual,
        combustivel: v.combustivel,
      },
    });
  }
  console.log(`✅ 8 veículos criados`);

  // Catálogo de Serviços
  const servicosData = [
    { nome: "Troca de Óleo", descricao: "Troca de óleo + filtro", precoPadrao: 80, tempoEstimado: 30 },
    { nome: "Alinhamento", descricao: "Alinhamento computadorizado", precoPadrao: 80, tempoEstimado: 60 },
    { nome: "Balanceamento", descricao: "Balanceamento das 4 rodas", precoPadrao: 60, tempoEstimado: 45 },
    { nome: "Revisão Geral", descricao: "Revisão completa preventiva", precoPadrao: 200, tempoEstimado: 180 },
    { nome: "Troca de Pastilha de Freio", descricao: "Troca das pastilhas dianteiras", precoPadrao: 120, tempoEstimado: 60 },
    { nome: "Troca de Amortecedor", descricao: "Por unidade", precoPadrao: 150, tempoEstimado: 90 },
    { nome: "Higienização do Ar-Condicionado", descricao: "Limpeza e higienização do sistema", precoPadrao: 90, tempoEstimado: 40 },
    { nome: "Diagnóstico Eletrônico", descricao: "Leitura de falhas com scanner", precoPadrao: 50, tempoEstimado: 30 },
  ];

  for (const s of servicosData) {
    await prisma.servico.upsert({
      where: { id: `seed-svc-${s.nome}` },
      update: {},
      create: {
        id: `seed-svc-${s.nome}`,
        tenantId: tenant.id,
        ...s,
        precoPadrao: s.precoPadrao,
      },
    });
  }
  console.log(`✅ ${servicosData.length} serviços no catálogo`);

  // Peças de estoque
  const pecasData = [
    { nome: "Óleo Motor 5W30 (1L)", codigo: "OL-5W30", precoCusto: 18, precoVenda: 28, quantidade: 50, estoqueMinimo: 10 },
    { nome: "Filtro de Óleo Universal", codigo: "FO-001", precoCusto: 12, precoVenda: 22, quantidade: 30, estoqueMinimo: 5 },
    { nome: "Filtro de Ar", codigo: "FA-001", precoCusto: 25, precoVenda: 40, quantidade: 15, estoqueMinimo: 3 },
    { nome: "Pastilha de Freio Dianteira (jogo)", codigo: "PF-DIAN", precoCusto: 45, precoVenda: 75, quantidade: 8, estoqueMinimo: 2 },
    { nome: "Vela de Ignição (unidade)", codigo: "VI-001", precoCusto: 15, precoVenda: 25, quantidade: 40, estoqueMinimo: 8 },
    { nome: "Correia Dentada", codigo: "CD-001", precoCusto: 35, precoVenda: 60, quantidade: 5, estoqueMinimo: 2 },
    { nome: "Fluido de Freio DOT4 (500ml)", codigo: "FF-DOT4", precoCusto: 14, precoVenda: 24, quantidade: 2, estoqueMinimo: 3 }, // estoque baixo!
    { nome: "Amortecedor Dianteiro", codigo: "AM-DIAN", precoCusto: 120, precoVenda: 180, quantidade: 4, estoqueMinimo: 1 },
  ];

  for (const p of pecasData) {
    await prisma.peca.upsert({
      where: { id: `seed-peca-${p.codigo}` },
      update: {},
      create: {
        id: `seed-peca-${p.codigo}`,
        tenantId: tenant.id,
        ...p,
      },
    });
  }
  console.log(`✅ ${pecasData.length} peças no estoque (1 com estoque baixo)`);

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log(`\n📋 Resumo:`);
  console.log(`   Tenant: ${tenant.nome} (id: ${tenant.id})`);
  console.log(`   Admin: admin@tripinha.com`);
  console.log(`   Atendente: maria@tripinha.com`);
  console.log(`\n⚠️  Lembre-se de:`);
  console.log(`   1. Criar os usuários no Supabase Auth com os e-mails acima`);
  console.log(`   2. Atualizar SEED_ADMIN_AUTH_ID e SEED_ATEND_AUTH_ID no .env com os UUIDs reais`);
  console.log(`   3. Rodar o seed novamente após atualizar os IDs`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
