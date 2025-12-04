#!/bin/bash
sshpass -p "j6NJuUz^JBu+vr" ssh -o StrictHostKeyChecking=no root@92.255.79.122 << 'REMOTE_SCRIPT'
  # Восстанавливаем оригинальный конфиг
  BACKUP=$(ls -t /etc/nginx/sites-available/zakazhi.online.backup.* 2>/dev/null | head -1)
  if [ -n "$BACKUP" ]; then
    cp "$BACKUP" /etc/nginx/sites-available/zakazhi.online
    echo "Восстановлен из: $BACKUP"
  fi
  
  # Создаем блок конфигурации для vangogi
  VANGOGI_BLOCK='    location /vangogi/ {
        alias /var/www/zakazhi.online/vangogi/;
        try_files $uri $uri/ /vangogi/index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }'
  
  # Находим строку "root /var/www/landing;" и вставляем перед ней
  awk -v block="$VANGOGI_BLOCK" '
    /^    root \/var\/www\/landing;$/ {
        print block
    }
    { print }
  ' /etc/nginx/sites-available/zakazhi.online > /tmp/zakazhi_new.conf
  
  # Проверяем результат
  if grep -q "location /vangogi/" /tmp/zakazhi_new.conf; then
    cp /tmp/zakazhi_new.conf /etc/nginx/sites-available/zakazhi.online
    echo "✅ Конфигурация обновлена"
    
    # Проверяем синтаксис
    echo ""
    echo "Проверка синтаксиса nginx:"
    if nginx -t; then
      echo "✅ Синтаксис корректен"
      echo ""
      echo "Перезагружаю nginx..."
      systemctl reload nginx
      echo "✅ Nginx перезагружен"
    else
      echo "❌ Ошибка в конфигурации, откатываю изменения"
      cp "$BACKUP" /etc/nginx/sites-available/zakazhi.online
      exit 1
    fi
  else
    echo "❌ Не удалось добавить location /vangogi/"
    exit 1
  fi
REMOTE_SCRIPT

