#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для обновления menu.json данными из txt файла
Парсит описание, состав и аллергены для каждого блюда
"""

import json
import re
import sys
from pathlib import Path

def normalize_name(name):
    """Нормализует имя блюда для сравнения"""
    # Убираем лишние пробелы, приводим к нижнему регистру
    name = re.sub(r'\s+', ' ', name.strip().lower())
    # Убираем специальные символы
    name = re.sub(r'[^\w\s]', '', name)
    return name

def parse_txt_file(txt_path):
    """Парсит txt файл и извлекает информацию о блюдах"""
    with open(txt_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    dishes = {}
    lines = content.split('\n')
    
    current_dish = None
    current_section = None
    current_category = None
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Пропускаем пустые строки
        if not line:
            i += 1
            continue
        
        # Определяем категорию (строка начинающаяся с большой буквы без двоеточия)
        if re.match(r'^[А-ЯЁ][а-яё\s]+$', line) and ':' not in line:
            current_category = line.strip()
            current_dish = None
            i += 1
            continue
        
        # Определяем название блюда (строка после категории, но не "Описание:", "Состав:" и т.д.)
        if (current_category and 
            not line.startswith('Описание') and 
            not line.startswith('Состав') and
            not line.startswith('Аллергены') and
            not line.startswith('Конфликт') and
            not line.startswith('Тайминг') and
            not line.startswith('Приборы') and
            not line.startswith('Технические') and
            not line.startswith('Пищевая') and
            not line.startswith('*') and
            not line.startswith('________________') and
            not re.match(r'^[А-ЯЁ][а-яё\s]+$', line) and
            len(line) > 5):
            
            dish_name = line.strip()
            normalized_name = normalize_name(dish_name)
            
            # Создаем новое блюдо
            current_dish = {
                'name': dish_name,
                'normalized_name': normalized_name,
                'category': current_category,
                'description': None,
                'composition': None,
                'allergens': None
            }
            dishes[normalized_name] = current_dish
            current_section = None
            i += 1
            continue
        
        # Если у нас есть текущее блюдо, парсим его данные
        if current_dish:
            # Описание
            if line.startswith('Описание') or line.startswith('Описание блюда'):
                # Может быть "Описание: текст" или "Описание блюда" на следующей строке
                if ':' in line:
                    desc_text = line.split(':', 1)[1].strip()
                    if desc_text:
                        current_dish['description'] = desc_text
                    current_section = 'description'
                else:
                    current_section = 'description'
                i += 1
                # Читаем следующую строку, если текущая была заголовком
                if current_section == 'description' and not current_dish['description']:
                    if i < len(lines):
                        next_line = lines[i].strip()
                        if next_line and not next_line.startswith('*') and not next_line.startswith('Состав'):
                            current_dish['description'] = next_line
                            i += 1
                continue
            
            # Состав
            if line.startswith('Состав') or line.startswith('Состав:'):
                current_section = 'composition'
                composition_lines = []
                i += 1
                # Читаем строки состава до следующего раздела
                while i < len(lines):
                    next_line = lines[i].strip()
                    if (not next_line or 
                        next_line.startswith('Описание') or 
                        next_line.startswith('Аллергены') or
                        next_line.startswith('Конфликт') or
                        next_line.startswith('Тайминг') or
                        next_line.startswith('Технические') or
                        next_line.startswith('________________') or
                        (not next_line.startswith('*') and not next_line.startswith('Основ') and len(next_line) > 50)):
                        break
                    if next_line:
                        composition_lines.append(next_line)
                    i += 1
                if composition_lines:
                    current_dish['composition'] = '\n'.join(composition_lines)
                continue
            
            # Аллергены
            if line.startswith('Аллергены') or 'аллергены' in line.lower():
                if ':' in line:
                    allergen_text = line.split(':', 1)[1].strip()
                    if allergen_text:
                        current_dish['allergens'] = allergen_text
                current_section = 'allergens'
                allergen_lines = []
                i += 1
                # Читаем дополнительные строки с аллергенами
                while i < len(lines):
                    next_line = lines[i].strip()
                    if (not next_line or 
                        next_line.startswith('Описание') or
                        next_line.startswith('Состав') or
                        next_line.startswith('Конфликт') or
                        next_line.startswith('Тайминг') or
                        next_line.startswith('Технические') or
                        next_line.startswith('________________')):
                        break
                    if next_line and (next_line.startswith('*') or 'аллерген' in next_line.lower()):
                        allergen_lines.append(next_line.replace('*', '').strip())
                    elif next_line and len(next_line) < 100:
                        allergen_lines.append(next_line)
                    i += 1
                if allergen_lines and not current_dish['allergens']:
                    current_dish['allergens'] = ' '.join(allergen_lines)
                continue
            
            # Продолжаем читать описание, если мы в секции описания
            if current_section == 'description' and not line.startswith('*'):
                if not current_dish['description']:
                    current_dish['description'] = line
                elif not line.startswith('Состав') and not line.startswith('Аллергены'):
                    # Добавляем к описанию, если это продолжение
                    if len(line) > 20:
                        current_dish['description'] += ' ' + line
        
        i += 1
    
    return dishes

def update_menu_json(menu_json_path, dishes_data):
    """Обновляет menu.json данными из txt файла"""
    with open(menu_json_path, 'r', encoding='utf-8') as f:
        menu_data = json.load(f)
    
    updated_count = 0
    
    # Обновляем все элементы в all_items
    if 'all_items' in menu_data:
        for item in menu_data['all_items']:
            item_name_normalized = normalize_name(item['name'])
            
            # Ищем совпадение в распарсенных данных
            if item_name_normalized in dishes_data:
                dish_info = dishes_data[item_name_normalized]
                if dish_info.get('description'):
                    item['description'] = dish_info['description']
                    updated_count += 1
                if dish_info.get('composition'):
                    item['composition'] = dish_info['composition']
                if dish_info.get('allergens'):
                    item['allergens'] = dish_info['allergens']
    
    # Обновляем элементы в категориях
    if 'menu' in menu_data and 'categories' in menu_data['menu']:
        for category in menu_data['menu']['categories']:
            for item in category.get('items', []):
                item_name_normalized = normalize_name(item['name'])
                
                if item_name_normalized in dishes_data:
                    dish_info = dishes_data[item_name_normalized]
                    if dish_info.get('description'):
                        item['description'] = dish_info['description']
                    if dish_info.get('composition'):
                        item['composition'] = dish_info['composition']
                    if dish_info.get('allergens'):
                        item['allergens'] = dish_info['allergens']
    
    # Сохраняем обновленный menu.json
    with open(menu_json_path, 'w', encoding='utf-8') as f:
        json.dump(menu_data, f, ensure_ascii=False, indent=2)
    
    print(f"Обновлено {updated_count} блюд")
    return updated_count

def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    txt_file = project_root / 'Копия Sapiens Kitchen.txt'
    menu_json = project_root / 'menu.json'
    
    if not txt_file.exists():
        print(f"Ошибка: файл {txt_file} не найден")
        sys.exit(1)
    
    if not menu_json.exists():
        print(f"Ошибка: файл {menu_json} не найден")
        sys.exit(1)
    
    print("Парсинг txt файла...")
    dishes = parse_txt_file(txt_file)
    print(f"Найдено {len(dishes)} блюд в txt файле")
    
    print("Обновление menu.json...")
    updated = update_menu_json(menu_json, dishes)
    
    print(f"Готово! Обновлено {updated} блюд")

if __name__ == '__main__':
    main()

