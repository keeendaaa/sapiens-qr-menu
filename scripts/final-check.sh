#!/bin/bash

# Финальная проверка работы сайта

SERVER="root@92.255.79.122"
PASSWORD="j6NJuUz^JBu+vr"

echo "=== Финальная проверка сайта zakazhi.online/sapiens/ ==="
echo ""

run_ssh() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "$@"
}

echo "1. Проверка доступности сайта..."
if curl -s -o /dev/null -w "%{http_code}" https://zakazhi.online/sapiens/ | grep -q "200"; then
    echo "   ✓ Сайт доступен (HTTP 200)"
else
    echo "   ❌ Сайт недоступен"
fi

echo ""
echo "2. Проверка файлов на сервере..."
run_ssh "echo 'index.html:' && ls -lh /var/www/html/sapiens/index.html"
run_ssh "echo 'menu.json:' && ls -lh /var/www/html/sapiens/menu.json"
run_ssh "echo 'Количество изображений:' && ls /var/www/html/sapiens/menu/ | wc -l"

echo ""
echo "3. Проверка конфигурации nginx..."
if run_ssh "grep -q 'location /sapiens/' /etc/nginx/sites-available/zakazhi.online"; then
    echo "   ✓ Конфигурация /sapiens/ найдена"
else
    echo "   ❌ Конфигурация /sapiens/ не найдена"
fi

echo ""
echo "4. Проверка статуса nginx..."
run_ssh "systemctl is-active nginx && echo '   ✓ Nginx работает' || echo '   ❌ Nginx не работает'"

echo ""
echo "=== Проверка завершена ==="
echo ""
echo "Сайт должен быть доступен по адресу:"
echo "  https://zakazhi.online/sapiens/"
echo ""
echo "Если есть проблемы, проверьте:"
echo "  - Логи nginx: tail -f /var/log/nginx/zakazhi_error.log"
echo "  - Браузерную консоль для ошибок загрузки ресурсов"

