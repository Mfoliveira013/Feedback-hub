# 🎨 Feedback Hub - Frontend

Aplicação web responsiva construída com React, Vite e TailwindCSS para gestão de feedbacks corporativos.

---

## 📋 Pré-requisitos

- Node.js 20+
- npm ou yarn

---

## 🚀 Como Executar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copie o exemplo (se existir)
cp .env.example .env

# Ou crie um arquivo .env com:
VITE_API_URL=http://localhost:3001/api
```

### 3. Executar em Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

### 4. Build para Produção

```bash
npm run build
```

Os arquivos de build estarão em `dist/`

### 5. Preview do Build

```bash
npm run preview
```

---

## 📂 Estrutura de Pastas

```
src/
├── api/                    # Clientes HTTP e integrações com API
│   ├── base44Client.js    # Cliente principal para comunicação com backend
│   ├── entities.js        # Exportação dos modelos de dados
│   ├── httpClient.js      # Interceptor HTTP com autenticação
│   └── integrations.js    # Integrações externas
├── components/            # Componentes React reutilizáveis
│   ├── Dashboard/         # Componentes do painel
│   ├── Feedback/          # Componentes de feedback
│   ├── layout/            # Layout e navegação
│   ├── ui/                # Componentes primitivos (Button, Card, etc)
│   └── utils/             # Permissões e utilitários de UI
├── entities/              # Modelos de dados (User, Feedback, etc)
│   ├── Feedback.js
│   ├── PeriodicSurvey.js
│   ├── Preference.js
│   ├── ReportImport.js
│   └── User.js
├── hooks/                 # Custom React hooks
│   └── use-mobile.jsx
├── integrations/          # Integrações com serviços externos
│   └── Core.js
├── lib/                   # Utilitários compartilhados
│   ├── app-params.js      # Parâmetros globais da aplicação
│   ├── AuthContext.jsx    # Contexto de autenticação
│   ├── NavigationTracker.jsx
│   ├── PageNotFound.jsx
│   ├── query-client.js    # Configuração do React Query
│   ├── utils.js           # Funções auxiliares
│   └── VisualEditAgent.jsx
├── pages/                 # Páginas principais da aplicação
│   ├── AppsNef.jsx
│   ├── AvaliacaoAIC.jsx
│   ├── CompletarPerfil.jsx
│   ├── Configuracoes.jsx
│   ├── Dashboard.jsx
│   ├── DiagnosticoEmails.jsx
│   ├── EnviarFeedback.jsx
│   ├── FeedbacksRetroativos.jsx
│   ├── Home.jsx
│   ├── ImportacaoRelatorios.jsx
│   ├── MinhaEquipe.jsx
│   ├── Perfil.jsx
│   ├── PesquisaPeriodica.jsx
│   ├── Relatorios.jsx
│   ├── ResponderPesquisa.jsx
│   ├── ResultadosPesquisaPeriodica.jsx
│   ├── TodasAvaliacoesAIC.jsx
│   └── TodosFeedbacks.jsx
├── utils/                 # Funções auxiliares
│   └── index.ts
├── App.jsx                # Componente raiz
├── Layout.jsx             # Layout principal
├── main.jsx               # Ponto de entrada
└── pages.config.js        # Configuração de rotas e páginas
```

---

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento com hot reload
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint (ESLint)
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking (JSConfig)
npm run typecheck

# Rodar backend em desenvolvimento
npm run backend:dev

# Iniciar backend em produção
npm run backend:start

# Popular banco de dados com seed
npm run backend:seed
```

---

## 📔 Integração com Backend

A aplicação se comunica com o backend através de:

- **Base URL:** `http://localhost:3001/api` (configurável em `.env`)
- **Autenticação:** Token JWT armazenado em localStorage
- **Client:** [httpClient.js](src/api/httpClient.js)

### Exemplos de Uso de Entities

```javascript
// Importar
import { User, Feedback, PeriodicSurvey } from "@/api/entities";

// Fazer login
const user = await User.login("email@example.com");

// Listar feedbacks
const feedbacks = await Feedback.list(order = "-created_date", limit = 100);

// Criar feedback
const newFeedback = await Feedback.create({
  remetente_email: "sender@example.com",
  destinatario_email: "recipient@example.com",
  titulo: ["Feedback positivo"],
  descricao: "Texto do feedback",
  nota: 5
});
```

---

## 🎨 Design System

- **UI Framework:** Radix UI + shadcn/ui
- **Styling:** TailwindCSS
- **Icons:** Lucide React
- **Drag & Drop:** Hello Pangea DnD

---

## 🔐 Autenticação

A autenticação é gerenciada através do `AuthContext`:

```javascript
// src/lib/AuthContext.jsx
import { AuthContext } from "@/lib/AuthContext";
import { useContext } from "react";

function MyComponent() {
  const { user, login, logout } = useContext(AuthContext);
  // ...
}
```

---

## 📱 Responsividade

A aplicação é totalmente responsiva com suporte para:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (< 768px)

Use o hook `useIsMobile()` para detectar dispositivos móveis:

```javascript
import { useIsMobile } from "@/hooks/use-mobile";

function MyComponent() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileView /> : <DesktopView />;
}
```

---

## 📊 Utilitários Principais

### Permissões ([src/components/utils/permissoes.js](src/components/utils/permissoes.js))
- `isAdminGlobal(user)`
- `isAdminSetorial(user)`
- `isAdminMultiSetor(user)`
- `isGestorAcessoTodosSetores(user)`

### URL e Navegação ([src/lib/utils.js](src/lib/utils.js))
- `createPageUrl(page, params)`
- Gerenciamento de rotas

---

## 🧪 Testes

```bash
# Para adicionar testes (não configurado ainda)
npm install --save-dev vitest @testing-library/react
```

---

## 🚢 Deploy

### Build Estático

```bash
npm run build
```

Os arquivos podem ser servidos por qualquer servidor web estático (nginx, Apache, etc).

### Com Docker (Exemplo)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## 🐛 Troubleshooting

### Erro de conexão com API
- Verificar se o backend está rodando em `http://localhost:3001`
- Confirmar `VITE_API_URL` no `.env`

### Import de módulos não encontrado
- Verificar o alias `@/*` em `jsconfig.json`
- Limpar cache: `rm -rf node_modules dist && npm install`

### Problemas com CORS
- Adicionar domínio do frontend ao `CORS_ORIGIN` do backend

---

## 📖 Recursos Adicionais

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [TailwindCSS](https://tailwindcss.com)
- [Radix UI](https://radix-ui.com)
- [React Query](https://tanstack.com/query/latest)
