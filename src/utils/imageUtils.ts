/**
 * Утилиты для работы с изображениями меню
 */

/**
 * Получает URL изображения из пути в menu.json
 * @param imagePath - путь из menu.json (например, "images/filename.jpg")
 * @returns URL изображения или пустая строка
 */
export function getMenuImageUrl(imagePath: string): string {
  if (!imagePath) return '';
  
  // Если путь начинается с "images/", извлекаем имя файла
  if (imagePath.startsWith('images/')) {
    const filename = imagePath.replace('images/', '');
    
    // В Vite файлы из public/ доступны через корневой путь
    // base: '/sapiens/' настроен в vite.config.ts
    // Поэтому используем путь относительно base
    return `/sapiens/menu/${filename}`;
  }
  
  return imagePath;
}

