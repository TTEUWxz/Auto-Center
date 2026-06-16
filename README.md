# AutoCenter — Sistema de Gestão para Oficinas Mecânicas

SaaS multi-tenant para auto centers e oficinas mecânicas. Construído com Next.js 14, Supabase e Prisma.

## Stack

- **Next.js 14** (App Router + TypeScript)
- **Supabase** (PostgreSQL + Auth + RLS)
- **Prisma** (ORM + migrations)
- **Tailwind CSS + shadcn/ui**
- **TanStack Query** + **React Hook Form** + **Zod**

---

## Setup (passo a passo)

### 1. Pré-requisitos

- Node.js 20+ instalado
- Conta no [Supabase](https://supabase.com) (gratuita serve para desenvolvimento)
- Git

### 2. Clone e instale dependências

```bash
git clone <url-do-repositorio> autocenter
cd autocenter
npm install
```

### 3. Configure o Supabase

1. Acesse [supabase.com](https://supabase.com) → **New project**
2. Anote as credenciais em **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
3. Em **Project Settings → Database → Connection string** copie a string com `[YOUR-PASSWORD]`

### 4. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais do Supabase.

### 5. Execute as migrations do banco

```bash
npm run db:push        # cria as tabelas no Supabase
```

### 6. Configure o Row Level Security (RLS)

No painel do Supabase, vá em **SQL Editor** e execute o conteúdo de:

```
supabase/rls-policies.sql
```

### 7. Crie usuários no Supabase Auth

No painel do Supabase → **Authentication → Users → Add user**:

- `admin@tripinha.com` / senha forte
- `maria@tripinha.com` / senha forte

Copie os UUIDs gerados e adicione ao `.env`:

```env
SEED_ADMIN_AUTH_ID=uuid-do-admin-aqui
SEED_ATEND_AUTH_ID=uuid-da-maria-aqui
```

### 8. Rode o seed

```bash
npm run db:seed
```

### 9. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

**Login:** `admin@tripinha.com` com a senha que você criou.

---

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run db:push` | Sincroniza schema com o banco (sem migration) |
| `npm run db:migrate` | Cria migration versionada |
| `npm run db:seed` | Popula banco com dados de teste |
| `npm run db:studio` | Abre o Prisma Studio (GUI do banco) |

---

## Milestones

| # | Módulo | Status |
|---|--------|--------|
| M0 | Setup, Auth, Multi-tenant, Layout | ✅ Concluído |
| M1 | Clientes e Veículos | 🔲 Pendente |
| M2 | Orçamento / Ordem de Serviço | 🔲 Pendente |
| M3 | Estoque + Financeiro | 🔲 Pendente |
| M4 | Lembretes de Retorno WhatsApp | 🔲 Pendente |
| M5 | Dashboard + Agenda + Configurações | 🔲 Pendente |
| M6 | Billing, WhatsApp Cloud API, NFS-e | 🔲 Fase 2 |

---

## Estrutura de pastas

```
autocenter/
├── prisma/
│   ├── schema.prisma          # Schema completo do banco
│   └── seeds/seed.ts          # Dados iniciais para teste
├── supabase/
│   └── rls-policies.sql       # Policies de Row Level Security
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Página de login
│   │   ├── (dashboard)/       # Área autenticada
│   │   │   ├── layout.tsx     # Layout com sidebar
│   │   │   ├── dashboard/     # Dashboard principal
│   │   │   ├── clientes/      # M1
│   │   │   ├── veiculos/      # M1
│   │   │   ├── ordens-servico/ # M2
│   │   │   ├── estoque/       # M3
│   │   │   ├── financeiro/    # M3
│   │   │   ├── retornos/      # M4
│   │   │   ├── agenda/        # M5
│   │   │   └── configuracoes/ # M5
│   │   └── api/               # Route handlers
│   ├── components/
│   │   ├── layout/sidebar.tsx # Sidebar de navegação
│   │   └── ui/                # Componentes shadcn/ui
│   ├── lib/
│   │   ├── prisma.ts          # Cliente Prisma (singleton)
│   │   ├── utils.ts           # Utilitários (cn, formatação, WhatsApp)
│   │   └── supabase/          # Clientes Supabase (server + client)
│   ├── hooks/                 # React hooks customizados
│   ├── types/                 # TypeScript types/interfaces
│   └── middleware.ts          # Proteção de rotas + refresh de session
└── README.md
```

---

## Deploy (Vercel + Supabase)

1. Push para GitHub
2. Conecte no [vercel.com](https://vercel.com)
3. Adicione as variáveis de ambiente do `.env` no painel da Vercel
4. Deploy automático a cada push na `main`

---

## Arquitetura multi-tenant

Cada oficina é um **Tenant**. Todas as tabelas possuem `tenant_id`. O isolamento é garantido por **Row Level Security (RLS)** no PostgreSQL — mesmo que haja um bug no código, os dados de uma oficina nunca vazam para outra.

A função `get_my_tenant_id()` no banco lê o `tenant_id` do usuário logado via `auth.uid()` do Supabase, tornando o isolamento automático em toda query.
