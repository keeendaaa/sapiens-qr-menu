#!/bin/bash

# Скрипт для исправления и добавления конфигурации nginx для /sapiens/

SERVER="root@92.255.79.122"
PASSWORD="j6NJuUz^JBu+vr"
NGINX_CONFIG="/etc/nginx/sites-available/zakazhi.online"

echo "=== Исправление и добавление конфигурации nginx ==="
echo ""

run_ssh() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "$@"
}

# Создаем исправленную конфигурацию на сервере
echo "1. Создаю исправленную конфигурацию..."

run_ssh "cat > /tmp/zakazhi.online.new << 'ENDOFCONFIG'
server {
    listen 80;
    server_name zakazhi.online www.zakazhi.online;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name zakazhi.online www.zakazhi.online;

    ssl_certificate /etc/letsencrypt/live/zakazhi.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zakazhi.online/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    access_log /var/log/nginx/zakazhi_access.log;
    error_log /var/log/nginx/zakazhi_error.log;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
    add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains\" always;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location /sapiens/ {
        alias /var/www/html/sapiens/;
        try_files \$uri \$uri/ /sapiens/index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|json)\$ {
            expires 1y;
            add_header Cache-Control \"public, immutable\";
        }
        
        location ~* \.html\$ {
            expires -1;
            add_header Cache-Control \"no-cache, no-store, must-revalidate\";
        }
    }

    location /mvp/ {
        alias /var/www/zakazhimvp/build/;
        try_files \$uri \$uri/ /mvp/index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)\$ {
            expires 1y;
            add_header Cache-Control \"public, immutable\";
        }
        
        location ~* \.html\$ {
            expires -1;
            add_header Cache-Control \"no-cache, no-store, must-revalidate\";
        }
    }

    location /yourgos/ {
        alias /var/www/yourgos/;
        try_files \$uri \$uri/ /yourgos/index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)\$ {
            expires 1y;
            add_header Cache-Control \"public, immutable\";
        }
        
        location ~* \.html\$ {
            expires -1;
            add_header Cache-Control \"no-cache, no-store, must-revalidate\";
        }
    }

    location /vangogi/ {
        alias /var/www/zakazhi.online/vangogi/;
        try_files \$uri \$uri/ /vangogi/index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)\$ {
            expires 1y;
            add_header Cache-Control \"public, immutable\";
        }
        
        location ~* \.html\$ {
            expires -1;
            add_header Cache-Control \"no-cache, no-store, must-revalidate\";
        }
    }

    location /webhook-test/ {
        proxy_pass http://127.0.0.1:5678/webhook-test/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    root /var/www/landing;
    index index.html;
}
ENDOFCONFIG
"

echo "   ✓ Новая конфигурация создана"

echo ""
echo "2. Проверка синтаксиса новой конфигурации..."
if run_ssh "nginx -t -c /tmp/zakazhi.online.new 2>&1 || echo 'Проверка через подстановку...'"; then
    echo "   Конфигурация будет проверена после применения"
else
    echo "   Создаю конфигурацию напрямую в файле"
fi

echo ""
echo "3. Создание бэкапа и применение новой конфигурации..."
run_ssh "
BACKUP_FILE=\"${NGINX_CONFIG}.backup.\$(date +%Y%m%d_%H%M%S)\"
cp \"${NGINX_CONFIG}\" \"\$BACKUP_FILE\"
echo \"Бэкап создан: \$BACKUP_FILE\"
cp /tmp/zakazhi.online.new \"${NGINX_CONFIG}\"
echo \"Новая конфигурация применена\"
"

echo ""
echo "4. Проверка конфигурации nginx..."
if run_ssh "nginx -t 2>&1"; then
    echo ""
    echo "   ✓ Конфигурация nginx валидна!"
    echo ""
    echo "5. Перезагрузка nginx..."
    if run_ssh "systemctl reload nginx 2>&1"; then
        echo "   ✓ Nginx успешно перезагружен!"
    else
        echo "   ⚠ Проблема с перезагрузкой, проверьте вручную"
    fi
else
    echo ""
    echo "   ❌ Ошибка в конфигурации! Восстанавливаю бэкап..."
    run_ssh "BACKUP=\$(ls -t ${NGINX_CONFIG}.backup.* | head -1) && cp \"\$BACKUP\" \"${NGINX_CONFIG}\" && echo \"Бэкап восстановлен: \$BACKUP\""
    exit 1
fi

echo ""
echo "=== Готово! ==="
echo ""
echo "Сайт должен быть доступен по адресу: https://zakazhi.online/sapiens/"

