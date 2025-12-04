#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для извлечения описаний блюд из HTML файла в архиве
и обновления menu.json
"""

import json
import re
import html
import zipfile
import sys
from pathlib import Path

def normalize_name(name):
    """Нормализует имя блюда для сравнения"""
    name = re.sub(r'\s+', ' ', name.strip().lower())
    name = re.sub(r'[^\w\s]', '', name)
    return name

def extract_dish_info_from_html(html_content):
    """Извлекает информацию о блюдах из HTML"""
    # Декодируем HTML-entities
    decoded = html.unescape(html_content)
    
    dishes = {}
    
    # Находим все заголовки h4 (названия блюд)
    h4_pattern = r'<h4[^>]*id="[^"]*"[^>]*><span[^>]*>(.*?)</span></h4>'
    h4_matches = list(re.finditer(h4_pattern, decoded, re.DOTALL))
    
    print(f"Найдено заголовков блюд: {len(h4_matches)}")
    
    # Извлекаем информацию о каждом блюде
    for i, match in enumerate(h4_matches):
        start = match.end()
        # Определяем конец блока (следующий h4 или ограничение)
        if i + 1 < len(h4_matches):
            end = h4_matches[i+1].start()
        else:
            end = min(start + 10000, len(decoded))
        
        block = decoded[start:end]
        
        # Очищаем название от HTML тегов
        name_raw = match.group(1)
        name = re.sub(r'<[^>]+>', '', name_raw).strip()
        name = re.sub(r'\s+', ' ', name)
        
        # Пропускаем, если это не название блюда (ссылки, разделители и т.д.)
        if not name or len(name) < 5 or name.startswith('http') or '#' in name:
            continue
        
        normalized_name = normalize_name(name)
        
        # Извлекаем параграфы с описанием
        p_matches = re.findall(r'<p[^>]*><span[^>]*>(.*?)</span></p>', block, re.DOTALL)
        
        description_parts = []
        composition_parts = []
        allergens_parts = []
        
        current_section = None
        
        for p in p_matches:
            text = re.sub(r'<[^>]+>', '', p).strip()
            text = re.sub(r'\s+', ' ', text)
            
            if not text or len(text) < 5:
                continue
            
            text_lower = text.lower()
            
            # Определяем тип информации
            if 'тайминг' in text_lower or 'подача:' in text_lower or 'приборы:' in text_lower:
                continue
            elif text_lower.startswith('описание') or text_lower.startswith('описание:'):
                current_section = 'description'
                desc_text = text.split(':', 1)[-1].strip() if ':' in text else ''
                if desc_text:
                    description_parts.append(desc_text)
            elif text_lower.startswith('состав') or text_lower.startswith('состав:'):
                current_section = 'composition'
                comp_text = text.split(':', 1)[-1].strip() if ':' in text else ''
                if comp_text:
                    composition_parts.append(comp_text)
            elif text_lower.startswith('аллергены') or text_lower.startswith('аллерген'):
                current_section = 'allergens'
                all_text = text.split(':', 1)[-1].strip() if ':' in text else ''
                if all_text:
                    allergens_parts.append(all_text)
            elif current_section == 'description' and not text_lower.startswith('состав'):
                description_parts.append(text)
            elif current_section == 'composition' or '*' in text or ('начинка' in text_lower or 'тесто' in text_lower):
                composition_parts.append(text)
            elif current_section == 'allergens' or 'аллерген' in text_lower:
                allergens_parts.append(text)
            elif len(text) > 50 and not any(x in text_lower for x in ['тайминг', 'подача', 'приборы']):
                # Если не определено, но текст длинный, считаем описанием
                if not description_parts:
                    description_parts.append(text)
        
        # Объединяем части
        description = ' '.join(description_parts).strip() if description_parts else None
        composition = '\n'.join(composition_parts).strip() if composition_parts else None
        allergens = ' '.join(allergens_parts).strip() if allergens_parts else None
        
        if description or composition or allergens:
            dishes[normalized_name] = {
                'name': name,
                'description': description,
                'composition': composition,
                'allergens': allergens
            }
    
    return dishes

def update_menu_json(menu_json_path, dishes_data):
    """Обновляет menu.json данными из HTML"""
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
                
                # Обновляем только если данных еще нет или они пустые
                if dish_info.get('description') and not item.get('description'):
                    item['description'] = dish_info['description']
                    updated_count += 1
                
                if dish_info.get('composition') and not item.get('composition'):
                    item['composition'] = dish_info['composition']
                
                if dish_info.get('allergens') and not item.get('allergens'):
                    item['allergens'] = dish_info['allergens']
    
    # Обновляем элементы в категориях
    if 'menu' in menu_data and 'categories' in menu_data['menu']:
        for category in menu_data['menu']['categories']:
            for item in category.get('items', []):
                item_name_normalized = normalize_name(item['name'])
                
                if item_name_normalized in dishes_data:
                    dish_info = dishes_data[item_name_normalized]
                    
                    if dish_info.get('description') and not item.get('description'):
                        item['description'] = dish_info['description']
                    
                    if dish_info.get('composition') and not item.get('composition'):
                        item['composition'] = dish_info['composition']
                    
                    if dish_info.get('allergens') and not item.get('allergens'):
                        item['allergens'] = dish_info['allergens']
    
    # Сохраняем обновленный menu.json
    with open(menu_json_path, 'w', encoding='utf-8') as f:
        json.dump(menu_data, f, ensure_ascii=False, indent=2)
    
    print(f"Обновлено {updated_count} блюд с описаниями")
    return updated_count

def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    zip_file = project_root / 'Копия Sapiens Kitchen.zip'
    menu_json = project_root / 'menu.json'
    
    if not zip_file.exists():
        print(f"Ошибка: файл {zip_file} не найден")
        sys.exit(1)
    
    if not menu_json.exists():
        print(f"Ошибка: файл {menu_json} не найден")
        sys.exit(1)
    
    print("Извлечение HTML из архива...")
    with zipfile.ZipFile(zip_file, 'r') as zip_ref:
        html_content = zip_ref.read("SapiensKitchen.html").decode('utf-8')
    
    print("Парсинг HTML файла...")
    dishes = extract_dish_info_from_html(html_content)
    print(f"Найдено {len(dishes)} блюд с описаниями в HTML")
    
    print("Обновление menu.json...")
    updated = update_menu_json(menu_json, dishes)
    
    print(f"Готово! Обновлено {updated} блюд")

if __name__ == '__main__':
    main()

