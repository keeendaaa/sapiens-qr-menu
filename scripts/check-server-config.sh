#!/bin/bash

# Скрипт для проверки конфигурации сервера для /sapiens/

SERVER="root@92.255.79.122"
PASSWORD="j6NJuUz^JBu+vr"

echo "=== Проверка конфигурации сервера для /sapiens/ ==="
echo ""

# Функция для выполнения команд на сервере
run_ssh() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "$@"
}

echo "1. Проверка структуры директорий..."
run_ssh "ls -la /var/www/html/ | grep sapiens || echo 'Директория sapiens не найдена'"

echo ""
echo "2. Проверка конфигурации nginx..."
run_ssh "cat /etc/nginx/sites-enabled/* | grep -A 10 sapiens || cat /etc/nginx/nginx.conf | grep -A 10 sapiens || echo 'Конфигурация sapiens не найдена'"

echo ""
echo "3. Проверка доступности файлов..."
run_ssh "ls -la /var/www/html/sapiens/ 2>/dev/null | head -10 || echo 'Директория не существует'"

echo ""
echo "4. Проверка index.html..."
run_ssh "head -30 /var/www/html/sapiens/index.html 2>/dev/null || echo 'index.html не найден'"

echo ""
echo "5. Проверка директории menu..."
run_ssh "ls -la /var/www/html/sapiens/menu/ 2>/dev/null | head -10 || echo 'Директория menu не найдена'"

echo ""
echo "6. Проверка menu.json..."
run_ssh "ls -lh /var/www/html/sapiens/menu.json 2>/dev/null || echo 'menu.json не найден'"

echo ""
echo "7. Проверка статуса nginx..."
run_ssh "systemctl status nginx | head -10 || service nginx status | head -10"

echo ""
echo "=== Проверка завершена ==="

