#!/bin/bash

# Полный деплой на сервер
# Использование: ./scripts/deploy-to-server.sh

SERVER="root@92.255.79.122"
PASSWORD="j6NJuUz^JBu+vr"
REMOTE_PATH="/var/www/html/sapiens"
NGINX_CONFIG="/etc/nginx/sites-available/zakazhi.online"

echo "=== Деплой сайта на zakazhi.online/sapiens/ ==="
echo ""

# Функция для выполнения команд на сервере
run_ssh() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "$@"
}

# Функция для копирования файлов
run_scp() {
    sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no -r "$@"
}

# Проверка локальной сборки
echo "1. Проверка локальной сборки..."
if [ ! -d "build" ]; then
    echo "   ❌ Директория build не найдена. Запустите 'npm run build' сначала."
    exit 1
fi

if [ ! -f "build/index.html" ]; then
    echo "   ❌ index.html не найден в build/"
    exit 1
fi

if [ ! -f "menu.json" ]; then
    echo "   ❌ menu.json не найден в корне проекта"
    exit 1
fi

# Копируем menu.json в build
if [ ! -f "build/menu.json" ]; then
    echo "   Копирую menu.json в build..."
    cp menu.json build/menu.json
fi

echo "   ✓ Локальная сборка готова"

# Создаем директорию на сервере
echo ""
echo "2. Создание директории на сервере..."
run_ssh "mkdir -p $REMOTE_PATH/menu"
echo "   ✓ Директории созданы"

# Копируем файлы
echo ""
echo "3. Загрузка файлов на сервер (это может занять время)..."
echo "   Загружаю build/*..."

# Копируем все файлы из build
run_scp build/* "$SERVER:$REMOTE_PATH/"

echo "   ✓ Файлы загружены"

# Устанавливаем права
echo ""
echo "4. Установка прав доступа..."
run_ssh "chmod -R 755 $REMOTE_PATH && chown -R www-data:www-data $REMOTE_PATH 2>/dev/null || chown -R nginx:nginx $REMOTE_PATH 2>/dev/null"
echo "   ✓ Права установлены"

# Проверяем конфигурацию nginx
echo ""
echo "5. Проверка конфигурации nginx..."
if run_ssh "grep -q 'location /sapiens/' $NGINX_CONFIG"; then
    echo "   ✓ Конфигурация /sapiens/ уже существует"
else
    echo "   ⚠ Конфигурация /sapiens/ не найдена"
    echo "   Нужно добавить location /sapiens/ в конфигурацию nginx"
    echo ""
    echo "   Добавьте следующий блок в $NGINX_CONFIG перед закрывающей скобкой server {"
    echo ""
    echo "    location /sapiens/ {"
    echo "        alias /var/www/html/sapiens/;"
    echo "        try_files \$uri \$uri/ /sapiens/index.html;"
    echo "        "
    echo "        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|json)\$ {"
    echo "            expires 1y;"
    echo "            add_header Cache-Control \"public, immutable\";"
    echo "        }"
    echo "        "
    echo "        location ~* \.html\$ {"
    echo "            expires -1;"
    echo "            add_header Cache-Control \"no-cache, no-store, must-revalidate\";"
    echo "        }"
    echo "    }"
    echo ""
fi

echo ""
echo "=== Деплой завершен! ==="
echo ""
echo "Следующие шаги:"
echo "  1. Если конфигурация nginx не была добавлена, добавьте её вручную"
echo "  2. Проверьте конфигурацию: nginx -t"
echo "  3. Перезагрузите nginx: systemctl reload nginx"
echo "  4. Проверьте сайт: https://zakazhi.online/sapiens/"

