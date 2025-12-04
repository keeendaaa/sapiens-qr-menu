#!/bin/bash

# Скрипт для добавления конфигурации nginx для /sapiens/

SERVER="root@92.255.79.122"
PASSWORD="j6NJuUz^JBu+vr"
NGINX_CONFIG="/etc/nginx/sites-available/zakazhi.online"

echo "=== Добавление конфигурации nginx для /sapiens/ ==="
echo ""

run_ssh() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "$@"
}

# Создаем блок конфигурации
CONFIG_BLOCK='    location /sapiens/ {
        alias /var/www/html/sapiens/;
        try_files $uri $uri/ /sapiens/index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|json)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }'

# Проверяем, есть ли уже конфигурация
if run_ssh "grep -q 'location /sapiens/' $NGINX_CONFIG"; then
    echo "   ✓ Конфигурация /sapiens/ уже существует"
    exit 0
fi

echo "   Добавляю конфигурацию..."

# Создаем временный скрипт на сервере для безопасного добавления конфигурации
run_ssh "cat > /tmp/add_sapiens_config.sh << 'ENDOFSCRIPT'
#!/bin/bash
CONFIG_FILE=\"$NGINX_CONFIG\"
BACKUP_FILE=\"\${CONFIG_FILE}.backup.\$(date +%Y%m%d_%H%M%S)\"

# Создаем бэкап
cp \"\$CONFIG_FILE\" \"\$BACKUP_FILE\"
echo \"Бэкап создан: \$BACKUP_FILE\"

# Ищем место для вставки - перед последней закрывающей скобкой блока server (перед root /var/www/landing)
# Ищем строку с \"root /var/www/landing\" и вставляем перед ней
if grep -q 'root /var/www/landing' \"\$CONFIG_FILE\"; then
    # Вставляем перед строкой с root
    sed -i '/root \/var\/www\/landing/i\
    location /sapiens/ {\
        alias /var/www/html/sapiens/;\
        try_files \$uri \$uri/ /sapiens/index.html;\
        \
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|json)\$ {\
            expires 1y;\
            add_header Cache-Control \"public, immutable\";\
        }\
        \
        location ~* \\.html\$ {\
            expires -1;\
            add_header Cache-Control \"no-cache, no-store, must-revalidate\";\
        }\
    }\
' \"\$CONFIG_FILE\"
    echo \"✓ Конфигурация добавлена перед root /var/www/landing\"
else
    # Если не нашли, вставляем перед последней закрывающей скобкой server
    # Ищем последнюю } перед последней строкой файла
    LINE_NUM=\$(grep -n '^}' \"\$CONFIG_FILE\" | tail -1 | cut -d: -f1)
    if [ -n \"\$LINE_NUM\" ]; then
        sed -i \"\$((LINE_NUM-1)) a\\
    location /sapiens/ {\\
        alias /var/www/html/sapiens/;\\
        try_files \\\$uri \\\$uri/ /sapiens/index.html;\\
        \\
        location ~* \\\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|json)\\\$ {\\
            expires 1y;\\
            add_header Cache-Control \\\"public, immutable\\\";\\
        }\\
        \\
        location ~* \\\\.html\\\$ {\\
            expires -1;\\
            add_header Cache-Control \\\"no-cache, no-store, must-revalidate\\\";\\
        }\\
    }\\
\" \"\$CONFIG_FILE\"
        echo \"✓ Конфигурация добавлена перед закрывающей скобкой\"
    else
        echo \"❌ Не удалось найти место для вставки\"
        exit 1
    fi
fi
ENDOFSCRIPT
"

run_ssh "chmod +x /tmp/add_sapiens_config.sh && bash /tmp/add_sapiens_config.sh"

echo ""
echo "5. Проверка конфигурации nginx..."
if run_ssh "nginx -t 2>&1"; then
    echo ""
    echo "   ✓ Конфигурация nginx валидна"
    echo ""
    echo "6. Перезагрузка nginx..."
    if run_ssh "systemctl reload nginx 2>&1"; then
        echo "   ✓ Nginx перезагружен"
    else
        echo "   ⚠ Не удалось перезагрузить nginx автоматически"
        echo "   Выполните вручную: systemctl reload nginx"
    fi
else
    echo ""
    echo "   ❌ Ошибка в конфигурации nginx!"
    echo "   Бэкап создан. Проверьте конфигурацию вручную."
    exit 1
fi

echo ""
echo "=== Готово! ==="
echo ""
echo "Сайт должен быть доступен по адресу: https://zakazhi.online/sapiens/"
echo ""
echo "Проверьте в браузере или выполните:"
echo "  curl -I https://zakazhi.online/sapiens/"

