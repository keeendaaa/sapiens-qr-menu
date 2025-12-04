#!/bin/bash

# Быстрая проверка сервера через SSH с передачей команд

SERVER="root@92.255.79.122"
PASSWORD="j6NJuUz^JBu+vr"

echo "=== Проверка сервера для /sapiens/ ==="
echo ""

# Проверяем, что menu.json будет доступен
echo "1. Проверяю структуру build..."
if [ ! -f "build/index.html" ]; then
    echo "   ⚠ build/index.html не найден. Запустите 'npm run build' сначала."
fi

if [ ! -f "menu.json" ]; then
    echo "   ⚠ menu.json не найден в корне проекта"
else
    echo "   ✓ menu.json найден"
    # Копируем в build если его там нет
    if [ ! -f "build/menu.json" ]; then
        cp menu.json build/menu.json
        echo "   ✓ menu.json скопирован в build/"
    fi
fi

echo ""
echo "2. Подключение к серверу..."

# Создаем временный скрипт для проверки
cat > /tmp/check_server.sh << 'EOF'
#!/bin/bash
echo "=== Проверка на сервере ==="
echo ""
echo "1. Проверка директории /var/www/html/sapiens:"
if [ -d "/var/www/html/sapiens" ]; then
    echo "   ✓ Директория существует"
    ls -la /var/www/html/sapiens | head -15
else
    echo "   ❌ Директория не существует"
fi

echo ""
echo "2. Проверка nginx конфигурации:"
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo "   Проверяю /etc/nginx/sites-enabled/default:"
    grep -A 5 "sapiens" /etc/nginx/sites-enabled/default || echo "   Конфигурация sapiens не найдена"
fi

if [ -f "/etc/nginx/nginx.conf" ]; then
    echo "   Проверяю /etc/nginx/nginx.conf:"
    grep -A 5 "sapiens" /etc/nginx/nginx.conf || echo "   Конфигурация sapiens не найдена"
fi

echo ""
echo "3. Проверка файлов:"
if [ -f "/var/www/html/sapiens/index.html" ]; then
    echo "   ✓ index.html существует"
    head -5 /var/www/html/sapiens/index.html
else
    echo "   ❌ index.html не найден"
fi

if [ -f "/var/www/html/sapiens/menu.json" ]; then
    echo "   ✓ menu.json существует"
    ls -lh /var/www/html/sapiens/menu.json
else
    echo "   ❌ menu.json не найден"
fi

if [ -d "/var/www/html/sapiens/menu" ]; then
    echo "   ✓ Директория menu существует"
    ls /var/www/html/sapiens/menu | head -5
else
    echo "   ❌ Директория menu не найдена"
fi

echo ""
echo "4. Проверка статуса nginx:"
systemctl status nginx --no-pager | head -10 || service nginx status | head -10

EOF

# Копируем скрипт на сервер и выполняем
echo "   Копирую скрипт проверки..."
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no /tmp/check_server.sh "$SERVER:/tmp/check_server.sh"

echo "   Запускаю проверку..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "bash /tmp/check_server.sh"

echo ""
echo "=== Проверка завершена ==="
rm -f /tmp/check_server.sh

