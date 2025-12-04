#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Скрипт для полной перегенерации menu.json из zip-архива с фотографиями блюд.
Этот скрипт очищает существующие данные и создает новый menu.json с нуля.
"""

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
    'Десерты': ['десерт', 'пирог', 'торт', 'кекс', 'вафля', 'блинчик', 'сырник', 'чизкейк', 'медовик', 'синнабон', 'крафл', 'орео', 'варенье', 'эклер'],
    'Закуски': ['закуск', 'оливк', 'маслин', 'артишок', 'карпаччо', 'брускетт'],
    'Мясные блюда': ['мясн', 'перепелк', 'утк', 'котлет', 'шатобриан', 'брискет', 'бургер', 'бекон', 'окорок', 'омлет', 'яйц', 'ребр'],
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
    if zip_path:
        raw_bytes = get_raw_filename_bytes(zip_path, filename)
        if raw_bytes:
            try:
                # Правильная кодировка для русских имен в ZIP - cp866
                decoded = raw_bytes.decode('cp866', errors='ignore')
                return decoded
            except:
                pass
    return filename

def create_safe_filename(name, extension):
    """Создает безопасное имя файла"""
    safe_name = re.sub(r'[^\w\s-]', '_', name)
    safe_name = re.sub(r'[-\s]+', '_', safe_name)
    return f"{safe_name}{extension}"

def extract_and_process_images():
    """Извлекает изображения из zip и возвращает список блюд"""
    import struct
    
    if EXTRACT_DIR.exists():
        shutil.rmtree(EXTRACT_DIR)
    EXTRACT_DIR.mkdir(parents=True, exist_ok=True)
    
    dishes = []
    
    # Сначала создаем маппинг неправильных имен -> правильных
    filename_map = {}
    
    with open(ZIP_FILE, 'rb') as f:
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
    with zipfile.ZipFile(ZIP_FILE, 'r') as zip_ref:
        for member in zip_ref.namelist():
            if member.endswith('/'):
                continue
            
            # Пропускаем файлы, которые не являются изображениями
            if not any(member.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png']):
                continue
            
            # Получаем правильное имя
            fixed_name = filename_map.get(member, member)
            
            # Получаем имя файла без пути
            if 'sapiens photo/' in fixed_name:
                relative_path = fixed_name.replace('sapiens photo/', '')
            else:
                relative_path = os.path.basename(fixed_name)
            
            # Нормализуем имя (убираем расширение)
            dish_name = normalize_filename(relative_path)
            
            if not dish_name or len(dish_name) < 3:
                continue
            
            # Извлекаем файл
            try:
                zip_ref.extract(member, EXTRACT_DIR)
                old_path = EXTRACT_DIR / member
                new_path = EXTRACT_DIR / relative_path
                
                if old_path.exists():
                    new_path.parent.mkdir(parents=True, exist_ok=True)
                    if new_path.exists():
                        new_path.unlink()
                    if old_path != new_path:
                        old_path.rename(new_path)
                    
                    # Получаем расширение
                    ext = new_path.suffix.lower()
                    image_format = ext[1:]
                    
                    # Создаем безопасное имя для сохранения
                    safe_file_name = create_safe_filename(dish_name, ext)
                    target_image_path = MENU_DIR / safe_file_name
                    
                    # Копируем изображение
                    shutil.copy2(new_path, target_image_path)
                    
                    # Определяем категорию
                    category = detect_category(dish_name)
                    
                    # Создаем объект блюда
                    dish = {
                        'id': len(dishes) + 1,  # Простая нумерация с 1
                        'name': dish_name,
                        'category': category,
                        'image': f'images/{safe_file_name}',
                        'image_format': image_format,
                        'description': None,
                        'composition': None,
                        'allergens': None
                    }
                    
                    dishes.append(dish)
                    print(f"✓ {dish_name[:50]}... -> {category}")
            except Exception as e:
                print(f"✗ Ошибка при обработке {member}: {e}")
    
    # Очищаем временную директорию
    if EXTRACT_DIR.exists():
        shutil.rmtree(EXTRACT_DIR)
    
    return dishes

def build_menu_structure(dishes):
    """Строит структуру меню из списка блюд"""
    categories_map = {}
    
    # Группируем блюда по категориям
    for dish in dishes:
        category = dish['category']
        if category not in categories_map:
            categories_map[category] = []
        categories_map[category].append(dish)
    
    # Формируем структуру меню
    return {
        'menu': {
            'categories': [
                {
                    'name': category_name,
                    'items': items,
                    'count': len(items)
                }
                for category_name, items in sorted(categories_map.items())
            ]
        },
        'all_items': dishes,
        'statistics': {
            'total_items': len(dishes),
            'categories_count': len(categories_map)
        }
    }

def main():
    print('=' * 60)
    print('Полная перегенерация menu.json из zip-архива')
    print('=' * 60)
    print()
    
    # Очищаем старые изображения
    print('Очищаю старые изображения...')
    if MENU_DIR.exists():
        for file in MENU_DIR.glob('*'):
            if file.is_file():
                file.unlink()
                print(f"  Удален: {file.name}")
    else:
        MENU_DIR.mkdir(parents=True, exist_ok=True)
    
    print()
    print('Извлекаю и обрабатываю изображения из zip-архива...')
    print('-' * 60)
    
    # Извлекаем и обрабатываем изображения
    dishes = extract_and_process_images()
    
    print()
    print('-' * 60)
    print(f'Обработано {len(dishes)} блюд')
    print()
    
    # Строим структуру меню
    print('Формирую структуру menu.json...')
    menu_structure = build_menu_structure(dishes)
    
    # Сохраняем menu.json
    with open(MENU_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(menu_structure, f, ensure_ascii=False, indent=2)
    
    print(f'✓ menu.json сохранен')
    print()
    print('Статистика:')
    print(f"  Всего блюд: {menu_structure['statistics']['total_items']}")
    print(f"  Категорий: {menu_structure['statistics']['categories_count']}")
    print()
    print('Категории:')
    for cat in menu_structure['menu']['categories']:
        print(f"  • {cat['name']}: {cat['count']} блюд")
    print()
    print('=' * 60)
    print('Готово!')
    print('=' * 60)

if __name__ == '__main__':
    main()

