#!/bin/bash

# Проверка и обновление конфигурации nginx

SERVER="root@92.255.79.122"
PASSWORD="j6NJuUz^JBu+vr"

echo "=== Проверка конфигурации nginx ==="
echo ""

run_ssh() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "$@"
}

echo "1. Читаю конфигурацию zakazhi.online..."
run_ssh "cat /etc/nginx/sites-available/zakazhi.online"

echo ""
echo "=== Конец конфигурации ==="

