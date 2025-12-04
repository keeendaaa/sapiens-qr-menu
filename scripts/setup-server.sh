#!/bin/bash

# Скрипт для настройки сервера и загрузки сайта
# Использование: ./scripts/setup-server.sh

SERVER="root@92.255.79.122"
PASSWORD="j6NJuUz^JBu+vr"
REMOTE_PATH="/var/www/html/sapiens"

echo "=== Настройка сервера для /sapiens/ ==="
echo ""

# Функция для выполнения команд на сервере
run_ssh() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "$@"
}

echo "1. Проверяю текущую структуру..."
run_ssh "ls -la /var/www/html/ | head -10"

echo ""
echo "2. Создаю директорию для sapiens..."
run_ssh "mkdir -p $REMOTE_PATH"
run_ssh "mkdir -p $REMOTE_PATH/menu"
echo "   ✓ Директории созданы"

echo ""
echo "3. Проверяю конфигурацию nginx..."
run_ssh "ls -la /etc/nginx/sites-enabled/"

echo ""
echo "4. Проверяю основной nginx.conf..."
run_ssh "grep -A 10 'server {' /etc/nginx/nginx.conf | head -15"

echo ""
echo "=== Проверка завершена ==="
echo ""
echo "Следующие шаги:"
echo "  1. Проверить существующую конфигурацию nginx"
echo "  2. Добавить location /sapiens/ в конфигурацию"
echo "  3. Загрузить файлы на сервер"
echo "  4. Перезагрузить nginx"

