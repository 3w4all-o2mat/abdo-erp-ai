# Deployment Runbook — abdo-ai-erp

This guide takes you from a fresh Ubuntu VPS to a running app on `http://YOUR_VPS_IP:3000`.

> **Security reminder:** never paste your VPS password, SSH key, or `.env` secrets into a chat / log / screenshot. Type them directly into your terminal.

---

## 0. What you need

- A VPS running **Ubuntu 22.04 or 24.04**
- The **public IP** of the VPS (e.g. `203.0.113.10`)
- A **GitHub account**
- ~20 minutes

The deploy is fully automated after the initial setup: every `git push origin main` triggers a new build + restart.

---

## 1. One-time: prepare the VPS

### 1.1 SSH in for the first time

On your Mac:

```bash
ssh root@YOUR_VPS_IP
```

Enter the root password when prompted (it will not be visible — that's normal).

### 1.2 Create a non-root user (recommended)

The GitHub Actions workflow assumes the user is `ubuntu` and the project lives at `/home/ubuntu/abdo-erp-ai`. If you keep `root`, just adjust the paths in the commands below.

```bash
# If the 'ubuntu' user doesn't exist (some VPS providers create it by default)
adduser ubuntu
usermod -aG sudo ubuntu

# Switch to that user for the rest
su - ubuntu
```

### 1.3 Install Docker + Compose

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg git openssl

# Add Docker's official GPG key + repo
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Allow your user to run docker without sudo
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

### 1.4 Open the firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp   # Next.js
sudo ufw enable
sudo ufw status
```

If your provider has a separate "network firewall" (Hetzner, OVH, DigitalOcean…), also open port 3000 there.

---

## 2. One-time: prepare the GitHub deploy key

This lets GitHub Actions SSH into your VPS without you ever typing a password.

### 2.1 On the VPS, generate a key

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions -N ""
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/github_actions   # <-- this is the PRIVATE key, copy it in step 3
```

### 2.2 Note your VPS connection info

You'll need:
- `VPS_HOST` = your public IP (e.g. `203.0.113.10`)
- `VPS_USER` = the SSH user (`ubuntu` if you followed step 1.2, otherwise `root`)

### 2.3 Also generate the secrets for your `.env.production`

```bash
# Strong secrets for AUTH_SECRET / NEXTAUTH_SECRET
openssl rand -base64 32
openssl rand -base64 32

# Strong password for the postgres user
openssl rand -base64 24 | tr -d '/+=' | head -c 24
```

Keep these in a password manager — you'll need them in a moment.

---

## 3. One-time: configure GitHub

### 3.1 Create the repo

On GitHub, create a new **private** repository named e.g. `abdo-ai-erp`. Do **not** initialize it with a README.

### 3.2 Push the code

On your Mac:

```bash
cd /Volumes/T9/ai-apps/abdo-ai-erp

# Make sure .env is NOT tracked
git rm --cached .env 2>/dev/null || true

git init
git add .
git commit -m "Initial commit with Docker deploy"
git branch -M main
git remote add origin git@github.com:YOUR_GITHUB_USER/abdo-ai-erp.git
git push -u origin main
```

### 3.3 Add the secrets

On GitHub: **Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|---|---|
| `VPS_HOST` | your VPS public IP |
| `VPS_USER` | `ubuntu` (or whatever SSH user you use) |
| `VPS_SSH_KEY` | the **entire** output of `cat ~/.ssh/github_actions` on the VPS (including `-----BEGIN OPENSSH PRIVATE KEY-----` and the line breaks) |

---

## 4. First deploy

### 4.1 Bootstrap the project on the VPS

SSH into the VPS as the deploy user:

```bash
ssh ubuntu@YOUR_VPS_IP
```

Then:

```bash
# Clone the repo
git clone git@github.com:YOUR_GITHUB_USER/abdo-ai-erp.git /home/ubuntu/abdo-erp-ai
cd /home/ubuntu/abdo-erp-ai

# (Optional) Add GitHub to known_hosts so future clones work non-interactively
ssh-keyscan github.com >> ~/.ssh/known_hosts
```

> The deploy workflow will also need to pull from GitHub. If you cloned over HTTPS you'd need a token; using the deploy key we set up in step 2 means you should switch the remote to SSH (already done above) **and** you need to add GitHub's key to the VPS's `known_hosts` (the line above). If you prefer, change the remote to `https://github.com/...` and put a GitHub PAT in the env instead.

### 4.2 Create the production `.env.production`

```bash
cd /home/ubuntu/abdo-erp-ai
nano .env.production
```

Paste the following, filling in real values (use the secrets you generated in 2.3):

```env
# Postgres credentials (used by the postgres container)
POSTGRES_USER=appuser
POSTGRES_PASSWORD=PASTE_THE_POSTGRES_PASSWORD_HERE
POSTGRES_DB=mini_erp

# Connection string used by the Next.js app
DATABASE_URL=postgresql://appuser:PASTE_THE_POSTGRES_PASSWORD_HERE@postgres:5432/mini_erp

# Auth (use the two openssl rand -base64 32 values from step 2.3)
AUTH_SECRET=PASTE_FIRST_SECRET_HERE
NEXTAUTH_SECRET=PASTE_SECOND_SECRET_HERE
NEXTAUTH_URL=http://YOUR_VPS_IP:3000
```

Save with `Ctrl+O`, `Enter`, `Ctrl+X`.

Lock the file down:

```bash
chmod 600 .env.production
```

### 4.3 Build and start the app

Run the same deploy script that CI uses. It builds the image locally, waits
for postgres to be healthy, applies migrations, starts the app and
health-checks it:

```bash
cd /home/ubuntu/abdo-erp-ai
./scripts/deploy.sh
```

The first build will take ~5 minutes (pnpm install + Next.js build). Watch it with:

```bash
docker compose logs -f app
```

When you see something like `▲ Next.js 15.0.3` and `✓ Ready in ...`, hit `Ctrl+C` and visit:

```
http://YOUR_VPS_IP:3000
```

You should see the public home page. Admin login lives at `http://YOUR_VPS_IP:3000/login`.

### 4.4 (Optional) Seed initial data

Seeding is **not** part of the CI/CD pipeline (so a deploy never resets your
admin credentials). If you want the default roles + `admin / admin123` user
from `prisma/seed.ts`, run it once with the app image (tsx is installed on
the fly):

```bash
cd /home/ubuntu/abdo-erp-ai
docker compose run --rm -u root app sh -c "npm install -g tsx >/dev/null 2>&1 && tsx prisma/seed.ts"
```

> Change the default admin password right after the first login.

---

## 5. Day-to-day deploys

From your Mac:

```bash
git add .
git commit -m "Describe your change"
git push origin main
```

GitHub Actions will:
1. SSH into the VPS
2. `git pull` the latest `main`
3. Build a new Docker image
4. Run `prisma migrate deploy` (safe to run repeatedly)
5. Restart the `app` container
6. Prune old images

Watch it in the **Actions** tab on GitHub.

---

## 6. Useful commands on the VPS

```bash
cd /home/ubuntu/abdo-erp-ai

# Tail app logs
docker compose logs -f app

# Tail db logs
docker compose logs -f postgres

# Open a shell inside the app container
docker compose exec app sh

# Apply migrations manually (same command CI runs)
docker compose run --rm --no-deps -u root app prisma migrate deploy

# Run psql
docker compose exec postgres psql -U appuser -d mini_erp

# Restart the app only
docker compose restart app

# Stop everything
docker compose down

# Wipe the database (DESTRUCTIVE)
docker compose down -v
```

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `permission denied` on `docker` | Your user isn't in the `docker` group | `sudo usermod -aG docker $USER && newgrp docker` |
| App container exits with `Can't reach database server` | Postgres isn't healthy yet, or `DATABASE_URL` uses `localhost` | Make sure `DATABASE_URL` uses hostname `postgres` (the service name) |
| `prisma migrate deploy` fails with "P3009" | Drift between schema and migrations | Check the migration files in `prisma/migrations/` |
| GitHub Actions fails with `Permission denied (publickey)` | The `VPS_SSH_KEY` secret is wrong or the public half isn't in `~/.ssh/authorized_keys` | Re-paste the key, make sure you copied the **private** key into GitHub |
| Port 3000 is closed | VPS firewall or provider firewall | `sudo ufw allow 3000/tcp` and check the provider's network rules |

---

## 8. Production checklist

- [ ] `AUTH_SECRET` and `NEXTAUTH_SECRET` are unique random values (not the dev one in `.env`)
- [ ] `.env` is `chmod 600` and not committed
- [ ] SSH password auth is disabled on the VPS (`PasswordAuthentication no` in `/etc/ssh/sshd_config`)
- [ ] UFW is enabled with only 22 + 3000 open (or put Nginx + 80/443 in front — see next step)
- [ ] Backups: snapshot the `postgres_data` volume regularly (`docker run --rm -v abdo-ai-erp_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/pg.tgz /data`)

### Recommended next step: Nginx + a real domain + Let's Encrypt

When you get a domain, put Nginx in front of the app for HTTPS:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Then add a server block for your domain that proxies `localhost:3000`, and run `sudo certbot --nginx -d yourdomain.com`. This is left as a follow-up since you said IP-only is fine for now.
