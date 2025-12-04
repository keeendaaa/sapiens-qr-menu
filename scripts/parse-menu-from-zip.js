const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

// Используем yauzl для работы с zip (если нужно будет установить)
// Пока используем простой подход с child_process для unzip
const { execSync } = require('child_process');

const ZIP_FILE = path.join(__dirname, '..', 'sapiens photo.zip');
const EXTRACT_DIR = path.join(__dirname, '..', 'temp_extracted');
const MENU_DIR = path.join(__dirname, '..', 'src', 'assets', 'menu');
const MENU_JSON_PATH = path.join(__dirname, '..', 'menu.json');

// Категории для автоматической классификации
const CATEGORY_KEYWORDS = {
  'Десерты': ['десерт', 'пирог', 'торт', 'кекс', 'вафля', 'блинчик', 'сырник', 'чизкейк', 'медовик', 'синнабон', 'крафл', 'орео'],
  'Закуски': ['закуск', 'оливк', 'маслин', 'артишок', 'карпаччо', 'брускетт'],
  'Мясные блюда': ['мясн', 'перепелк', 'утк', 'котлет', 'шатобриан', 'брискет', 'бургер', 'бекон', 'окорок', 'омлет', 'яйц'],
  'Рыба и морепродукты': ['рыб', 'лосос', 'тунец', 'угор', 'креветк', 'гребешок', 'краб', 'икра', 'ролл', 'суши', 'голубец', 'треск', 'щук'],
  'Салаты': ['салат', 'руккола', 'боул', 'коул'],
  'Супы': ['суп', 'бульон', 'том-ям', 'вонтон'],
  'Суши и роллы': ['ролл', 'суши', 'калифорни', 'филадельфи'],
  'Завтраки': ['завтрак', 'вафля', 'бриошь', 'драник', 'скрэмбл', 'птитим', 'киноа', 'овсян'],
  'Прочее': []
};

// Функция для определения категории по названию блюда
function detectCategory(dishName) {
  const lowerName = dishName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'Прочее';
}

// Функция для нормализации имени файла (удаление расширения и исправление кодировки)
function normalizeFileName(fileName) {
  // Удаляем расширение
  let name = fileName.replace(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/i, '');
  
  // Пытаемся исправить кодировку, если она неправильная
  // Если имя уже в правильной кодировке, просто возвращаем
  try {
    // Пытаемся декодировать как CP1251 и перекодировать в UTF-8
    if (Buffer.from(name, 'latin1').toString('utf8') !== name) {
      name = Buffer.from(name, 'latin1').toString('utf8');
    }
  } catch (e) {
    // Если не получается, оставляем как есть
  }
  
  return name.trim();
}

// Основная функция парсинга
async function parseMenuFromZip() {
  console.log('Начинаю парсинг меню из zip-архива...');
  
  // Очищаем временную директорию
  if (fs.existsSync(EXTRACT_DIR)) {
    fs.rmSync(EXTRACT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(EXTRACT_DIR, { recursive: true });
  
  // Извлекаем zip-архив
  console.log('Извлекаю файлы из zip-архива...');
  try {
    execSync(`unzip -q -o "${ZIP_FILE}" -d "${EXTRACT_DIR}"`, { encoding: 'utf8' });
  } catch (error) {
    console.error('Ошибка при извлечении zip:', error.message);
    // Попробуем использовать node-yauzl или другой метод
    console.log('Пробую альтернативный метод...');
    // Используем python для извлечения с правильной кодировкой
    const pythonScript = `
import zipfile
import sys
import os

zip_path = sys.argv[1]
extract_dir = sys.argv[2]

with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    for member in zip_ref.namelist():
        try:
            # Пытаемся исправить кодировку имени файла
            try:
                name = member.encode('cp437').decode('cp1251')
            except:
                name = member
            zip_ref.extract(member, extract_dir)
            # Переименовываем файл с правильной кодировкой
            old_path = os.path.join(extract_dir, member)
            new_path = os.path.join(extract_dir, name)
            if os.path.exists(old_path) and old_path != new_path:
                os.makedirs(os.path.dirname(new_path), exist_ok=True)
                if os.path.exists(new_path):
                    os.remove(new_path)
                os.rename(old_path, new_path)
        except Exception as e:
            print(f"Ошибка при обработке {member}: {e}", file=sys.stderr)
`;
    fs.writeFileSync(path.join(EXTRACT_DIR, 'extract.py'), pythonScript);
    try {
      execSync(`python3 "${path.join(EXTRACT_DIR, 'extract.py')}" "${ZIP_FILE}" "${EXTRACT_DIR}"`, { encoding: 'utf8' });
    } catch (pyError) {
      console.error('Ошибка при использовании Python:', pyError.message);
      throw new Error('Не удалось извлечь zip-архив');
    }
  }
  
  // Ищем все изображения во всех поддиректориях
  console.log('Ищу изображения...');
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'];
  const images = [];
  
  function findImages(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        findImages(fullPath);
      } else if (imageExtensions.some(ext => entry.name.endsWith(ext))) {
        images.push(fullPath);
      }
    }
  }
  
  findImages(EXTRACT_DIR);
  
  console.log(`Найдено ${images.length} изображений`);
  
  // Читаем существующий menu.json, если он есть
  let existingMenu = { menu: { categories: [] }, all_items: [], statistics: { total_items: 0, categories_count: 0 } };
  let maxId = 0;
  
  if (fs.existsSync(MENU_JSON_PATH)) {
    try {
      existingMenu = JSON.parse(fs.readFileSync(MENU_JSON_PATH, 'utf8'));
      // Находим максимальный ID
      if (existingMenu.all_items && existingMenu.all_items.length > 0) {
        maxId = Math.max(...existingMenu.all_items.map(item => item.id || 0));
      }
    } catch (e) {
      console.warn('Не удалось прочитать существующий menu.json, создаю новый');
    }
  }
  
  // Создаем карту существующих блюд по имени для проверки дубликатов
  const existingDishes = new Map();
  if (existingMenu.all_items) {
    existingMenu.all_items.forEach(item => {
      existingDishes.set(item.name.toLowerCase(), item);
    });
  }
  
  // Обрабатываем каждое изображение
  const newDishes = [];
  const categoryMap = new Map();
  
  // Убеждаемся, что директория menu существует
  if (!fs.existsSync(MENU_DIR)) {
    fs.mkdirSync(MENU_DIR, { recursive: true });
  }
  
  for (const imagePath of images) {
    const fileName = path.basename(imagePath);
    const dishName = normalizeFileName(fileName);
    
    // Пропускаем, если имя пустое или слишком короткое
    if (!dishName || dishName.length < 3) {
      console.warn(`Пропускаю файл с неподходящим именем: ${fileName}`);
      continue;
    }
    
    // Проверяем, не существует ли уже такое блюдо
    if (existingDishes.has(dishName.toLowerCase())) {
      console.log(`Блюдо "${dishName}" уже существует, пропускаю`);
      continue;
    }
    
    const ext = path.extname(imagePath).toLowerCase();
    const imageFormat = ext.replace('.', '');
    
    // Создаем безопасное имя файла для сохранения
    const safeFileName = `${dishName.replace(/[^a-zA-Z0-9а-яёА-ЯЁ\s]/g, '_').replace(/\s+/g, '_')}${ext}`;
    const targetImagePath = path.join(MENU_DIR, safeFileName);
    
    // Копируем изображение
    fs.copyFileSync(imagePath, targetImagePath);
    console.log(`Скопировано: ${fileName} -> ${safeFileName}`);
    
    // Определяем категорию
    const category = detectCategory(dishName);
    
    // Создаем объект блюда
    maxId++;
    const dish = {
      id: maxId,
      name: dishName,
      category: category,
      image: `images/${safeFileName}`,
      image_format: imageFormat,
      description: null,
      composition: null,
      allergens: null
    };
    
    newDishes.push(dish);
    
    // Добавляем в карту категорий
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category).push(dish);
  }
  
  console.log(`\nОбработано ${newDishes.length} новых блюд`);
  console.log(`Категории: ${Array.from(categoryMap.keys()).join(', ')}`);
  
  // Объединяем существующие и новые блюда
  const allDishes = [...(existingMenu.all_items || []), ...newDishes];
  
  // Группируем по категориям
  const categoriesMap = new Map();
  
  // Сначала добавляем существующие категории
  if (existingMenu.menu && existingMenu.menu.categories) {
    existingMenu.menu.categories.forEach(cat => {
      categoriesMap.set(cat.name, [...cat.items]);
    });
  }
  
  // Добавляем новые блюда к категориям
  newDishes.forEach(dish => {
    if (!categoriesMap.has(dish.category)) {
      categoriesMap.set(dish.category, []);
    }
    categoriesMap.get(dish.category).push(dish);
  });
  
  // Формируем структуру меню
  const menuStructure = {
    menu: {
      categories: Array.from(categoriesMap.entries()).map(([categoryName, items]) => ({
        name: categoryName,
        items: items,
        count: items.length
      }))
    },
    all_items: allDishes,
    statistics: {
      total_items: allDishes.length,
      categories_count: categoriesMap.size
    }
  };
  
  // Сохраняем menu.json
  fs.writeFileSync(MENU_JSON_PATH, JSON.stringify(menuStructure, null, 2), 'utf8');
  console.log(`\nmenu.json обновлен: ${allDishes.length} блюд в ${categoriesMap.size} категориях`);
  
  // Очищаем временную директорию
  fs.rmSync(EXTRACT_DIR, { recursive: true, force: true });
  
  console.log('\nГотово!');
}

// Запускаем парсинг
parseMenuFromZip().catch(error => {
  console.error('Ошибка:', error);
  process.exit(1);
});

