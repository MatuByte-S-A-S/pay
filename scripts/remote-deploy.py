#!/usr/bin/env python3
"""Despliegue remoto PayMatuByte vía SSH. Uso: SSH_PASS=... python scripts/remote-deploy.py"""
import os
import sys
import paramiko

HOST = os.environ.get("DEPLOY_HOST", "13.140.160.248")
USER = os.environ.get("DEPLOY_USER", "root")
PASSWORD = os.environ.get("SSH_PASS", "")
APP_DIR = "/root/apps/pay"

if not PASSWORD:
    print("ERROR: define SSH_PASS", file=sys.stderr)
    sys.exit(1)

sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def run(client, cmd, timeout=600):
    print(f"\n>>> {cmd}")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out.rstrip())
    if err.strip():
        print("STDERR:", err.rstrip())
    if code != 0:
        raise RuntimeError(f"Command failed ({code}): {cmd}")
    return out


def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    env_content = os.environ.get("PAY_ENV_CONTENT")
    if env_content:
        sftp = client.open_sftp()
        with sftp.file(f"{APP_DIR}/.env", "w") as f:
            f.write(env_content)
        sftp.close()
        print("✓ .env subido")

    run(client, f"cd {APP_DIR} && git pull origin main")
    run(client, f"cd {APP_DIR} && bash deploy/deploy.sh", timeout=900)
    run(client, f"cd {APP_DIR} && sudo bash deploy/fix-nginx-pay.sh", timeout=120)

    cert_check = run(
        client,
        "test -f /etc/letsencrypt/live/pay.matubyte.com/fullchain.pem && echo HAS_SSL || echo NO_SSL",
    )
    if "NO_SSL" in cert_check:
        print("\n⚠ Sin certificado SSL para pay.matubyte.com — ejecuta manualmente:")
        print(f"  cd {APP_DIR} && sudo bash deploy/setup-ssl.sh")

    run(client, "pm2 list")
    run(client, "curl -sS -m 10 http://127.0.0.1:3020/health")
    run(client, "curl -sS -m 10 https://pay.matubyte.com/health | head -c 400")
    client.close()
    print("\n✓ Despliegue completado")


if __name__ == "__main__":
    main()
