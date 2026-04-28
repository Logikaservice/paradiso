# Paradiso – Piattaforma multi-progetto

Stack: **Node (Express)** + **React (Vite)** + **PostgreSQL**. Deploy: **GitHub** → push su **main** → deploy automatico sulla **VPS**.

> Nota ambiente principale (attuale): il riferimento operativo del progetto Orari/Paradiso e `http://46.224.55.248:3001/`.

---

## In locale: solo copia del progetto

In locale tieni il progetto come copia (es. per modifiche e push). Non serve avviare tutto in locale per lavorare: fai le modifiche, push su GitHub, e il deploy va in automatico sulla VPS.

Se vuoi provare in locale (opzionale):

```bash
# Database
docker compose up -d

# Backend
cd backend && cp .env.example .env
# In .env: DATABASE_URL=postgresql://paradiso:paradiso@localhost:5432/paradiso
npm install && npm run init-db && npm run dev

# Frontend (altro terminale)
cd frontend && npm install && npm run dev
# Login: admin@paradiso.local / admin123
```

---

## Deploy: GitHub → VPS

Tutto il deploy avviene **tramite GitHub**: push su `main` → GitHub Actions si connette alla VPS via SSH ed esegue pull, build e restart.

### 1. Repository GitHub

- Crea un repo su GitHub (es. `paradiso` o `paradiso-platform`).
- In locale (nella cartella del progetto):

```bash
git init
git add .
git commit -m "Paradiso initial"
git branch -M main
git remote add origin https://github.com/TUO_USER/TUO_REPO.git
git push -u origin main
```

### 2. Secrets su GitHub

Nel repo: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Aggiungi:

| Secret       | Descrizione                          | Esempio              |
|-------------|--------------------------------------|----------------------|
| `VPS_HOST`  | IP o hostname della VPS              | `46.224.55.248`      |
| `VPS_USER`  | Utente SSH sulla VPS                 | `deploy`             |
| `VPS_SSH_KEY` | Chiave **privata** SSH (contenuto del file) | contenuto di `id_ed25519` |
| `VPS_PATH`  | Path della repo sulla VPS (opzionale) | `/home/deploy/paradiso` |

Per `VPS_SSH_KEY`: sul PC apri il file della chiave privata (es. `C:\Users\...\.ssh\id_ed25519`), copia **tutto** (inclusi `-----BEGIN ... KEY-----` e `-----END ... KEY-----`) e incollalo nel secret.

### 3. Setup iniziale sulla VPS (una sola volta)

Sul server (dopo aver installato Ubuntu, utente `deploy`, firewall, Docker come da guida sotto):

1. **Node.js** (se non già presente):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   sudo npm install -g pm2
   ```

2. **Clone del repo** (sostituisci con il tuo URL GitHub):
   ```bash
   cd ~
   git clone https://github.com/TUO_USER/TUO_REPO.git paradiso
   cd paradiso
   ```

3. **Database** (PostgreSQL con Docker):
   ```bash
   docker compose up -d
   ```

4. **Backend – `.env` e init DB**:
   ```bash
   cd backend
   cp .env.example .env
   nano .env   # DATABASE_URL=postgresql://paradiso:paradiso@localhost:5432/paradiso, JWT_SECRET=..., FRONTEND_URL=https://tuodominio.it
   npm ci --omit=dev
   npm run init-db
   cd ..
   ```

5. **Avvio iniziale con PM2**:
   ```bash
   cd backend && pm2 start index.js --name paradiso-api && cd ..
   cd frontend && npm ci && npm run build && pm2 start "npx serve -s dist -l 3000" --name paradiso-web && cd ..
   pm2 save
   pm2 startup   # esegui il comando che ti propone
   ```

6. **Nginx + HTTPS** (dominio puntato alla VPS): configura proxy su `127.0.0.1:3000` (frontend) e `127.0.0.1:3001` (API), poi Certbot.

Da questo momento: **ogni push su `main`** fa partire il workflow che sulla VPS esegue `git pull`, `npm ci`, build frontend e `pm2 restart` di api e web.

### 4. Cosa fa il workflow al push

- Si connette alla VPS con i secret (`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`).
- Entra nella cartella del progetto (`VPS_PATH` se impostato, altrimenti `~/paradiso`).
- `git fetch` + `git reset --hard origin/main`.
- Backend: `npm ci --omit=dev`.
- Frontend: `npm ci` + `npm run build`.
- `pm2 restart paradiso-api` e `pm2 restart paradiso-web`.

Se il path sulla VPS è diverso da `~/paradiso`, imposta il secret **VPS_PATH** (es. `/home/deploy/paradiso`).

---

## Server da zero (prima volta)

**Guida passo-passo completa:** [docs/SERVER_DA_ZERO.md](docs/SERVER_DA_ZERO.md) (reinstallazione + setup con sola chiave `id_rsa`).

Se la VPS è vuota, ordine consigliato:

| Step | Dove   | Cosa fare |
|------|--------|------------|
| 1    | Hetzner | Ubuntu 24.04, SSH key |
| 2    | PC     | `ssh root@IP`, creare utente `deploy`, SSH per deploy |
| 3    | Server | `ufw` (22, 80, 443), aggiornamenti |
| 4    | Server | Docker (per PostgreSQL) |
| 5    | Server | Node 20, PM2, clone repo, `.env` backend, `docker compose up -d`, `npm run init-db` |
| 6    | Server | Primo avvio PM2 (backend + frontend build + serve) |
| 7    | Server | Nginx + dominio + Certbot |

Dettaglio passi 1–4 e Nginx è come nella sezione “Server da zero” sotto (o in un doc separato).

---

## File utili

- **`.github/workflows/deploy.yml`** – workflow che esegue il deploy sulla VPS al push su `main`.
- **`scripts/deploy.sh`** – script di deploy (puoi eseguirlo anche a mano sulla VPS: `./scripts/deploy.sh`).
- **`.gitignore`** – esclude `node_modules`, `.env`, `frontend/dist`, ecc. (il `.env` resta solo sulla VPS).

In sintesi: **in locale tieni solo il codice e fai push su GitHub; il deploy sulla VPS è automatico a ogni push su `main`.**
