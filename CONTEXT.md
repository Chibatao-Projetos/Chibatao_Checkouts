# CONTEXT — Sistema de Saída de Pessoas

## Visão Geral

**Sistema de Autorização de Saída de Pessoas** (Chibatão Check Outs) é uma plataforma de gerenciamento de autorizações de saída de colaboradores em ambientes corporativos. O sistema implementa um **fluxo de aprovação de múltiplas etapas** com diferentes perfis de usuário (Solicitante, Gestor, RH, Portaria, Admin), permitindo controle, rastreabilidade e auditoria completa do processo.

**Objetivo**: Digitalizar e centralizar o controle de saídas, eliminando processos manuais em papel e fornecendo relatórios e histórico de acessos.

---

## Stack Técnico

### Backend
- **.NET 8** com **ASP.NET Core**
- **Entity Framework Core 8** (ORM) com **Migrations**
- **PostgreSQL 18** como banco de dados (provider **Npgsql**)
- **JWT Bearer** para autenticação
- **Swagger/OpenAPI** para documentação de API
- **BCrypt.Net-Next** para hash de senhas

**Endpoints base**: `http://localhost:5000/api`

### Frontend
- **React 18** com **TypeScript**
- **React Router v6** para navegação SPA
- **Bootstrap 5** + **React-Bootstrap** para componentes UI
- **TailwindCSS** para utilitários de estilo
- **Axios** para requisições HTTP
- **TanStack React Table** para tabelas

**Porta de desenvolvimento**: `http://localhost:3000`

---

## Arquitetura

### Arquitetura Geral: Camadas

```
Frontend (React/TypeScript)
    ↓ HTTP (Axios)
Backend (ASP.NET Core)
    ├─ Controllers (API endpoints)
    ├─ Services/Business Logic
    ├─ Data (DbContext, Models)
    └─ Authentication (JWT)
    ↓ ORM (EF Core)
Database (PostgreSQL)
```

### Fluxo de Aprovação de Solicitação

```
Solicitante cria solicitação
    ↓ Status: AguardandoGestor
Gestor aprova/reprova (extraordinárias)
    ↓ Status: AguardandoRH (se aprovado)
RH aprova/reprova
    ↓ Status: LiberadoPortaria (se aprovado)
Portaria registra saída (hora, vigilante)
    ↓ Status: EmTransito
Portaria registra retorno
    ↓ Status: Concluido
```

**Estados possíveis**: `AguardandoGestor` → `AguardandoRH` → `LiberadoPortaria` → `EmTransito` → `Concluido` ou `Reprovado`

---

## Módulos Principais e Responsabilidades

### Backend

#### 1. **Controllers**
- **AuthController**: Login, registro de usuários, autenticação JWT
- **SolicitacoesController**: CRUD de solicitações, aprovações, reprovações, filtros por perfil
- **UsuariosController**: Perfil do usuário, alterar senha
- **AdminController**: Gerenciamento de usuários (aprovar, rejeitar, alterar perfil/senha, bloquear)
- **DashboardController**: Estatísticas e resumo

#### 2. **Models** (Domain)
- **Usuario**: Entidade de usuário com perfil (Solicitante/Gestor/RH/Portaria/Admin), status, setor
- **SolicitacaoSaida**: Solicitação com rastreamento de aprovações, dados de saída/retorno, motivo de reprovação
- **Enums**: `PerfilUsuario`, `StatusSolicitacao`, `TipoSaida`, `StatusUsuario`

#### 3. **Data Layer**
- **AppDbContext**: Configuração do EF Core, relacionamentos, conversões de enum para string
- **DbSeeder**: Dados iniciais (usuários de teste)
- **Migrations**: Versionamento do schema (SQLite)

#### 4. **DTOs** (Data Transfer Objects)
- **CriarSolicitacaoDto**: Input para nova solicitação
- **SolicitacaoResponseDto**: Output estruturado com rastreamento
- **LoginDto/LoginResponseDto**: Autenticação
- **UsuarioDto/RegistroDto**: Cadastro e perfil
- **PagedResultDto**: Paginação genérica

#### 5. **Características de Segurança**
- JWT Bearer com validação de issuer/audience/lifetime
- Hash de senha com BCrypt
- RBAC (controle de acesso por perfil) nos endpoints
- CORS configurado para frontend (`localhost:3000`)
- Unique constraints em Email e Matrícula

### Frontend

#### 1. **Páginas (Pages)**
- **LoginPage**: Autenticação por identificação + senha
- **SignUpPage**: Cadastro autosserbidor
- **InicioPage**: Dashboard pessoal
- **SolicitacoesPessoasPage**: Criação e visualização de solicitações
- **SolicitacoesMatPage**: Solicitações de material (placeholder)
- **AcessosGestorPage**: Aprovações do gestor (extraordinárias)
- **AcessosRHPage**: Aprovações do RH
- **AcessosPortariaPage**: Registros de saída/retorno
- **AdminPage**: Gerenciamento de usuários
- **PerfilPage**: Edição de perfil e alteração de senha

#### 2. **Contextos (State Management)**
- **AuthContext**: Estado global de autenticação (token, usuário, isAuthenticated)
- Persistência em localStorage

#### 3. **Serviços de API**
- **authService**: Login, registro
- **solicitacaoService**: CRUD completo com filtros e aprovações
- **usuariosService**: Perfil, senha
- **adminService**: Gerenciamento administrativo
- **dashboardService**: Estatísticas

#### 4. **Componentes & Layouts**
- **AuthLayout**: Wrapper com sidebar para rotas autenticadas
- Componentes reutilizáveis de forms e tabelas
- Route guards: `GuestRoute` (redirect autenticados), `AdminRoute`

---

## Decisões Técnicas Relevantes

### Backend

1. **PostgreSQL (migrado de SQLite em jun/2026)**
   - Suporta muitos acessos concorrentes (escalabilidade)
   - Provider Npgsql; schema versionado via EF Core Migrations
   - Banco `saida_pessoas`, usuário de aplicação dedicado `saida_app`
   - Connection string via variável de ambiente `ConnectionStrings__DefaultConnection` (fora do código)

2. **Records para DTOs**
   - C# 9+ record syntax: tipos imutáveis, otimizados para data transfer
   - Declaração concisa vs classes tradicionais

3. **Enum to String no EF Core**
   - `.HasConversion<string>()` armazena enums como strings legíveis
   - Facilita legibilidade em logs e auditoria

4. **JWT sem refresh tokens (v1)**
   - Implementação simplificada
   - Token gerado via `/auth/login`, validado globalmente
   - **TODO**: Adicionar refresh token para melhor segurança

5. **RBAC embutido nos Controllers**
   - Sem service layer separado (v1)
   - Lógica de autorização por switch/role no controller
   - Facilita iteração rápida; refator para service layer é possível

### Frontend

1. **React Router v6 com Layout Outlet**
   - `AuthLayout` wrapaeia rotas autenticadas
   - Sidebar + topbar persiste entre navegações

2. **Axios com Interceptors**
   - Request interceptor: injeta token JWT automaticamente
   - Response interceptor: logout automático em 401

3. **localStorage para Persistência**
   - Token + dados do usuário salvos em `auth` key
   - Recovery automática ao recarregar página
   - **Nota**: localStorage não é seguro para dados sensíveis; usar httpOnly cookies em produção

4. **Bootstrap + Tailwind**
   - Bootstrap para componentes prontos (forms, buttons, modals)
   - Tailwind para utilitários e customização rápida

---

## Estado Atual do Código

### Funcionalidades Implementadas ✅
- ✅ Autenticação com JWT
- ✅ Registro de usuários
- ✅ Criação de solicitações de saída
- ✅ Fluxo de aprovação (Gestor → RH)
- ✅ Registro de saída/retorno (Portaria)
- ✅ Dashboard com estatísticas básicas
- ✅ Painel admin: aprovar/rejeitar/alterar perfil de usuários
- ✅ Filtros e paginação em listagens
- ✅ Alteração de senha (própria e admin)
- ✅ RBAC básico por perfil

### TODO / Melhorias Identificadas 🔄
1. **Segurança**
   - [ ] Usar httpOnly cookies em vez de localStorage
   - [ ] Implementar refresh tokens
   - [ ] Rate limiting em endpoints críticos

2. **Features**
   - [ ] Solicitações de material (SolicitacoesMatPage é placeholder)
   - [ ] Notificações por email
   - [ ] Relatórios e exportação (PDF, Excel)
   - [ ] Histórico de alterações (audit log)
   - [ ] Busca avançada e filtros salvos

3. **Performance**
   - [ ] Paginação server-side (já implementada, mas não testada em escala)
   - [ ] Caching de dados no frontend
   - [ ] Lazy loading de componentes

4. **DevOps**
   - [ ] CI/CD (Github Actions, etc)
   - [ ] Dockerfile/docker-compose
   - [ ] Variáveis de ambiente (.env)
   - [ ] Database migrations versionadas

5. **Testes**
   - [ ] Unit tests (backend + frontend)
   - [ ] Integration tests
   - [ ] E2E tests (Cypress, Playwright)

### Estrutura de Pastas

```
/backend
  /SaidaPessoas.API
    /Controllers       → HTTP endpoints
    /Models           → Domain entities
    /DTOs             → Data transfer objects
    /Data             → DbContext, seeder, migrations
    Program.cs        → Configuração da aplicação
    appsettings.json  → JWT key, connection strings

/frontend
  /saida-pessoas-app
    /src
      /pages          → Componentes de páginas por rota
      /components     → Componentes reutilizáveis
      /contexts       → AuthContext (state management)
      /services       → api.ts (Axios + endpoints)
      /types          → TypeScript interfaces
      App.tsx         → Router setup
      index.tsx       → Entry point
    package.json      → Dependências React
    tsconfig.json     → TypeScript config

CONTEXT.md (este arquivo)
```

---

## Pontos de Integração

### Backend → Frontend
- **Autenticação**: POST `/api/auth/login` → JWT token
- **Solicitações**: GET `/api/solicitacoes?page=1&pageSize=10&...` → Paginação com filtros
- **Aprovações**: PUT `/api/solicitacoes/{id}/aprovar-gestor` → Status update
- **Admin**: GET `/api/admin/usuarios?status=Pendente` → Lista de usuários

### Persistência
- **Database**: PostgreSQL 18 via EF Core + Npgsql (banco `saida_pessoas`)
- **Auth**: localStorage em navegador
- **Seeder**: Dados iniciais via `DbSeeder.Seed()` ao iniciar

---

## Como Rodar Localmente

### Backend
```bash
cd backend/SaidaPessoas.API
# A connection string vem da variável de ambiente ConnectionStrings__DefaultConnection
# (ex.: Host=localhost;Port=5432;Database=saida_pessoas;Username=saida_app;Password=...)
dotnet run
# Acesso: http://localhost:5000  (escuta em 0.0.0.0 — acessível pela rede)
# Swagger: http://localhost:5000/swagger

# Comandos de migration (schema):
#   dotnet ef migrations add NomeDaMigration
#   dotnet ef database update
```

### Frontend
```bash
cd frontend/saida-pessoas-app
npm install
npm start
# Acesso: http://localhost:3000
```

### Credenciais de Teste (Seeder)
Login por e-mail ou matrícula:
- **Admin**: admin@empresa.com (ADMIN001) / admin123
- **Solicitante**: solicitante@empresa.com (TI001) / 123456
- **Gestor**: gestor@empresa.com (TI002) / 123456
- **RH**: rh@empresa.com (RH001) / 123456
- **Portaria**: portaria@empresa.com (SEG001) / 123456

---

## Próximas Prioridades

1. **Testes automatizados** para aumentar confiabilidade
2. **Segurança**: Migrar para httpOnly cookies + refresh tokens
3. **Features faltantes**: Material requests, notificações, relatórios
4. **DevOps**: Docker, CI/CD, staging/prod environments
