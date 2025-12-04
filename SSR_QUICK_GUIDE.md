# Быстрый гайд по пререндерингу

## Рекомендуемый подход: SSG с react-snap

### Шаг 1: Установка
```bash
npm install --save-dev react-snap
```

### Шаг 2: Обновление package.json
```json
{
  "scripts": {
    "build": "vite build",
    "postbuild": "react-snap"
  },
  "reactSnap": {
    "include": ["/"],
    "skipThirdPartyRequests": true,
    "minifyHtml": {
      "collapseWhitespace": false,
      "removeComments": false
    }
  }
}
```

### Шаг 3: Обновление index.html
Убедитесь, что есть:
```html
<div id="root"></div>
```

### Шаг 4: Сборка
```bash
npm run build
```

### Результат
- HTML файлы с пререндеренным контентом
- Статический деплой через nginx (без изменений)
- Улучшенный SEO и скорость загрузки

### Время реализации: 2-4 часа

