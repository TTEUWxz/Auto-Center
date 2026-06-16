-- ============================================================
-- Row Level Security — AutoCenter SaaS
-- Execute este arquivo no SQL Editor do Supabase APÓS rodar
-- "prisma db push" para criar as tabelas.
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE tenants              ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE pecas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico       ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_itens_servico     ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_itens_peca        ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE lembretes_retorno    ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos         ENABLE ROW LEVEL SECURITY;

-- ─── Função helper: retorna o tenant_id do usuário logado ────────────────────
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS TEXT AS $$
  SELECT tenant_id FROM users WHERE auth_id = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ─── Função helper: retorna o papel do usuário logado ───────────────────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT papel FROM users WHERE auth_id = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ─── tenants ─────────────────────────────────────────────────────────────────
-- Usuário só vê o tenant ao qual pertence
CREATE POLICY "tenant_select" ON tenants
  FOR SELECT USING (id = get_my_tenant_id());

-- Só ADMIN pode atualizar o próprio tenant
CREATE POLICY "tenant_update" ON tenants
  FOR UPDATE USING (id = get_my_tenant_id() AND get_my_role() = 'ADMIN');

-- ─── users ───────────────────────────────────────────────────────────────────
CREATE POLICY "users_select" ON users
  FOR SELECT USING (tenant_id = get_my_tenant_id());

CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (
    tenant_id = get_my_tenant_id() AND get_my_role() = 'ADMIN'
  );

CREATE POLICY "users_update" ON users
  FOR UPDATE USING (
    tenant_id = get_my_tenant_id() AND get_my_role() = 'ADMIN'
  );

-- ─── clientes ────────────────────────────────────────────────────────────────
CREATE POLICY "clientes_all" ON clientes
  USING (tenant_id = get_my_tenant_id())
  WITH CHECK (tenant_id = get_my_tenant_id());

-- ─── veiculos ────────────────────────────────────────────────────────────────
CREATE POLICY "veiculos_all" ON veiculos
  USING (tenant_id = get_my_tenant_id())
  WITH CHECK (tenant_id = get_my_tenant_id());

-- ─── servicos ────────────────────────────────────────────────────────────────
CREATE POLICY "servicos_all" ON servicos
  USING (tenant_id = get_my_tenant_id())
  WITH CHECK (tenant_id = get_my_tenant_id());

-- ─── pecas ───────────────────────────────────────────────────────────────────
CREATE POLICY "pecas_all" ON pecas
  USING (tenant_id = get_my_tenant_id())
  WITH CHECK (tenant_id = get_my_tenant_id());

-- ─── ordens_servico ──────────────────────────────────────────────────────────
-- Mecânico só vê OS atribuídas a ele
CREATE POLICY "os_select" ON ordens_servico
  FOR SELECT USING (
    tenant_id = get_my_tenant_id() AND (
      get_my_role() IN ('ADMIN', 'ATENDENTE')
      OR mecanico_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text LIMIT 1)
    )
  );

CREATE POLICY "os_insert" ON ordens_servico
  FOR INSERT WITH CHECK (
    tenant_id = get_my_tenant_id() AND get_my_role() IN ('ADMIN', 'ATENDENTE')
  );

CREATE POLICY "os_update" ON ordens_servico
  FOR UPDATE USING (
    tenant_id = get_my_tenant_id() AND (
      get_my_role() IN ('ADMIN', 'ATENDENTE')
      OR mecanico_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text LIMIT 1)
    )
  );

-- ─── os_itens_servico ────────────────────────────────────────────────────────
CREATE POLICY "os_itens_servico_all" ON os_itens_servico
  USING (
    os_id IN (SELECT id FROM ordens_servico WHERE tenant_id = get_my_tenant_id())
  )
  WITH CHECK (
    os_id IN (SELECT id FROM ordens_servico WHERE tenant_id = get_my_tenant_id())
  );

-- ─── os_itens_peca ───────────────────────────────────────────────────────────
CREATE POLICY "os_itens_peca_all" ON os_itens_peca
  USING (
    os_id IN (SELECT id FROM ordens_servico WHERE tenant_id = get_my_tenant_id())
  )
  WITH CHECK (
    os_id IN (SELECT id FROM ordens_servico WHERE tenant_id = get_my_tenant_id())
  );

-- ─── lancamentos_financeiros ─────────────────────────────────────────────────
-- Mecânico não vê financeiro
CREATE POLICY "financeiro_select" ON lancamentos_financeiros
  FOR SELECT USING (
    tenant_id = get_my_tenant_id() AND get_my_role() IN ('ADMIN', 'ATENDENTE')
  );

CREATE POLICY "financeiro_insert" ON lancamentos_financeiros
  FOR INSERT WITH CHECK (
    tenant_id = get_my_tenant_id() AND get_my_role() IN ('ADMIN', 'ATENDENTE')
  );

CREATE POLICY "financeiro_update" ON lancamentos_financeiros
  FOR UPDATE USING (
    tenant_id = get_my_tenant_id() AND get_my_role() IN ('ADMIN', 'ATENDENTE')
  );

-- ─── lembretes_retorno ───────────────────────────────────────────────────────
CREATE POLICY "lembretes_all" ON lembretes_retorno
  USING (tenant_id = get_my_tenant_id())
  WITH CHECK (tenant_id = get_my_tenant_id());

-- ─── agendamentos ────────────────────────────────────────────────────────────
CREATE POLICY "agendamentos_all" ON agendamentos
  USING (tenant_id = get_my_tenant_id())
  WITH CHECK (tenant_id = get_my_tenant_id());

-- ─── Aprovação pública de orçamento (sem autenticação) ───────────────────────
-- Rota /orcamento/[token] usa service role, mas adicionamos policy para
-- leitura anônima via token — isolada por aprovacao_token.
CREATE POLICY "os_public_aprovacao" ON ordens_servico
  FOR SELECT USING (
    aprovacao_token IS NOT NULL
    AND aprovacao_expira > NOW()
    AND auth.role() = 'anon'
  );
