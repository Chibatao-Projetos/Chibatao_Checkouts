# CONTEXT — Sistema de Saída de Pessoas

## Visão Geral

**Sistema de Autorização de Saída de Pessoas** (Chibatão Check Outs / "ccheckouts") é uma plataforma de gerenciamento de autorizações de saída de colaboradores em ambientes corporativos. O sistema implementa um **fluxo de aprovação de múltiplas etapas**, com regras diferentes por tipo de saída, e diferentes perfis de usuário (Solicitante, Gestor, RH, Portaria, Admin), permitindo controle, rastreabilidade e auditoria completa do processo — incluindo mecanismos de **exceção** para quando Gestor ou RH estão ausentes.

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

**Endpoints base**: `http://localhost:5000/api` (escuta em `0.0.0.0`, acessível na rede). Em produção, o backend escuta na porta **8003**.

> Histórico: o backend original era .NET 8 / ASP.NET Core / EF Core (pasta `backend/`), removido após a migração para Node. O contrato de API e o banco foram preservados, então o frontend não mudou na migração.

### Frontend
- **React 18** com **TypeScript**
- **React Router v6** para navegação SPA
- **Bootstrap 5** + **React-Bootstrap** para componentes UI (modais, formulários, páginas de auth)
- **TailwindCSS** para utilitários de estilo (predominante nas telas de Admin)
- **Axios** para requisições HTTP
- **TanStack React Table** para tabelas
- Sem biblioteca de ícones — SVGs inline em estilo Lucide (`stroke-width=2`, `viewBox 0 0 24 24`) em cada componente que precisa

**Porta de desenvolvimento**: `http://localhost:3000`. Em produção, servido estático (`serve -s build`) na porta **8004**.

---

## Infraestrutura de Produção

- **Domínio**: `ccheckouts.chibatao.local`, servidor `192.168.200.245`
- **Nginx** (via **aaPanel**, config em `/www/server/panel/vhost/nginx/`) faz o reverse proxy:
  - `location /api` → `http://192.168.200.245:8003` (backend NestJS) — **precisa vir antes** do include do aaPanel, senão o `location /` genérico intercepta tudo
  - `location /` (resto) → include do aaPanel → `192.168.200.245:8004` (frontend estático via `serve`)
- **PM2** gerencia os dois processos: `saida-backend` (`dist/main.js`, porta 8003) e `saida-frontend` (`serve -s build -l 8004`)
- **Scripts de deploy** (raiz do repo, **não versionados no git** — contêm a senha SSH do servidor em texto puro, tratar com cuidado):
  - `deploy_setup.py` — setup completo do zero (env, install, prisma db push, build, PM2, usuário admin)
  - `deploy_update.py` — fluxo de atualização de rotina: upload (SFTP, exclui `node_modules`/`.env`/`build`/`dist`) → aplica migrações SQL novas (`prisma db execute`, idempotentes) → `npm install` + `prisma generate` → build backend → build frontend → `pm2 restart` nos dois → smoke test (`curl` local no servidor)
  - Demais (`deploy_fix.py`, `deploy_seed.py`, `deploy_seed2.py`, `deploy_rebuild_front.py`, `deploy_upload.py`) são scripts pontuais de correções já aplicadas — histórico, não fazem parte do fluxo atual
- **`nginx_ccheckouts.conf`** (raiz do repo, também fora do git) — cópia de referência da config vhost do aaPanel

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

O fluxo depende do **tipo de saída** e do **destino** (para À Serviço):

```
PARTICULAR — fluxo completo sempre:
Solicitante cria solicitação
    ↓ Status: AguardandoGestor   (Extraordinária pula o Gestor → AguardandoRH direto)
Gestor aprova/reprova
    ↓ Status: AguardandoRH (se aprovado)
        ↳ OU: Gestor aciona "Exceção Máxima" (bypass) → pula o RH, vai direto
          para LiberadoPortaria, com assunção de risco (só disponível aqui —
          não faz sentido numa Extraordinária, que já tem o RH no comando)
RH aprova/reprova
    ↓ Status: LiberadoPortaria (se aprovado)

À SERVIÇO — RH só entra se o destino exigir, ou se for Extraordinária:
Solicitante (ou Gestor, em nome de um colaborador) cria solicitação
    ↓ Status: AguardandoGestor   (Extraordinária pula o Gestor → AguardandoRH direto)
Gestor aprova
    ↓ Se a Unidade de Destino EXIGE RH (hoje: JF)  → Status: AguardandoRH → RH aprova → LiberadoPortaria
    ↓ Se NÃO exige RH (demais unidades)            → Status: LiberadoPortaria (direto)

TODOS OS TIPOS, a partir de LiberadoPortaria:
Portaria registra saída (confirmação "Tem certeza que deseja realizar a saída
do colaborador [Nome]?", hora, vigilante)
    ↓ Status: EmTransito  (ou Concluido, se não há previsão de retorno)
Portaria registra retorno (mesma confirmação, adaptada)
    ↓ Status: Concluido

Se houve bypass do RH (Exceção Máxima): o RH recebe notificação (in-app + e-mail)
para validar a saída post-facto (PUT /:id/validar-bypass), sem travar o fluxo.
Essas saídas aparecem misturadas na tela normal do RH (não há mais aba separada).
```

**Estados**: `AguardandoGestor` → `AguardandoRH` (condicional) → `LiberadoPortaria` → `EmTransito` → `Concluido` ou `Reprovado`

**Regras de quem pode pular quem** (`UNIDADES_COM_RH_OBRIGATORIO = ['JF']`, espelhada em backend e frontend):
| Mecanismo | O que faz | Vale para |
|---|---|---|
| **Extraordinária** | Pula o Gestor (ausente) → RH aprova em seu lugar | Particular **e** À Serviço |
| **Exceção Máxima** | Pula o RH (ausente) → Gestor aprova assumindo o risco | Só Particular, e só se **não** for Extraordinária |
| **À Serviço fora de JF** | RH nunca entra no fluxo (Gestor já libera pra Portaria) | Só À Serviço, destino ≠ unidade que exige RH |

---

## Módulos Principais e Responsabilidades

### Backend (`backend-node/src/`)

#### Módulos NestJS
- **auth/** — login (por e-mail OU matrícula, bcrypt; bloqueia contas `Pendente`/`Inativo`), registro (Setor validado contra lista fixa, Unidade obrigatória)
- **solicitacoes/** — listagem (escopo por perfil — ver regra especial do RH abaixo —, filtros, ordenação, paginação), criar (com suporte a **saída por terceiros**, Extraordinária para qualquer tipo), excluir pendente, aprovar/reprovar (gestor e RH, com roteamento condicional pós-Gestor), **aprovar-gestor-excecao** (bypass do RH, só Particular não-extraordinária) + **validar-bypass** (auditoria post-facto do RH), registrar saída/retorno, export CSV/JSON
  - **Escopo de listagem do RH**: só vê solicitações Particulares, Extraordinárias (qualquer tipo) ou À Serviço para unidades que exigem RH — À Serviço "normal" (sem exigência de RH) nunca aparece pra ele, porque nunca vai passar pela fila dele
- **notificacoes/** — `NotificacaoService` (in-app) + `MailService` (nodemailer, e-mail de auditoria do bypass) + endpoints (listar, contar não-lidas, marcar lida/todas)
- **usuarios/** — `GET /me`, `PUT /me/senha`, `GET /colaboradores` (lista para saída por terceiros)
- **admin/** — gerenciamento de usuários: listar (filtros id/nome/busca/status + **ordenação** por qualquer coluna incl. perfil), obter por id, aprovar, rejeitar, bloquear, excluir, alterar perfil, **alterar setor/unidade** (cascateia para solicitações ainda `AguardandoGestor` do próprio usuário, corrigindo roteamento ao gestor certo), alterar senha — `@Roles('Admin')`
- **dashboard/** — estatísticas com escopo por perfil
- **prisma/** — `PrismaService`/`PrismaModule` (global)
- **common/** — guards (`JwtAuthGuard`, `RolesGuard`), decorators (`@Public`, `@Roles`, `@CurrentUser`), helpers de data, **`opcoes.ts`** (`SETORES_USUARIO`, `UNIDADES`, `UNIDADES_COM_RH_OBRIGATORIO` — espelhadas no frontend)

#### Modelos (Prisma — `prisma/schema.prisma`, introspectados + migrações incrementais via SQL em `prisma/sql/`)
- **Usuarios**: perfil (Solicitante/Gestor/RH/Portaria/Admin), status, setor, **unidade** (nullable), hash de senha
- **Solicitacoes**: rastreamento de aprovações (gestor/RH + datas), dados de saída/retorno, `DataSaida` (data+hora da saída), motivo de reprovação, **`IsBypassRH`/`BypassMotivo`** (exceção máxima do gestor), **`ColaboradorId`** (saída por terceiros)
- **Notificacoes**: destinatário (UsuarioId), mensagem, tipo, lida, data, solicitação relacionada
- Enums armazenados como **string** no banco
- Migrações incrementais aplicadas via `npx prisma db execute --file prisma/sql/<arquivo>.sql` (não há `prisma migrate` formal)

#### Características de Segurança
- JWT Bearer (claims: id, nome, email, role, setor; expira em 8h)
- Hash de senha com bcrypt
- RBAC global: `JwtAuthGuard` (autenticação) + `RolesGuard` (`@Roles(...)`)
- CORS aberto (auth por Bearer token, não cookies)
- Unique constraints em Email e Matrícula
- Segredos via `backend-node/.env` (`DATABASE_URL`, `JWT_SECRET`, `SMTP_*` opcional)
- **Sessão revalidada no frontend a cada carga do app** (ver Decisões Técnicas → Frontend)
- ⚠️ **Scripts de deploy têm a senha SSH do servidor hardcoded em texto puro** — não versionados no git, mas ainda é um risco local. TODO: mover para variável de ambiente / chave SSH.

### Frontend

#### Páginas
- **LoginPage**: autenticação split-screen (logo à esquerda + form à direita), mostrar/ocultar senha; aviso de "aguardando aprovação" como modal
- **SignUpPage**: **redesenhada para usar o mesmo layout do LoginPage** — mesma logo (com fallback de caminhos), mesmo estilo de campo (Bootstrap, `height:48/borderRadius:10`), campos: Nome completo → Matrícula+Setor → Unidade → E-mail → Senha+Confirmar. A confirmação de cadastro agora é um **modal sobreposto à própria tela de cadastro** (não navega para uma tela separada) — só ao clicar "Voltar para o Login" é que navega para `/login`
- **InicioPage**: visão inicial
- **SolicitacoesPessoasPage**: criação e listagem das próprias solicitações (exclusão de pendentes, saída por terceiros)
- **SolicitacoesMatPage**: solicitações de material (placeholder)
- **AcessosGestorPage / AcessosRHPage / AcessosPortariaPage**: aprovações e registros por perfil. **RH não tem mais aba de "Auditoria Post-Facto"** — tela única; saídas com bypass aparecem misturadas na lista normal (já são sempre Particulares, que o RH sempre vê), com badge própria e ação "Validar Post-Facto" quando pendente
- **AdminPage**: listagem única de usuários (sem abas), painel de filtros (ID/Nome/E-mail-Matrícula/Status), **colunas ordenáveis** (↑↓↕, incl. Perfil), status como ícone
- **AdminUsuarioDetalhePage**: página dedicada (`/admin/usuarios/:id`) com todas as ações de um usuário — aprovar/rejeitar, bloquear/reativar, excluir, alterar perfil, alterar setor/unidade, redefinir senha
- **PerfilPage**: perfil e troca de senha

#### Contextos & Serviços
- **AuthContext**: revalida a sessão contra o backend (`GET /usuarios/me`) a cada carga do app antes de considerar autenticado — token no `localStorage` não basta por si só. Expõe `checking` para a UI aguardar.
- **services/api.ts**: `authService`, `solicitacaoService` (`aprovarGestorExcecao`, `validarBypass`, `registrarSaida`/`registrarRetorno` agora exigem confirmação antes de chamar), `usuariosService` (`listarColaboradores`), `adminService` (`obterUsuario`, `alterarSetor`, filtros + `sortBy`/`sortDesc`), `dashboardService`, `notificacaoService`. `baseURL` dinâmica (`window.location.hostname`)
- **constants/opcoes.ts**: `SETORES_USUARIO`, `UNIDADES_SETORES`/`UNIDADES` (inclui **JF**, ainda sem setores internos cadastrados — ver TODO), `UNIDADES_COM_RH_OBRIGATORIO` — espelha `backend-node/src/common/opcoes.ts`

#### Componentes-chave
- **AuthLayout**: sidebar + topbar para rotas autenticadas
- **Sidebar**: rodapé só com botão **Sair** (sem nome/perfil)
- **Topbar** com **NotificationBell** (polling ~30s)
- **DataTable** (TanStack): coluna **Ações primeira à esquerda**, botões circulares por ícone (Detalhes/Aceitar/Reprovar/Excluir/Exceção/Validar Post-Facto/Registrar Saída-Retorno), grade entre colunas, tudo centralizado, badge de **Exceção**, cards no mobile. **Sem estado de "busy" por linha** — toda ação abre um modal de confirmação, então não há mais loading inline nos ícones (removido `handleAction`/`loadingId`, que ficaram órfãos)
- **FilterPanel** + **DateRangePicker** + botão **Filtrar** (aplica só no clique) — estilo replicado no `AdminPage`
- **NovaSolicitacaoModal**: formulário em blocos numerados; checkbox **Extraordinária disponível para os dois tipos de saída**; campo **Setor de Destino é ocultado automaticamente** quando a Unidade escolhida não tem setores cadastrados (hoje: JF) — só Motivo continua obrigatório nesse caso; opção de **registrar saída para outro colaborador**
- **DetalhesSolicitacaoModal**: dados + resumo + aprovações (com estado de bypass, e "Dispensado" no RH quando não exigido — considerando Extraordinária) + timeline
- **ConfirmacaoAprovacaoModal**: trava de confirmação transversal com **5 variantes** — `aprovar`, `excecao`, `validarPostFacto`, `registrarSaida` ("Tem certeza que deseja realizar a saída do colaborador [Nome]?"), `registrarRetorno` — cada uma com título e mensagem próprios
- **UsuarioStatusPill**: indicador de status de conta (Pendente/Ativo/Bloqueado) com ícones dedicados
- **StatusBadge**, **ReprovacaoModal**

---

## Decisões Técnicas Relevantes

### Backend
1. **Reescrito em Node (NestJS) reusando o banco** — Prisma por introspecção; bcryptjs lê os hashes do .NET.
2. **Datas** — instantes em **UTC ISO com `Z`**; datas de calendário **naive (sem `Z`)**. Helpers em `src/common/dates.ts`.
3. **Notificações internas + e-mail** — `NotificacaoService` (in-app) + `MailService` (nodemailer) no bypass do RH.
4. **RH condicional para "À Serviço"** — regra de negócio central desta fase: por padrão, saídas a serviço só precisam do Gestor; o RH só entra se o destino for uma unidade em `UNIDADES_COM_RH_OBRIGATORIO` (hoje só JF). `aprovarGestor()` decide dinamicamente o próximo status (`AguardandoRH` vs `LiberadoPortaria`) chamando o helper `requerRH(tipoSaida, unidadeDestino)`.
5. **Extraordinária vale para os dois tipos; Exceção Máxima só para Particular** — Extraordinária (Gestor ausente) foi generalizada depois de inicialmente restrita a Particular. Exceção Máxima (RH ausente) permanece exclusiva de Particular **e** rejeita explicitamente solicitações já Extraordinárias (não faz sentido "pular o RH" numa solicitação onde o RH já é quem está aprovando no lugar do Gestor).
6. **Saída por terceiros** — `SolicitanteId` (quem cria) pode ser diferente de `ColaboradorId` (quem sai); nome/setor gravados vêm do cadastro do colaborador.
7. **Setor/Unidade do usuário padronizados e sincronizados** — cadastro exige Setor/Unidade de listas fixas. Quando o Admin altera o Setor de um usuário, as solicitações desse usuário ainda `AguardandoGestor` são atualizadas em cascata (senão ficariam roteadas para o gestor do setor antigo, "invisíveis" para o gestor certo).
8. **Escopo de visibilidade do RH é sobre o tipo/rota da solicitação, não sobre status** — RH só vê o que *algum dia* vai (ou já foi) tocado por ele: Particular, Extraordinária, ou À Serviço/unidade-com-RH. Isso evitou o bug de solicitações "À Serviço" comuns aparecerem na fila do RH sem nunca precisarem da aprovação dele.
9. **JWT sem refresh tokens (v1)** — TODO.
10. **Migrações incrementais via SQL manual** — scripts em `prisma/sql/*.sql` (idempotentes, `ADD COLUMN IF NOT EXISTS`), aplicados com `prisma db execute` + `prisma generate`. No Windows, é preciso **parar o processo do backend antes** de regenerar o client (o `.dll` do query engine fica bloqueado — `EPERM`/`EADDRINUSE`).

### Frontend
1. **React Router v6** com `AuthLayout` (Outlet) e route guards
2. **Axios interceptors** — injeta JWT; em 401 (exceto login/registro) faz logout
3. **baseURL dinâmica** — acompanha o host do navegador
4. **localStorage + revalidação obrigatória** — `AuthContext` só confirma `isAuthenticated` depois de validar contra `GET /usuarios/me`, corrigindo sessão "fantasma" quando o backend está fora do ar.
5. **Ícones SVG inline (Lucide-style)** — sem biblioteca de ícones instalada.
6. **Toda ação de aprovação/registro passa por confirmação** — `ConfirmacaoAprovacaoModal` cobre aprovar/reprovar/exceção/validação post-facto **e agora também Registrar Saída/Registrar Retorno da Portaria**, eliminando cliques acidentais em ações que mudam o fluxo físico de pessoas.
7. **Login e Cadastro compartilham o mesmo padrão visual** — mesma logo (com cadeia de fallback de caminhos), mesmos estilos de campo e de modal de confirmação/aviso (overlay `position-fixed` com backdrop escuro), para consistência de marca entre as duas telas públicas.

---

## Estado Atual do Código

### Funcionalidades Implementadas ✅
- ✅ Autenticação JWT + registro com aprovação (Setor/Unidade via dropdown, telas de Login/Cadastro com visual unificado)
- ✅ **Sessão revalidada contra o backend** a cada carregamento do app
- ✅ Criação de solicitações com **data+hora de saída** e previsão de retorno
- ✅ **Saída por terceiros** — registrar saída em nome de outro colaborador
- ✅ **Exclusão de solicitação** pelo solicitante enquanto pendente
- ✅ **Fluxo de aprovação diferenciado por tipo**: Particular sempre Gestor→RH; À Serviço só Gestor, exceto unidades que exigem RH (hoje: JF)
- ✅ **Extraordinária** (Gestor ausente → RH aprova) para Particular **e** À Serviço
- ✅ **Exceção Máxima** (RH ausente → Gestor aprova assumindo risco) restrita a Particular não-extraordinária, com **auditoria post-facto** do RH (in-app + e-mail) — sem aba dedicada, aparece na lista normal do RH
- ✅ Registro de saída/retorno (Portaria) **com confirmação obrigatória** ("Tem certeza que deseja realizar a saída/registrar o retorno do colaborador [Nome]?")
- ✅ **Tela de detalhes** (modal) com histórico, aprovadores, estado de bypass (incl. "Dispensado" quando RH não é exigido) e ações Aprovar/Reprovar
- ✅ **Trava de confirmação** transversal em toda aprovação/exceção/validação/registro de saída-retorno
- ✅ **Notificações internas** (sino) + **e-mail** (bypass) para gestor/RH/admins/solicitante/colaborador
- ✅ Filtros (incl. **PERÍODO**) via botão **Filtrar**, paginação e **ordenação** (incl. no AdminPage, por qualquer coluna)
- ✅ **DataTable mobile-first** (cards em telas pequenas), ícones circulares padronizados, colunas centralizadas com grade
- ✅ **Painel admin unificado** com filtros, ordenação, coluna Perfil, e página de detalhe dedicada por usuário — **sincroniza solicitações pendentes** quando o Setor do usuário é alterado
- ✅ **Setores de destino** ampliados (SCANNER/SUPRIMENTOS em ALFANDEGADO; PÁTIO OGT/DELIMA em TOMIASI; PÁTIO CAJUÍ/1/MARAPATÁ em ATR); unidade **JF** cadastrada (sem sub-setores — campo de Setor de Destino se esconde automaticamente pra ela)
- ✅ Dashboard com estatísticas por perfil
- ✅ RBAC por perfil
- ✅ **Deploy de rotina automatizado** (`deploy_update.py`) contra o servidor de produção

### TODO / Melhorias
1. **Segurança**: httpOnly cookies, refresh tokens, rate limiting, tirar a senha SSH hardcoded dos scripts de deploy
2. **Features**: solicitações de material, relatórios (PDF/Excel), audit log completo
3. **Dados**: preencher os **setores internos da unidade JF** (`UNIDADES_SETORES.JF` está vazio em `constants/opcoes.ts` — até lá, solicitações "À Serviço" pra JF não pedem setor, só motivo); usuários cadastrados antes da migração de Unidade ficam com o campo nulo até um admin preencher
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
    /common                    → guards, decorators, dates, opcoes.ts (setores/unidades/RH-obrigatório)
    main.ts                    → bootstrap (porta 5000 local / 8003 produção, 0.0.0.0, CORS)
    app.module.ts
  .env                         → DATABASE_URL, JWT_SECRET, PORT, SMTP_* (gitignored)

/frontend
  /saida-pessoas-app
    /src
      /pages                   → inclui AdminUsuarioDetalhePage
      /components
        /ui                    → StatusBadge, UsuarioStatusPill
        DataTable, ConfirmacaoAprovacaoModal, DetalhesSolicitacaoModal, NovaSolicitacaoModal, ...
      /contexts /services /types /constants (opcoes.ts)
      App.tsx, index.tsx

/deploy_*.py                  → scripts de deploy (fora do git — contêm credenciais)
/nginx_ccheckouts.conf         → referência da config vhost (fora do git)
CONTEXT.md (este arquivo)
```

---

## Pontos de Integração (principais endpoints)

- **Auth**: `POST /api/auth/login` → `{ token, nome, perfil, userId, setor }`; `POST /api/auth/registro` (exige `setor` + `unidade` válidos)
- **Solicitações**: `GET /api/solicitacoes?page=&pageSize=&status=&setor=&tipoSaida=&dataInicio=&dataFim=&sortBy=&sortDesc=&minhas=&somenteExtraordinarias=&...`; `GET /{id}`; `POST /` (aceita `colaboradorId`, `isExtraordinaria` para qualquer tipo); `DELETE /{id}`; `PUT /{id}/aprovar-gestor|reprovar-gestor|aprovar-gestor-excecao|validar-bypass|aprovar-rh|reprovar-rh|registrar-saida|registrar-retorno`
- **Usuários**: `GET /api/usuarios/me`; `PUT /me/senha`; `GET /colaboradores`
- **Notificações**: `GET /api/notificacoes?limit=`; `GET /nao-lidas`; `PUT /{id}/lida`; `PUT /marcar-todas-lidas`
- **Admin**: `GET /api/admin/usuarios?status=&id=&nome=&busca=&sortBy=&sortDesc=`; `GET /usuarios/{id}`; `PUT/DELETE /usuarios/{id}/aprovar|rejeitar|bloquear|perfil|setor|senha`
- **Dashboard**: `GET /api/dashboard/stats`

### Persistência
- **Database**: PostgreSQL 18 via Prisma (banco `saida_pessoas`, usuário de app `saida_app`)
- **Auth**: localStorage no navegador (com revalidação obrigatória contra o backend a cada carga)
- **Dados iniciais**: já existentes no banco; há um `seed.js` avulso em `backend-node/` para popular dados de teste

---

## Como Rodar Localmente

### Backend (Node)
```bash
cd backend-node
npm install            # (primeira vez)
npx prisma generate    # (primeira vez / após mudar o schema — pare o backend antes no Windows)
npm run build           # verificação de produção (nest build)
npm run start          # build + run  → http://localhost:5000/api
# dev com auto-reload: npm run start:dev
```
A conexão e o segredo JWT vêm de `backend-node/.env`.

> **Porta 5000**: só um backend por vez. `EADDRINUSE` = já há instância rodando.
> **`prisma generate` no Windows**: se der `EPERM` no `.dll` do query engine, pare todos os processos `node` do backend antes de rodar.

### Frontend
```bash
cd frontend/saida-pessoas-app
npm install
npm start              # http://localhost:3000
npm run build           # verificação de produção (react-scripts build)
```

### Deploy para produção
```bash
python deploy_update.py   # upload + migrações + build + restart PM2 + smoke test
```
Repositório do servidor: `/home/administrador/saida-pessoas/`. Exige a senha SSH root do servidor (hoje hardcoded no script — trocar por variável de ambiente `DEPLOY_SSH_PASSWORD` quando possível).

### Credenciais de Teste
Login por e-mail ou matrícula:
- **Admin**: admin@empresa.com (ADMIN001) / admin123
- **Solicitante**: solicitante@empresa.com (TI001) / 123456
- **Gestor**: gestor@empresa.com (TI002) / 123456
- **RH**: rh@empresa.com (RH001) / 123456
- **Portaria**: portaria@empresa.com (SEG001) / 123456

---

## Próximas Prioridades
1. Preencher os setores internos da unidade JF (`UNIDADES_SETORES.JF` em `constants/opcoes.ts`)
2. Configurar SMTP em produção para o e-mail de auditoria do bypass funcionar de fato
3. Tirar a senha SSH hardcoded dos scripts de deploy
4. Segurança: httpOnly cookies + refresh tokens
5. Formalizar migrações do Prisma e testes automatizados
