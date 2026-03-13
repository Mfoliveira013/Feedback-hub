# Deploy completo na Oracle VPS (Frontend + Backend + MySQL)

Este guia sobe toda a stack usando Docker:
- `frontend` (Nginx + build do Vite)
- `backend` (Node/Express)
- `mysql` (MySQL 8)

## 1) Pré-requisitos na VPS (Ubuntu)
```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release git

sudo mkdir -m 0755 -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Saia e entre novamente no SSH para aplicar o grupo `docker`.

## 2) Clonar projeto
```bash
git clone <SEU_REPO_GIT> feedback-hub
cd feedback-hub
```

## 3) Criar arquivo de ambiente da stack
```bash
# opcao 1: modelo Oracle existente
cp .env.oracle.example .env.oracle
# opcao 2: modelo de producao generico
# cp .env.production.example .env.oracle
nano .env.oracle
```

Preencha:
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_DATABASE` (se quiser sobrescrever o padrao `feedback_hub`)
- `MYSQL_APP_USER`
- `MYSQL_APP_PASSWORD`
- `CORS_ORIGIN` (ex.: `http://SEU_IP` ou `https://seu-dominio.com`)
- `JWT_SECRET`
- `FRONTEND_PORT` (opcional, padrao `80`)

## 4) Subir containers
```bash
docker compose --env-file .env.oracle -f docker-compose.oracle.yml up -d --build
```

## 5) Rodar migration no MySQL do container
```bash
docker compose --env-file .env.oracle -f docker-compose.oracle.yml exec -T mysql \
  sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD"' < database/migrations/mysql/001_create_schema.up.sql
```

## 6) Rodar seed inicial
```bash
docker compose --env-file .env.oracle -f docker-compose.oracle.yml exec backend npm run seed
```

## 7) Verificar saúde
```bash
curl http://SEU_IP/api/health
curl http://SEU_IP/healthz
```

Abra no navegador:
`http://SEU_IP`

## 8) Firewall Oracle Cloud
No Security List / Network Security Group da sua instância, libere:
- TCP 80 (HTTP)
- TCP 443 (HTTPS, se usar domínio/SSL)

No Ubuntu (se UFW estiver ativo):
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

## 9) SSL (recomendado com domínio)
Se você tiver domínio apontando para o IP da VPS, use Nginx host + Certbot (ou proxy reverso dedicado).
No modelo atual em container, o caminho mais simples é adicionar um proxy externo (Caddy/Nginx) para TLS.

## 10) Checklist para deploy Oracle real
- [ ] Definir domínio e apontar DNS para o IP público da instância
- [ ] Configurar TLS (Let’s Encrypt via proxy externo ou load balancer com certificado)
- [ ] Restringir acesso de rede ao MySQL (não expor porta 3306 publicamente)
- [ ] Definir política de backup/snapshot do volume Docker (`mysql_data`)
- [ ] Configurar rotação e coleta centralizada de logs
- [ ] Definir monitoramento/alerta para `api/health`, uso de CPU/RAM e espaço em disco
- [ ] Definir estratégia de atualização (pull + up -d --build) e rollback

## Comandos úteis
```bash
docker compose --env-file .env.oracle -f docker-compose.oracle.yml logs -f
docker compose --env-file .env.oracle -f docker-compose.oracle.yml ps
docker compose --env-file .env.oracle -f docker-compose.oracle.yml down
docker compose --env-file .env.oracle -f docker-compose.oracle.yml up -d --build
```
