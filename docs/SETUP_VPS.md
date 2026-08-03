# VPS setup runbook for abdo-ai-erp CI/CD

This is the one-time setup needed to make the `Deploy to VPS` GitHub
Actions workflow work. Once the steps below are done, every push to
`master` (or `main`) will:

1. **CI** — typecheck + build on a GitHub runner (acts as a regression gate;
   nothing deploys if it fails).
2. **Deploy** — SSH into the VPS, `git pull`, then `scripts/deploy.sh`,
   which builds the image **locally on the VPS** with `docker compose`,
   waits for `postgres` to be healthy, applies `prisma migrate deploy`,
   restarts the `app` container and health-checks it.

No GHCR / image registry is used: secrets stay on the VPS in
`.env.production`, and the image is built where it runs.

> **Target:** Ubuntu 22.04 or 24.04, user `ubuntu`, project deployed to
> `/home/ubuntu/abdo-erp-ai`, app served on port 3000.

---

## 1. One-time: install Docker on the VPS

SSH into the VPS as `ubuntu` and run:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg git openssl

# Docker repo + GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io \
                    docker-buildx-plugin docker-compose-plugin

# Allow 'ubuntu' to run docker without sudo
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

## 2. Open the firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp
sudo ufw enable
sudo ufw status
```

If your provider has a separate network firewall (Hetzner, OVH, Scaleway…)
also open TCP 3000 there.

## 3. Add the GitHub Actions deploy key

On **your Mac** (key lives at `~/.ssh/github_actions`):

```bash
cat ~/.ssh/github_actions.pub
```

Copy the printed `ssh-ed25519 ...` line.

On the **VPS**, add it to the `ubuntu` user's `authorized_keys`:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "ssh-ed25519 AAAA...  github-actions-deploy" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Sanity check from your Mac:

```bash
ssh -i ~/.ssh/github_actions ubuntu@YOUR_VPS_IP "echo CONNECTION_OK"
```

## 4. Clone the repo on the VPS

```bash
git clone git@github.com:3w4all-o2mat/abdo-erp-ai.git /home/ubuntu/abdo-erp-ai
cd /home/ubuntu/abdo-erp-ai
ssh-keyscan github.com >> ~/.ssh/known_hosts
```

> The VPS clones over SSH, so it can `git pull` non-interactively during
> deploys. The `ssh-keyscan` line above trusts GitHub's host key.

## 5. Create the production environment file

```bash
cp .env.production.example .env.production
nano .env.production
```

Fill in real values (generate the secrets with the commands in
`.env.production.example`):

```env
POSTGRES_USER=appuser
POSTGRES_PASSWORD=PASTE_GENERATED_PASSWORD
POSTGRES_DB=mini_erp

DATABASE_URL=postgresql://appuser:PASTE_GENERATED_PASSWORD@postgres:5432/mini_erp

AUTH_SECRET=PASTE_OPENSSL_RAND_BASE64_32
NEXTAUTH_SECRET=PASTE_ANOTHER_OPENSSL_RAND_BASE64_32

NEXTAUTH_URL=http://57.131.23.145:3000
```

Lock the file down:

```bash
chmod 600 .env.production
```

> `docker-compose.yml` reads this file via `env_file` for **both** the
> `postgres` and `app` services. No separate `.env` file is needed.

## 6. Add the GitHub repository secrets

On GitHub: **Settings → Secrets and variables → Actions → New repository secret**

| Secret name   | Value                                                   |
|---------------|---------------------------------------------------------|
| `VPS_HOST`    | `57.131.23.145`                                         |
| `VPS_USER`    | `ubuntu`                                                |
| `VPS_SSH_KEY` | entire contents of `~/.ssh/github_actions` on your Mac (the **private** key, with `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` lines) |

## 7. First deploy

The next `git push origin master` will:

1. Run the **CI** job (typecheck + build) on a GitHub runner.
2. SSH into the VPS and run `git pull`.
3. Run `scripts/deploy.sh`, which:
   - builds the `app` image locally with `docker compose build app`,
   - waits for `postgres` to be healthy,
   - runs `prisma migrate deploy` (applies the committed migrations),
   - restarts the `app` container,
   - health-checks `http://127.0.0.1:3000/`,
   - prunes dangling images.

You can also trigger a run manually from the GitHub **Actions** tab
using the **Run workflow** button (the `workflow_dispatch` trigger is
enabled in `.github/workflows/deploy.yml`).

When the workflow succeeds, open:

```
http://57.131.23.145:3000
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `error: missing server host` in the run | `VPS_HOST` secret is empty | Add the secret and re-run |
| `Permission denied (publickey)` on SSH step | The deploy public key isn't in `~/.ssh/authorized_keys` on the VPS | Re-paste `~/.ssh/github_actions.pub` on the VPS |
| `git pull` fails with host key prompt | GitHub isn't in the VPS's `known_hosts` | Re-run `ssh-keyscan github.com >> ~/.ssh/known_hosts` |
| App container exits with `Can't reach database server` | `DATABASE_URL` uses `localhost` instead of the service name | Make sure it uses `@postgres:5432` |
| `prisma migrate deploy` fails with P3009 | Schema drift | Check the migration files in `prisma/migrations/` |
| Port 3000 is closed | VPS firewall or provider firewall | `sudo ufw allow 3000/tcp` and check the provider's network rules |
