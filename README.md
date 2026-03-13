# 💬 Feedback Hub — Plataforma Corporativa de Feedback

> Sistema inteligente para gestão de feedback corporativo, desenvolvimento de colaboradores e fortalecimento da cultura organizacional.

---

## 📌 Visão Geral

O **Feedback Hub** é uma plataforma corporativa desenvolvida para **centralizar, organizar e estruturar feedbacks internos**, permitindo que empresas promovam comunicação clara, desenvolvimento contínuo e melhoria de desempenho.

O sistema atende **colaboradores, líderes e gestores**, com controle de permissões, rastreabilidade e organização por setor e filial.

---

## 🎯 Objetivos do Projeto

- Centralizar feedbacks em um ambiente único e seguro
- Padronizar processos de feedback corporativo
- Facilitar a comunicação entre colaboradores e liderança
- Apoiar o desenvolvimento profissional
- Criar histórico estruturado de feedbacks

---

## 👥 Tipos de Usuário

| Perfil | Descrição |
|------|----------|
| **Colaborador** | Envia e recebe feedbacks, visualiza apenas seus dados |
| **Líder / Gestor** | Envia feedbacks, acompanha equipe |
| **Administrador / RH** | Gerencia usuários, setores e permissões |

---

## 🔄 Fluxo da Plataforma

### 1️⃣ Login
- Autenticação por e-mail e senha
- Login corporativo

### 2️⃣ Cadastro / Configuração Inicial
Após o primeiro acesso, o usuário deve completar:
- Nome completo
- Setor de trabalho
- Filial
- Cargo / Tipo de conta
- Permissões iniciais

> ⚠️ O acesso completo ao sistema só é liberado após essa etapa.

### 3️⃣ Painel do Usuário
- Visualização clara de feedbacks enviados e recebidos
- Status dos feedbacks
- Histórico individual

### 4️⃣ Envio de Feedback
- Feedback estruturado (positivo, construtivo ou reconhecimento)
- Associação por setor e colaborador
- Registro com data e autor

### 5️⃣ Gestão Administrativa (RH)
- Cadastro e edição de setores
- Controle de filiais
- Gestão de cargos e permissões
- Visualização geral dos feedbacks

---

## 🧠 Inteligência e Automação

O Feedback Hub pode ser integrado com IA para:
- Classificação de feedbacks por tipo
- Identificação de padrões de melhoria
- Apoio à gestão de desempenho
- Relatórios estratégicos para RH

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** Web responsivo (desktop e mobile)
- **Backend:** API local (localhost)
- **Banco de Dados:** Estruturado automaticamente
- **Autenticação:** Controle de usuários e permissões
- **IA (opcional):** Análise e classificação de texto

---

## 📂 Estrutura do Projeto (Monorepo)

```bash
feedback-hub/
├── frontend/                          # Aplicação React + Vite
│   ├── src/
│   │   ├── api/                      # Integração com backend
│   │   ├── components/               # Componentes React reutilizáveis
│   │   ├── entities/                 # Modelos de dados (User, Feedback, etc)
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── integrations/             # Integrações externas
│   │   ├── lib/                      # Utilitários compartilhados
│   │   ├── pages/                    # Páginas da aplicação
│   │   └── utils/                    # Funções auxiliares
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── jsconfig.json
├── backend/                           # API Node.js + Express
│   ├── src/
│   │   ├── config/                   # Configurações (env, etc)
│   │   ├── db/                       # Pool de conexão MySQL
│   │   ├── middleware/               # Middlewares (auth, erro, etc)
│   │   ├── repositories/             # Acesso a dados
│   │   ├── routes/                   # Definição de rotas
│   │   ├── services/                 # Lógica de negócio
│   │   ├── utils/                    # Funções auxiliares
│   │   ├── app.js                    # Setup do Express
│   │   └── server.js                 # Inicialização do servidor
│   ├── scripts/
│   │   └── seed.js                   # Dados iniciais para testes
│   ├── package.json
│   └── README.md
├── database/                          # Migrações e scripts
│   └── migrations/
│       └── mysql/                    # Scripts SQL para MySQL
├── .env.oracle.example                # Exemplo de variáveis de ambiente
└── README.md                          # Este arquivo
```

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js 20+ instalado
- MySQL 8+ instalado e configurado
- Git (opcional, mas recomendado)

### 1️⃣ Clonar e Configurar

```bash
# Clonar o repositório
git clone <repositório> feedback-hub
cd feedback-hub

# Copiar arquivo de ambiente
cp .env.oracle.example .env
# Editar .env com suas variáveis (MySQL host, user, password, etc)
```

### 2️⃣ Executar Migrações do Banco

```bash
# Executar scripts SQL para criar schema
# Use seu cliente MySQL (Workbench, CLI, etc) para rodar:
# database/migrations/mysql/001_create_schema.up.sql
```

### 3️⃣ Rodar o Backend

```bash
cd backend

# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Ou em produção
npm run start

# API estará disponível em: http://localhost:3001
```

### 4️⃣ Rodar o Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Ou fazer build para produção
npm run build
npm run preview

# Frontend estará disponível em: http://localhost:5173
```

### 5️⃣ (Opcional) Seed de Dados

```bash
cd backend
npm run seed
```

---

## 🔐 Variáveis de Ambiente

Copie `.env.oracle.example` para `.env` e configure:

```env
# Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=feedback_hub
MYSQL_USER=seu_usuario
MYSQL_PASSWORD=sua_senha

# Backend
NODE_ENV=development
PORT=3001
JWT_SECRET=sua_chave_secreta_aqui

# Frontend
VITE_API_URL=http://localhost:3001/api
```

---

## 📖 Documentação do Backend

Veja [backend/README.md](backend/README.md) para:
- Detalhes das rotas da API
- Estrutura de autenticação
- Migrações de banco de dados

---

## 🌐 Deploy no Oracle VPS

Para fazer deploy em uma VPS Oracle:

1. SSH na instância
2. Instalar Node.js 20+ e MySQL 8+
3. Clonar o repositório
4. Configurar variáveis de ambiente
5. Rodar as migrações do banco
6. Executar `npm install` no backend e frontend
7. Build do frontend com `npm run build`
8. Usar PM2 ou similar para manter serviços rodando

```bash
# Exemplo com PM2
npm install -g pm2

# Backend
pm2 start backend/src/server.js --name "feedback-hub-api"

# Frontend (usar nginx ou similar como reverse proxy)
# Servir os arquivos de build em /frontend/dist
```

---

## 🐛 Troubleshooting

### Conexão com banco de dados falha
- Verificar se MySQL está rodando
- Confirmar credenciais em `.env`
- Verificar se o schema foi criado

### Imports quebrados após reorganização
- Verificar paths no `jsconfig.json` do frontend
- Rever imports que fazem referência a `@/`

### CORS error
- Configurar `CORS_ORIGIN` no backend
- Verificar URL do frontend em `.env`

---

## 📝 Licença

Propriedade de Nabarrete & Ferro Advogados Associados
