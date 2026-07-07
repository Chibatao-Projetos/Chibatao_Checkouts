# CONTEXT — Sistema de Saída de Pessoas

## Visão Geral

**Sistema de Autorização de Saída de Pessoas** (Chibatão Check Outs) é uma plataforma de gerenciamento de autorizações de saída de colaboradores em ambientes corporativos. O sistema implementa um **fluxo de aprovação de múltiplas etapas** com diferentes perfis de usuário (Solicitante, Gestor, RH, Portaria, Admin), permitindo controle, rastreabilidade e auditoria completa do processo — incluindo um mecanismo de **exceção com assunção de risco** para quando o RH está ausente.

**Objetivo**: Digitalizar e centralizar o controle de saídas, eliminando processos manuais em papel e fornecendo histórico e notificações de acesso.

---

## Stack Técnico

### Backend (Node — migrado do .NET em jun/2026)
- **NestJS** + **TypeScript** (controllers, módulos, injeção de dependência, guards)
- **Prisma** (ORM) sobre o banco existente (introspecção via `prisma db pull`)
- **PostgreSQL 18** como banco de dados
- **JWT** (`@nestjs/jwt`) para autenticação; **bcryptjs** para hash de senhas (compatível com os hashes BCrypt herdados do .NET)
- **nodemailer** para envio de e-mails (auditoria post-facto do RH)
- Pasta: **`backend-node/`**

**Endpoints base**: `http://localhost:5000/api` (escuta em `0.0.0.0`, acessível na rede)

> Histórico: o backend original era .NET 8 / ASP.NET Core / EF Core (pasta `backend/`), removido após a migração para Node. O contrato de API e o banco foram preservados, então o frontend não mudou na migração.

### Frontend
- **React 18** com **TypeScript**
- **React Router v6** para navegação SPA
- **Bootstrap 5** + **React-Bootstrap** para componentes UI (modais, formulários)
- **TailwindCSS** para utilitários de estilo (predominante nas telas de Admin)
- **Axios** para requisições HTTP
- **TanStack React Table** para tabelas

**Porta de desenvolvimento**: `http://localhost:3000`

---

## Arquitetura

### Camadas

```
Frontend (React/TypeScript)
    ↓ HTTP/JSON + JWT (Axios)
Backend (NestJS)
    ├─ Controllers (endpoints HTTP, /api)
    ├─ Services (regras de negócio)
    ├─ Guards globais (JwtAuthGuard + RolesGuard)
    └─ PrismaService (acesso a dados)
    ↓ Prisma
Database (PostgreSQL)
```

### Fluxo de Aprovação de Solicitação

```
Solicitante (ou Gestor, em nome de um colaborador) cria solicitação
    ↓ Status: AguardandoGestor   (extraordinária pula o gestor → AguardandoRH)
Gestor aprova/reprova
    ↓ Status: AguardandoRH (se aprovado)
        ↳ OU: Gestor aciona "Exceção Máxima" (bypass) → pula o RH,
          vai direto para LiberadoPortaria, com assunção de risco
RH aprova/reprova
    ↓ Status: LiberadoPortaria (se aprovado)
Portaria registra saída (hora, vigilante)
    ↓ Status: EmTransito  (ou Concluido, se não há previsão de retorno)
Portaria registra retorno
    ↓ Status: Concluido

Se houve bypass do RH: o RH recebe notificação (in-app + e-mail) para
validar a saída post-facto (PUT /:id/validar-bypass), sem travar o fluxo.
```

**Estados**: `AguardandoGestor` → `AguardandoRH` → `LiberadoPortaria` → `EmTransito` → `Concluido` ou `Reprovado`

---

## Módulos Principais e Responsabilidades

### Backend (`backend-node/src/`)

#### Módulos NestJS
- **auth/** — login (por e-mail OU matrícula, bcrypt; bloqueia contas `Pendente`/`Inativo`), registro (Setor validado contra lista fixa, Unidade obrigatória)
- **solicitacoes/** — listagem (escopo por perfil, filtros, ordenação, paginação), criar (com suporte a **saída por terceiros**), excluir pendente, aprovar/reprovar (gestor e RH), **aprovar-gestor-excecao** (bypass do RH) + **validar-bypass** (auditoria post-facto do RH), registrar saída/retorno, export CSV/JSON
- **notificacoes/** — `NotificacaoService` (in-app) + `MailService` (nodemailer, e-mail de auditoria do bypass) + endpoints (listar, contar não-lidas, marcar lida/todas)
- **usuarios/** — `GET /me`, `PUT /me/senha`, `GET /colaboradores` (lista para saída por terceiros)
- **admin/** — gerenciamento de usuários: listar (com filtros id/nome/busca/status), obter por id, aprovar, rejeitar, bloquear, excluir, alterar perfil, **alterar setor/unidade**, alterar senha — `@Roles('Admin')`
- **dashboard/** — estatísticas com escopo por perfil
- **prisma/** — `PrismaService`/`PrismaModule` (global)
- **common/** — guards (`JwtAuthGuard`, `RolesGuard`), decorators (`@Public`, `@Roles`, `@CurrentUser`), helpers de data, **`opcoes.ts`** (lista fixa de `SETORES_USUARIO` e `UNIDADES`, espelhada no frontend)

#### Modelos (Prisma — `prisma/schema.prisma`, introspectados + migrações incrementais via SQL em `prisma/sql/`)
- **Usuarios**: perfil (Solicitante/Gestor/RH/Portaria/Admin), status, setor, **unidade** (nova coluna, nullable), hash de senha
- **Solicitacoes**: rastreamento de aprovações (gestor/RH + datas), dados de saída/retorno, `DataSaida` (data+hora da saída), motivo de reprovação, **`IsBypassRH`/`BypassMotivo`** (exceção máxima do gestor), **`ColaboradorId`** (saída por terceiros — quem efetivamente sai, distinto de quem solicitou)
- **Notificacoes**: destinatário (UsuarioId), mensagem, tipo, lida, data, solicitação relacionada
- Enums armazenados como **string** no banco
- Migrações incrementais aplicadas via `npx prisma db execute --file prisma/sql/<arquivo>.sql` (não há sistema de migration formal do Prisma — mudanças de schema são SQL manual + `prisma generate`)

#### Características de Segurança
- JWT Bearer (claims: id, nome, email, role, setor; expira em 8h)
- Hash de senha com bcrypt
- RBAC global: `JwtAuthGuard` (autenticação) + `RolesGuard` (`@Roles(...)`)
- CORS aberto (auth por Bearer token, não cookies)
- Unique constraints em Email e Matrícula
- Segredos via `backend-node/.env` (`DATABASE_URL`, `JWT_SECRET`, `SMTP_*` opcional)
- **Sessão revalidada no frontend a cada carga do app** (ver Decisões Técnicas → Frontend)

### Frontend

#### Páginas
- **LoginPage**: autenticação (campos com ícones, mostrar/ocultar senha); avisos de "aguardando aprovação"
- **SignUpPage**: cadastro autosserviço — Setor e Unidade agora são **dropdowns** (antes texto livre), aviso de aprovação pendente
- **InicioPage**: visão inicial
- **SolicitacoesPessoasPage**: criação e listagem das próprias solicitações (com exclusão de pendentes, saída por terceiros)
- **SolicitacoesMatPage**: solicitações de material (placeholder)
- **AcessosGestorPage / AcessosRHPage / AcessosPortariaPage**: aprovações e registros por perfil; RH tem aba **"⚠ Auditoria Post-Facto"** para validar bypasses
- **AdminPage**: listagem única de usuários (sem abas — antes tinha "Pendentes"/"Todos"), com painel de filtros (ID/Nome/E-mail-Matrícula/Status) e status exibido como ícone
- **AdminUsuarioDetalhePage** *(novo)*: página dedicada (`/admin/usuarios/:id`) que concentra todas as ações de um usuário — aprovar/rejeitar, bloquear/reativar, excluir, alterar perfil, alterar setor/unidade, redefinir senha
- **PerfilPage**: perfil e troca de senha

#### Contextos & Serviços
- **AuthContext**: estado global de autenticação. **Revalida a sessão contra o backend** (`GET /usuarios/me`) a cada carga do app antes de considerar o usuário autenticado — token salvo no `localStorage` não é mais suficiente por si só (corrige falha onde uma sessão antiga parecia "logada" mesmo com o backend fora do ar). Expõe `checking` para a UI aguardar essa validação.
- **services/api.ts**: `authService`, `solicitacaoService` (inclui `aprovarGestorExcecao`, `validarBypass`), `usuariosService` (inclui `listarColaboradores`), `adminService` (inclui `obterUsuario`, `alterarSetor`, filtros), `dashboardService`, `notificacaoService`. `baseURL` dinâmica (`window.location.hostname`) → sobrevive a mudança de IP
- **constants/opcoes.ts**: `SETORES_USUARIO` (TIC/DEPOTS) e `UNIDADES_SETORES`/`UNIDADES` — fonte única reutilizada por `SignUpPage`, `AdminPage`/`AdminUsuarioDetalhePage` e `NovaSolicitacaoModal` (espelha `backend-node/src/common/opcoes.ts`)

#### Componentes-chave
- **AuthLayout**: sidebar + topbar para rotas autenticadas
- **Sidebar**: rodapé simplificado (só botão **Sair**, sem nome/perfil); ícones atualizados (Administração, Portaria, Material)
- **Topbar** com **NotificationBell** (sino com contador, polling ~30s, dropdown; clicar abre os detalhes)
- **DataTable** (TanStack): coluna **Ações primeira à esquerda** com botões circulares por ícone (Detalhes/Aceitar/Reprovar/Excluir/Exceção/Validar Post-Facto/Registrar Saída-Retorno), linhas de grade entre colunas, tudo centralizado, badge de **Exceção** destacado, layout em **cards no mobile** (mobile-first)
- **FilterPanel** + **DateRangePicker** (campo único de PERÍODO) + botão **Filtrar** (aplica só no clique) — estilo padrão replicado também no `AdminPage`
- **NovaSolicitacaoModal**: formulário em blocos numerados; campos data+hora de saída e de retorno; opção de **registrar saída para outro colaborador** (seleção de terceiro)
- **DetalhesSolicitacaoModal**: modal redesenhado (ícones de linha, seções com grid, timeline colorida) — mostra dados, resumo, aprovações (incluindo estado de bypass) e histórico do fluxo
- **ConfirmacaoAprovacaoModal** *(novo)*: trava de confirmação transversal ("Tem certeza que deseja aprovar essa solicitação do usuário [Nome]?") usada em toda aprovação/exceção/validação post-facto
- **UsuarioStatusPill** *(novo)*: indicador visual de status de conta (Pendente/Ativo/Bloqueado) com ícones dedicados, usado no `AdminPage` e `AdminUsuarioDetalhePage`
- **StatusBadge**, **ReprovacaoModal**

---

## Decisões Técnicas Relevantes

### Backend
1. **Reescrito em Node (NestJS) reusando o banco** — Prisma por introspecção; sem recriar schema nem perder dados. bcryptjs lê os hashes do .NET.
2. **Datas (compatível com o frontend)** — instantes (DataSolicitacao, HoraSaida/Retorno, DataAprovacao*, DataCadastro, DataCriacao) saem em **UTC ISO com `Z`**; datas de calendário (`DataSaida`, `DataPrevistaRetorno`) saem **naive (sem `Z`)** para não deslocar o dia. Helpers em `src/common/dates.ts`.
3. **Notificações internas + e-mail** — ponto único `NotificacaoService` (in-app) que também aciona `MailService` (nodemailer) no caso do bypass do RH. Nova solicitação → gestores do setor (match case-insensitive) **+ admins**; aprovações/reprovações → solicitante (e colaborador, se saída por terceiros); bypass → RH + admins (in-app e e-mail) para auditoria post-facto.
4. **Exceção Máxima (bypass do RH)** — o Gestor pode liberar uma solicitação direto para a Portaria com assunção de risco quando o RH está ausente. A solicitação fica marcada (`IsBypassRH`) e some da fila normal do RH, mas aparece na aba de **Auditoria Post-Facto** até ser validada (`RHAprovadorId` continua nulo até lá).
5. **Saída por terceiros** — quem cria a solicitação (`SolicitanteId`) pode ser diferente de quem efetivamente sai (`ColaboradorId`); nome/setor gravados na solicitação vêm do cadastro do colaborador selecionado, não do formulário livre.
6. **Setor/Unidade padronizados** — cadastro de usuário não aceita mais texto livre para Setor; validado contra lista fixa (`SETORES_USUARIO`) e exige Unidade (`UNIDADES`), replicando a lista de unidades já usada no destino das saídas a serviço.
7. **JWT sem refresh tokens (v1)** — TODO: refresh token.
8. **Migrações incrementais via SQL manual** — não há `prisma migrate`; alterações de schema são scripts em `prisma/sql/*.sql` aplicados com `prisma db execute`, seguidos de `prisma generate`. Regenerar o client no Windows exige parar o processo do backend antes (o `.dll` fica bloqueado — erro `EPERM`/`EADDRINUSE`).

### Frontend
1. **React Router v6** com `AuthLayout` (Outlet) e route guards
2. **Axios interceptors** — injeta JWT; em 401 (exceto login/registro) faz logout
3. **baseURL dinâmica** — acompanha o host do navegador (resistente a DHCP)
4. **localStorage para sessão, mas com revalidação obrigatória** — o token é lido do `localStorage` para exibir a UI otimisticamente, porém o `AuthContext` só confirma `isAuthenticated` depois de validar contra `GET /usuarios/me`. Isso corrige um problema real: antes, uma sessão antiga salva no navegador continuava "logada" na UI mesmo com o backend completamente fora do ar, pois nada revalidava o token (o interceptor de 401 só reage a uma *resposta* HTTP, e sem backend não há resposta). TODO: httpOnly cookies em produção.
5. **Ícones SVG inline (Lucide-style)** — sem biblioteca de ícones instalada; cada tela define os `<svg>` que precisa, seguindo o padrão de traçado do Lucide (`stroke-width=2`, `viewBox 0 0 24 24`) para manter consistência visual entre telas.
6. **Ações de aprovação/reprovação sempre passam por confirmação** — `ConfirmacaoAprovacaoModal` é o único caminho para aprovar/reprovar/bypassar/validar-post-facto em qualquer tela, evitando cliques acidentais.

---

## Estado Atual do Código

### Funcionalidades Implementadas ✅
- ✅ Autenticação JWT + registro com aprovação (Setor/Unidade via dropdown)
- ✅ **Sessão revalidada contra o backend** a cada carregamento do app (corrige sessão "fantasma" sem backend)
- ✅ Criação de solicitações com **data+hora de saída** e previsão de retorno
- ✅ **Saída por terceiros** — registrar saída em nome de outro colaborador
- ✅ **Exclusão de solicitação** pelo solicitante enquanto pendente
- ✅ Fluxo de aprovação (Gestor → RH), reprovação com motivo
- ✅ **Exceção Máxima (bypass do RH)** com assunção de risco pelo gestor + **auditoria post-facto** do RH (in-app + e-mail)
- ✅ Registro de saída/retorno (Portaria)
- ✅ **Tela de detalhes** (modal) com histórico, aprovadores, estado de bypass e ações Aprovar/Reprovar
- ✅ **Trava de confirmação** transversal em toda aprovação/exceção/validação
- ✅ **Notificações internas** (sino) + **e-mail** (bypass) para gestor/RH/admins/solicitante/colaborador
- ✅ Filtros (incl. **PERÍODO**) aplicados via botão **Filtrar**, paginação e ordenação
- ✅ **DataTable mobile-first** (cards em telas pequenas), ícones circulares padronizados nas ações, colunas centralizadas com grade
- ✅ **Painel admin unificado** (sem abas) com filtros (ID/Nome/E-mail-Matrícula/Status) e página de detalhe dedicada por usuário (aprovar/rejeitar/bloquear/excluir/perfil/**setor-unidade**/senha)
- ✅ Dashboard com estatísticas por perfil
- ✅ RBAC por perfil

### TODO / Melhorias
1. **Segurança**: httpOnly cookies, refresh tokens, rate limiting
2. **Features**: solicitações de material, relatórios (PDF/Excel), audit log completo
3. **Dados**: usuários cadastrados antes da migração de Unidade ficam com o campo nulo até um admin preencher
4. **DevOps**: Docker, CI/CD, ambientes staging/prod; formalizar migrações Prisma (hoje é SQL manual em `prisma/sql/`)
5. **Testes**: unit/integration/E2E
6. **E-mail**: configurar `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM` em produção (sem isso, o envio de auditoria do bypass só é logado, não enviado de fato)

### Estrutura de Pastas

```
/backend-node                 → Backend Node (NestJS)
  /prisma
    schema.prisma              → modelos (introspectados + evoluídos incrementalmente)
    /sql                       → migrações incrementais (SQL manual, aplicadas via `prisma db execute`)
  /src
    /auth /solicitacoes /notificacoes /usuarios /admin /dashboard
    /prisma                    → PrismaService/Module
    /common                    → guards, decorators, dates, opcoes.ts (setores/unidades)
    main.ts                    → bootstrap (porta 5000, 0.0.0.0, CORS)
    app.module.ts
  .env                         → DATABASE_URL, JWT_SECRET, PORT, SMTP_* (gitignored)

/frontend
  /saida-pessoas-app
    /src
      /pages                   → inclui AdminUsuarioDetalhePage (nova)
      /components
        /ui                    → StatusBadge, UsuarioStatusPill (novo)
        DataTable, ConfirmacaoAprovacaoModal (novo), DetalhesSolicitacaoModal, NovaSolicitacaoModal, ...
      /contexts /services /types /constants (opcoes.ts — novo)
      App.tsx, index.tsx

CONTEXT.md (este arquivo)
```

---

## Pontos de Integração (principais endpoints)

- **Auth**: `POST /api/auth/login` → `{ token, nome, perfil, userId, setor }`; `POST /api/auth/registro` (exige `setor` + `unidade` válidos)
- **Solicitações**: `GET /api/solicitacoes?page=&pageSize=&status=&setor=&tipoSaida=&dataInicio=&dataFim=&sortBy=&sortDesc=&minhas=&pendentesAuditoria=&...`; `GET /{id}`; `POST /` (aceita `colaboradorId`); `DELETE /{id}`; `PUT /{id}/aprovar-gestor|reprovar-gestor|aprovar-gestor-excecao|validar-bypass|aprovar-rh|reprovar-rh|registrar-saida|registrar-retorno`
- **Usuários**: `GET /api/usuarios/me`; `PUT /me/senha`; `GET /colaboradores`
- **Notificações**: `GET /api/notificacoes?limit=`; `GET /nao-lidas`; `PUT /{id}/lida`; `PUT /marcar-todas-lidas`
- **Admin**: `GET /api/admin/usuarios?status=&id=&nome=&busca=`; `GET /usuarios/{id}`; `PUT/DELETE /usuarios/{id}/aprovar|rejeitar|bloquear|perfil|setor|senha`
- **Dashboard**: `GET /api/dashboard/stats`

### Persistência
- **Database**: PostgreSQL 18 via Prisma (banco `saida_pessoas`, usuário de app `saida_app`)
- **Auth**: localStorage no navegador (com revalidação obrigatória contra o backend a cada carga — ver Decisões Técnicas)
- **Dados iniciais**: já existentes no banco; há um `seed.js` avulso em `backend-node/` para popular dados de teste

---

## Como Rodar Localmente

### Backend (Node)
```bash
cd backend-node
npm install            # (primeira vez)
npx prisma generate    # (primeira vez / após mudar o schema — pare o backend antes no Windows)
npm run start          # build + run  → http://localhost:5000/api
# dev com auto-reload: npm run start:dev
```
A conexão e o segredo JWT vêm de `backend-node/.env`.

> **Porta 5000**: só um backend por vez. `EADDRINUSE` = já há instância rodando (use `Ctrl+C` ou libere a porta).
> **`prisma generate` no Windows**: se der `EPERM` no `.dll` do query engine, pare todos os processos `node` do backend antes de rodar.

### Frontend
```bash
cd frontend/saida-pessoas-app
npm install
npm start              # http://localhost:3000
```

### Credenciais de Teste
Login por e-mail ou matrícula:
- **Admin**: admin@empresa.com (ADMIN001) / admin123
- **Solicitante**: solicitante@empresa.com (TI001) / 123456
- **Gestor**: gestor@empresa.com (TI002) / 123456
- **RH**: rh@empresa.com (RH001) / 123456
- **Portaria**: portaria@empresa.com (SEG001) / 123456

---

## Próximas Prioridades
1. Configurar SMTP em produção para o e-mail de auditoria do bypass funcionar de fato
2. Preencher Unidade dos usuários cadastrados antes da migração (hoje ficam com "—")
3. Segurança: httpOnly cookies + refresh tokens
4. Formalizar migrações do Prisma (hoje é SQL manual em `prisma/sql/`) e testes automatizados
