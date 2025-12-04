#!/bin/bash

# Скрипт для проверки и деплоя на сервер
# Использование: ./scripts/deploy-check.sh

SERVER="root@92.255.79.122"
PASSWORD="j6NJuUz^JBu+vr"
REMOTE_PATH="/var/www/html/sapiens"
LOCAL_BUILD="build"

echo "=== Проверка и деплой сайта на zakazhi.online/sapiens/ ==="
echo ""

# Функция для выполнения команд на сервере
run_ssh() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "$@"
}

# Функция для копирования файлов
run_scp() {
    sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no -r "$@"
}

echo "1. Проверка локальной сборки..."
if [ ! -d "$LOCAL_BUILD" ]; then
    echo "   ❌ Директория $LOCAL_BUILD не найдена. Запустите 'npm run build' сначала."
    exit 1
fi

if [ ! -f "$LOCAL_BUILD/index.html" ]; then
    echo "   ❌ index.html не найден в $LOCAL_BUILD"
    exit 1
fi

# Проверяем menu.json
if [ ! -f "menu.json" ]; then
    echo "   ❌ menu.json не найден в корне проекта"
    exit 1
fi

echo "   ✓ Локальная сборка найдена"

# Копируем menu.json в build если его там нет
if [ ! -f "$LOCAL_BUILD/menu.json" ]; then
    echo "   Копирую menu.json в build..."
    cp menu.json "$LOCAL_BUILD/menu.json"
    echo "   ✓ menu.json скопирован"
fi

echo ""
echo "2. Подключение к серверу и проверка..."

# Проверяем подключение
if ! run_ssh "echo 'Connected'" > /dev/null 2>&1; then
    echo "   ❌ Не удалось подключиться к серверу. Проверьте пароль и доступность сервера."
    exit 1
fi

echo "   ✓ Подключение к серверу успешно"

echo ""
echo "3. Проверка удаленной директории..."
if run_ssh "[ -d $REMOTE_PATH ]"; then
    echo "   ✓ Директория $REMOTE_PATH существует"
    run_ssh "ls -la $REMOTE_PATH | head -10"
else
    echo "   ⚠ Директория $REMOTE_PATH не существует, будет создана"
    run_ssh "mkdir -p $REMOTE_PATH"
fi

echo ""
echo "4. Проверка конфигурации nginx..."
if run_ssh "grep -r 'sapiens' /etc/nginx/sites-enabled/ 2>/dev/null || grep -r 'sapiens' /etc/nginx/nginx.conf 2>/dev/null"; then
    echo "   ✓ Конфигурация nginx найдена"
else
    echo "   ⚠ Конфигурация nginx для /sapiens/ не найдена"
    echo "   Нужно добавить location /sapiens/ в конфигурацию nginx"
fi

echo ""
echo "5. Копирование файлов на сервер..."
echo "   Это может занять некоторое время..."

# Создаем временную директорию для копирования
TEMP_DIR=$(mktemp -d)
cp -r "$LOCAL_BUILD"/* "$TEMP_DIR/"

# Копируем файлы
run_scp "$TEMP_DIR"/* "$SERVER:$REMOTE_PATH/"

# Удаляем временную директорию
rm -rf "$TEMP_DIR"

echo "   ✓ Файлы скопированы"

echo ""
echo "6. Проверка прав доступа..."
run_ssh "chmod -R 755 $REMOTE_PATH && chown -R www-data:www-data $REMOTE_PATH 2>/dev/null || chown -R nginx:nginx $REMOTE_PATH 2>/dev/null"
echo "   ✓ Права установлены"

echo ""
echo "7. Проверка доступности..."
run_ssh "ls -la $REMOTE_PATH | head -10"

echo ""
echo "=== Готово! ==="
echo ""
echo "Сайт должен быть доступен по адресу: https://zakazhi.online/sapiens/"
echo ""
echo "Если есть проблемы, проверьте:"
echo "  1. Конфигурацию nginx для /sapiens/"
echo "  2. Права доступа к файлам"
echo "  3. Логи nginx: tail -f /var/log/nginx/error.log"

