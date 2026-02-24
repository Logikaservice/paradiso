# Server Paradiso – Tutto da zero

Server vuoto, ripartenza completa. Usi **solo** la chiave `id_rsa` / `id_rsa.pub` (niente vps_key).

---

## Parte 1 – Reinstallare il server (Hetzner)

1. Vai nel **pannello Hetzner** (Robot o Cloud) e apri il server **46.224.55.248**.

2. **Reinstalla il sistema**
   - **Robot**: Server → **Rescue** / **Install** → **Install image** (o **OS**).
   - **Cloud**: Server → **Recovery** / **Reinstall**.
   - Scegli **Ubuntu 24.04 LTS**.

3. **Aggiungi la chiave SSH**
   Nella stessa schermata cerca **SSH key** / **Chiave pubblica**.
   - Sul PC apri: `C:\Users\anamu\.ssh\id_rsa.pub`
   - Copia **tutta** la riga (inizia con `ssh-rsa ...`).
   - Incollala nel campo e salva.

4. **Password root** (se il pannello la chiede): impostane una e **annotala** (serve solo in emergenza; con la chiave non la userai per il login normale).

5. Avvia l’installazione e attendi 5–10 minuti.

---

## Parte 2 – Primo accesso e utente deploy

6. **Connettiti come root** (dal PC):
   ```powershell
   ssh root@46.224.55.248
   ```
   Dovrebbe entrare **senza** chiedere password (grazie a `id_rsa`).

7. **Crea l’utente deploy e mettigli la stessa chiave** (comandi sul server):
   ```bash
   adduser deploy
   ```
   (Ti chiederà una password per deploy: scegline una e annotala, oppure metti una temporanea e poi la disattivi.)
   ```bash
   usermod -aG sudo deploy
   mkdir -p /home/deploy/.ssh
   cp /root/.ssh/authorized_keys /home/deploy/.ssh/
   chown -R deploy:deploy /home/deploy/.ssh
   chmod 700 /home/deploy/.ssh
   chmod 600 /home/deploy/.ssh/authorized_keys
   ```

8. **Prova l’accesso come deploy** (dal PC):
   ```powershell
   exit
   ssh deploy@46.224.55.248
   ```
   Deve entrare senza password. Poi `exit` per uscire.

---

## Parte 3 – Firewall, Docker, Node, PM2

9. **Torna sul server** come `deploy`:
   ```powershell
   ssh deploy@46.224.55.248
   ```

10. **Aggiornamenti e firewall**
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y ufw
    sudo ufw allow OpenSSH
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw enable
    sudo ufw status
    ```

11. **Docker** (per PostgreSQL)
    ```bash
    sudo apt install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker deploy
    ```
    Esci e rientra (`exit` poi `ssh deploy@46.224.55.248`) così il gruppo `docker` sia attivo.

12. **Node.js 20 e PM2**
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    sudo npm install -g pm2
    ```

---

## Parte 4 – Clone repo, database, backend, frontend

13. **Clona il repo** (sostituisci con il tuo URL se diverso):
    ```bash
    cd ~
    git clone https://github.com/Logikaservice/paradiso.git
    cd paradiso
    ```

14. **Avvia il database**
    ```bash
    docker compose up -d
    ```

15. **Backend – .env e init DB**
    ```bash
    cd ~/paradiso/backend
    cp .env.example .env
    nano .env
    ```
    Imposta almeno (adatta dominio e password):
    ```env
    PORT=3001
    NODE_ENV=production
    DATABASE_URL=postgresql://paradiso:paradiso@localhost:5432/paradiso
    JWT_SECRET=una-stringa-lunga-casuale-cambia-questa
    FRONTEND_URL=https://tuodominio.it
    ```
    Salva (Ctrl+O, Invio, Ctrl+X). Poi:
    ```bash
    npm ci --omit=dev
    npm run init-db
    ```

16. **Avvio con PM2**
    ```bash
    pm2 start index.js --name paradiso-api
    cd ~/paradiso/frontend
    npm ci
    npm run build
    pm2 start "npx serve -s dist -l 3000" --name paradiso-web
    pm2 save
    pm2 startup
    ```
    Esegui il comando che `pm2 startup` ti stampa (es. `sudo env PATH=...`).

---

## Parte 5 – GitHub (secret con id_rsa)

17. **Secret VPS_SSH_KEY**
   - Sul PC apri `C:\Users\anamu\.ssh\id_rsa` con Blocco note.
   - Copia **tutto** (da `-----BEGIN` a `-----END ... KEY-----`).
   - GitHub → repo **Logikaservice/paradiso** → **Settings** → **Secrets and variables** → **Actions**.
   - Secret **VPS_SSH_KEY**: modifica e incolla il contenuto di `id_rsa`, poi salva.

   Controlla anche:
   - **VPS_HOST** = `46.224.55.248`
   - **VPS_USER** = `deploy`
   - **VPS_PATH** = `/home/deploy/paradiso` (se il clone è in `~/paradiso`)

18. **Prova il deploy**
   - In GitHub vai in **Actions** e fai **Re-run all jobs** sull’ultima run (o fai un piccolo commit e push su `main`). Il workflow dovrebbe connettersi e fare pull + build + restart.

---

## Parte 6 – Nginx e HTTPS (quando hai il dominio)

19. Punta il dominio (es. `paradiso.tuodominio.it`) con un record **A** verso **46.224.55.248**.

20. Sul server:
    ```bash
    sudo apt install -y nginx
    sudo nano /etc/nginx/sites-available/paradiso
    ```
    Contenuto (sostituisci `paradiso.tuodominio.it`):
    ```nginx
    server {
        listen 80;
        server_name paradiso.tuodominio.it;
        location / {
            proxy_pass http://127.0.0.1:3000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        location /api {
            proxy_pass http://127.0.0.1:3001;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
    ```
    ```bash
    sudo ln -s /etc/nginx/sites-available/paradiso /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d paradiso.tuodominio.it
    ```

---

## Riepilogo ordine

| #  | Dove      | Cosa |
|----|-----------|------|
| 1–5  | Hetzner   | Reinstall Ubuntu 24.04, aggiungi **id_rsa.pub** |
| 6–8  | Server    | Primo login root, crea deploy, stessa chiave |
| 9–12 | Server    | Firewall, Docker, Node, PM2 (come deploy) |
| 13–16| Server    | Clone paradiso, docker compose, .env, init-db, PM2 start |
| 17–18| GitHub   | VPS_SSH_KEY = contenuto **id_rsa**, re-run deploy |
| 19–20| Opzionale | Nginx + Certbot quando hai il dominio |

Fatto questo, il server è “da zero” e il deploy da GitHub usa solo **id_rsa**.
