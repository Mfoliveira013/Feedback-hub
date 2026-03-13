# Feedback Hub Backend

API Node.js/Express com MySQL para o Feedback Hub.

## Requisitos
- Node.js 20+
- MySQL 8+
- Schema executado: `database/migrations/mysql/001_create_schema.up.sql`

## Configuração
1. Copie o arquivo de ambiente:
```bash
cp .env.example .env
```
2. Ajuste as variáveis no `.env`.

## Executar
```bash
npm install
npm run dev
```

API padrão: `http://localhost:3001`

## Seed inicial
```bash
npm run seed
```

## Rotas principais
- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET/POST/PATCH /api/users`
- `GET/POST/PATCH/DELETE /api/feedbacks`
- `GET/POST /api/surveys/periodic`
- `GET/POST /api/surveys/periodic-responses`
- `GET/POST /api/report-imports`
- `GET/PUT /api/preferences/me`
- `POST /api/integrations/send-email`

