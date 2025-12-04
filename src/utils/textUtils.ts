/**
 * Утилиты для очистки текста от технических пометок
 */

/**
 * Очищает текст от технических пометок и предупреждений
 * @param text - текст для очистки
 * @returns очищенный текст
 */
export function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Убираем полные фразы с предупреждениями и техническими данными
  cleaned = cleaned.replace(/⚠\s*Обязательно предупредить о:\s*Технические данные/gi, '');
  cleaned = cleaned.replace(/⚠\s*Обязательно предупредить (о|гостей о):\s*Технические данные/gi, '');
  cleaned = cleaned.replace(/⚠\s*Важно предупредить гостей о наличии:\s*[^.]*Технические данные/gi, '');
  
  // Убираем предупреждения (различные варианты)
  cleaned = cleaned.replace(/⚠\s*Обязательно предупредить (о|гостей о):\s*/gi, '');
  cleaned = cleaned.replace(/⚠\s*Важно предупредить (о|гостей о):\s*/gi, '');
  cleaned = cleaned.replace(/⚠\s*Обязательно предупреждать (о|гостей о):\s*/gi, '');
  cleaned = cleaned.replace(/⚠\s*Важно предупреждать (о|гостей о):\s*/gi, '');
  cleaned = cleaned.replace(/⚠\s*Обязательно предупреждать гостей о:\s*/gi, '');
  cleaned = cleaned.replace(/⚠\s*Важно предупреждать гостей о наличии:\s*/gi, '');
  cleaned = cleaned.replace(/⚠\s*Обязательно предупредить гостей о:\s*/gi, '');
  cleaned = cleaned.replace(/⚠\s*Важно предупредить гостей о наличии:\s*/gi, '');
  cleaned = cleaned.replace(/⚠\s*Обязательно предупредить о:\s*/gi, '');
  cleaned = cleaned.replace(/⚠\s*Важно:\s*/gi, '');
  cleaned = cleaned.replace(/⚠\s*/g, '');
  
  // Убираем пустые строки с предупреждениями (если после очистки осталась только пустая строка)
  cleaned = cleaned.replace(/^⚠\s*Важно предупреждать гостей о наличии:\s*$/gim, '');
  
  // Убираем упоминания технических данных
  cleaned = cleaned.replace(/Технические данные/gi, '');
  cleaned = cleaned.replace(/технические данные/gi, '');
  
  // Убираем звездочки в начале строк
  cleaned = cleaned.replace(/^\s*\*\s*/gm, '');
  
  // Нормализуем пробелы (сохраняем переносы строк для composition)
  return cleaned
    .split('\n')
    .map(line => line.trim().replace(/\s+/g, ' '))
    .filter(line => line.length > 0)
    .join('\n')
    .trim();
}

