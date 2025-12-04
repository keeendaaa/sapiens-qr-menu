#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import zipfile
import os
import json
import shutil
from pathlib import Path
import re

# Пути
ZIP_FILE = Path(__file__).parent.parent / "sapiens photo.zip"
EXTRACT_DIR = Path(__file__).parent.parent / "temp_extracted"
MENU_DIR = Path(__file__).parent.parent / "src" / "assets" / "menu"
MENU_JSON_PATH = Path(__file__).parent.parent / "menu.json"

# Категории для автоматической классификации
CATEGORY_KEYWORDS = {
    'Десерты': ['десерт', 'пирог', 'торт', 'кекс', 'вафля', 'блинчик', 'сырник', 'чизкейк', 'медовик', 'синнабон', 'крафл', 'орео', 'варенье'],
    'Закуски': ['закуск', 'оливк', 'маслин', 'артишок', 'карпаччо', 'брускетт'],
    'Мясные блюда': ['мясн', 'перепелк', 'утк', 'котлет', 'шатобриан', 'брискет', 'бургер', 'бекон', 'окорок', 'омлет', 'яйц'],
    'Рыба и морепродукты': ['рыб', 'лосос', 'тунец', 'угор', 'креветк', 'гребешок', 'краб', 'икра', 'ролл', 'суши', 'голубец', 'треск', 'щук', 'темпура', 'нори'],
    'Салаты': ['салат', 'руккола', 'боул', 'коул', 'stefan'],
    'Супы': ['суп', 'бульон', 'том-ям', 'вонтон'],
    'Суши и роллы': ['ролл', 'суши', 'калифорни', 'филадельфи', 'радуга'],
    'Завтраки': ['завтрак', 'вафля', 'бриошь', 'драник', 'скрэмбл', 'птитим', 'киноа', 'овсян', 'сырник'],
    'Прочее': []
}

def detect_category(dish_name):
    """Определяет категорию блюда по названию"""
    lower_name = dish_name.lower()
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in lower_name:
                return category
    
    return 'Прочее'

def normalize_filename(file_name):
    """Нормализует имя файла (удаляет расширение)"""
    # Удаляем расширение
    name = re.sub(r'\.(jpg|jpeg|png|JPG|JPEG|PNG)$', '', file_name, flags=re.IGNORECASE)
    return name.strip()

def get_raw_filename_bytes(zip_path, member_name):
    """Получает сырые байты имени файла из ZIP архива"""
    import struct
    with open(zip_path, 'rb') as f:
        data = f.read()
    
    pos = 0
    while True:
        pos = data.find(b'PK\x01\x02', pos)
        if pos == -1:
            break
        
        try:
            name_len = struct.unpack('<H', data[pos + 28:pos + 30])[0]
            filename_start = pos + 46
            filename_bytes = data[filename_start:filename_start + name_len]
            
            # Проверяем, соответствует ли это нашему файлу
            # Сравниваем с оригинальным именем
            test_decoded = filename_bytes.decode('cp437', errors='ignore')
            if member_name in test_decoded or test_decoded[:30] in member_name[:50]:
                return filename_bytes
        except:
            pass
        
        pos += 1
        if pos >= len(data) - 100:
            break
    
    return None

def fix_filename_encoding(filename, zip_path=None):
    """Исправляет кодировку имени файла из ZIP архива"""
    # Если передан путь к ZIP, пытаемся получить сырые байты
    if zip_path:
        raw_bytes = get_raw_filename_bytes(zip_path, filename)
        if raw_bytes:
            # Пробуем декодировать через cp866 (правильная кодировка для русских имен в ZIP)
            try:
                decoded = raw_bytes.decode('cp866', errors='ignore')
                return decoded
            except:
                pass
    
    # Fallback: пробуем исправить уже декодированное имя
    try:
        if isinstance(filename, str):
            # Пытаемся представить как байты и передекодировать
            # Если имя уже неправильно декодировано, это сложнее исправить
            pass
    except Exception as e:
        pass
    
    return filename

def extract_zip_with_encoding(zip_path, extract_dir):
    """Извлекает zip-архив с правильной обработкой кодировки имен файлов"""
    import struct
    
    if extract_dir.exists():
        shutil.rmtree(extract_dir)
    extract_dir.mkdir(parents=True, exist_ok=True)
    
    images_info = []
    
    # Сначала читаем ZIP файл как бинарный, чтобы получить правильные имена
    filename_map = {}  # маппинг неправильного имени -> правильного
    
    with open(zip_path, 'rb') as f:
        data = f.read()
    
    pos = 0
    while True:
        pos = data.find(b'PK\x01\x02', pos)
        if pos == -1:
            break
        
        try:
            name_len = struct.unpack('<H', data[pos + 28:pos + 30])[0]
            filename_start = pos + 46
            filename_bytes = data[filename_start:filename_start + name_len]
            
            # Декодируем через cp866 (правильная кодировка)
            correct_name = filename_bytes.decode('cp866', errors='ignore')
            # Также получаем имя, как его видит zipfile (через cp437)
            incorrect_name = filename_bytes.decode('cp437', errors='ignore')
            
            if correct_name != incorrect_name:
                filename_map[incorrect_name] = correct_name
        except:
            pass
        
        pos += 1
        if pos >= len(data) - 100:
            break
    
    # Теперь извлекаем файлы
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        for member in zip_ref.namelist():
            if member.endswith('/'):
                continue
            
            # Получаем правильное имя
            fixed_name = filename_map.get(member, member)
            
            # Извлекаем файл
            try:
                # Извлекаем с оригинальным именем (member)
                zip_ref.extract(member, extract_dir)
                
                # Получаем путь без директории "sapiens photo/"
                if 'sapiens photo/' in fixed_name:
                    relative_path = fixed_name.replace('sapiens photo/', '')
                else:
                    relative_path = os.path.basename(fixed_name)
                
                old_path = extract_dir / member
                new_path = extract_dir / relative_path
                
                # Создаем директорию для нового пути, если нужно
                new_path.parent.mkdir(parents=True, exist_ok=True)
                
                if old_path.exists():
                    # Удаляем файл, если он уже существует
                    if new_path.exists() and old_path != new_path:
                        new_path.unlink()
                    # Переименовываем файл
                    if old_path != new_path:
                        old_path.rename(new_path)
                        print(f"✓ {relative_path[:60]}...")
                    
                    # Сохраняем информацию об изображении
                    if any(relative_path.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png']):
                        images_info.append((new_path, relative_path))
            except Exception as e:
                print(f"✗ Ошибка при извлечении {member}: {e}")
    
    return images_info

def find_images(directory):
    """Рекурсивно находит все изображения в директории"""
    image_extensions = ['.jpg', '.jpeg', '.png']
    images = []
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if any(file.lower().endswith(ext) for ext in image_extensions):
                images.append(Path(root) / file)
    
    return images

def create_safe_filename(name, extension):
    """Создает безопасное имя файла"""
    # Заменяем небезопасные символы на подчеркивания
    safe_name = re.sub(r'[^\w\s-]', '_', name)
    safe_name = re.sub(r'[-\s]+', '_', safe_name)
    return f"{safe_name}{extension}"

def main():
    print('Начинаю парсинг меню из zip-архива...')
    
    # Извлекаем zip-архив
    print('Извлекаю файлы из zip-архива...')
    extracted_images = extract_zip_with_encoding(ZIP_FILE, EXTRACT_DIR)
    
    # Если функция вернула список изображений, используем его
    if extracted_images:
        images = extracted_images
        print(f'Найдено {len(images)} изображений')
    else:
        # Иначе ищем все изображения рекурсивно
        print('Ищу изображения...')
        images = find_images(EXTRACT_DIR)
        print(f'Найдено {len(images)} изображений')
    
    # Читаем существующий menu.json
    existing_menu = {
        'menu': {'categories': []},
        'all_items': [],
        'statistics': {'total_items': 0, 'categories_count': 0}
    }
    max_id = 0
    
    if MENU_JSON_PATH.exists():
        try:
            with open(MENU_JSON_PATH, 'r', encoding='utf-8') as f:
                existing_menu = json.load(f)
            # Находим максимальный ID
            if existing_menu.get('all_items'):
                max_id = max([item.get('id', 0) for item in existing_menu['all_items']], default=0)
        except Exception as e:
            print(f'Не удалось прочитать существующий menu.json: {e}, создаю новый')
    
    # Создаем карту существующих блюд
    existing_dishes = {}
    if existing_menu.get('all_items'):
        for item in existing_menu['all_items']:
            existing_dishes[item.get('name', '').lower()] = item
    
    # Убеждаемся, что директория menu существует
    MENU_DIR.mkdir(parents=True, exist_ok=True)
    
    # Обрабатываем каждое изображение
    new_dishes = []
    category_map = {}
    
    for item in images:
        # images теперь содержит кортежи (путь, правильное имя)
        if isinstance(item, tuple):
            image_path, correct_filename = item
            file_name = correct_filename
        else:
            image_path = item
            file_name = image_path.name
        
        dish_name = normalize_filename(file_name)
        
        # Пропускаем, если имя пустое или слишком короткое
        if not dish_name or len(dish_name) < 3:
            print(f'Пропускаю файл с неподходящим именем: {file_name}')
            continue
        
        # Проверяем, не существует ли уже такое блюдо
        if dish_name.lower() in existing_dishes:
            print(f'Блюдо "{dish_name}" уже существует, пропускаю')
            continue
        
        # Определяем расширение
        ext = image_path.suffix.lower()
        image_format = ext[1:]  # убираем точку
        
        # Создаем безопасное имя файла
        safe_file_name = create_safe_filename(dish_name, ext)
        target_image_path = MENU_DIR / safe_file_name
        
        # Копируем изображение
        shutil.copy2(image_path, target_image_path)
        print(f'Скопировано: {file_name} -> {safe_file_name}')
        
        # Определяем категорию
        category = detect_category(dish_name)
        
        # Создаем объект блюда
        max_id += 1
        dish = {
            'id': max_id,
            'name': dish_name,
            'category': category,
            'image': f'images/{safe_file_name}',
            'image_format': image_format,
            'description': None,
            'composition': None,
            'allergens': None
        }
        
        new_dishes.append(dish)
        
        # Добавляем в карту категорий
        if category not in category_map:
            category_map[category] = []
        category_map[category].append(dish)
    
    print(f'\nОбработано {len(new_dishes)} новых блюд')
    print(f'Категории: {", ".join(category_map.keys())}')
    
    # Объединяем существующие и новые блюда
    all_dishes = (existing_menu.get('all_items') or []) + new_dishes
    
    # Группируем по категориям
    categories_map = {}
    
    # Сначала добавляем существующие категории
    if existing_menu.get('menu') and existing_menu['menu'].get('categories'):
        for cat in existing_menu['menu']['categories']:
            categories_map[cat['name']] = cat.get('items', [])
    
    # Добавляем новые блюда к категориям
    for dish in new_dishes:
        if dish['category'] not in categories_map:
            categories_map[dish['category']] = []
        categories_map[dish['category']].append(dish)
    
    # Формируем структуру меню
    menu_structure = {
        'menu': {
            'categories': [
                {
                    'name': category_name,
                    'items': items,
                    'count': len(items)
                }
                for category_name, items in categories_map.items()
            ]
        },
        'all_items': all_dishes,
        'statistics': {
            'total_items': len(all_dishes),
            'categories_count': len(categories_map)
        }
    }
    
    # Сохраняем menu.json
    with open(MENU_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(menu_structure, f, ensure_ascii=False, indent=2)
    
    print(f'\nmenu.json обновлен: {len(all_dishes)} блюд в {len(categories_map)} категориях')
    
    # Очищаем временную директорию
    if EXTRACT_DIR.exists():
        shutil.rmtree(EXTRACT_DIR)
    
    print('\nГотово!')

if __name__ == '__main__':
    main()

