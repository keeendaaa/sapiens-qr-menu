#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import shutil
from pathlib import Path
import sys

# Читаем menu.json
with open('menu.json', 'r', encoding='utf-8') as f:
    menu = json.load(f)

# Собираем все файлы и маппинг
image_mapping = {}
all_files = set()

for section in menu['sections']:
    for item in section['items']:
        if item.get('photos') and len(item['photos']) > 0:
            photo_path = item['photos'][0]
            file_name = Path(photo_path).name
            all_files.add(file_name)
            dish_name = item['name']
            if dish_name not in image_mapping:
                image_mapping[dish_name] = file_name

# Копируем все файлы
source_dir = Path('/Users/kenda/menu/images')
target_dir = Path('public/menu')
target_dir.mkdir(parents=True, exist_ok=True)

copied = 0
for file_name in all_files:
    source_file = source_dir / file_name
    target_file = target_dir / file_name
    
    if source_file.exists():
        shutil.copy2(source_file, target_file)
        copied += 1

# Проверяем реальные файлы
existing_files = {f.name for f in target_dir.glob('image*.*')}
file_ext_map = {f.stem: f.suffix for f in target_dir.glob('image*.*')}

# Обновляем imageMap.ts
content = """// Image map для всех блюд меню
// Локальные изображения из menu.json

const baseUrl = import.meta.env.BASE_URL || '/vangogi/';

const imageMapData: Record<string, string> = {
"""

for dish_name, file_name in sorted(image_mapping.items()):
    # Исправляем расширение на основе реального файла
    base_name = Path(file_name).stem
    if base_name in file_ext_map:
        actual_ext = file_ext_map[base_name]
        file_name = f"{base_name}{actual_ext}"
    
    escaped_name = dish_name.replace("'", "\\'")
    content += f"  '{escaped_name}': `${{baseUrl}}menu/{file_name}`,\n"

content += """};

export const imageMap: Record<string, string> = imageMapData;

// Функция для получения URL изображения по названию блюда
export function getImageUrl(itemName: string): string {
  return imageMap[itemName] || '';
}
"""

with open('src/components/imageMap.ts', 'w', encoding='utf-8') as f:
    f.write(content)

# Выводим результат
print(f"Скопировано: {copied} файлов")
print(f"Файлов в public/menu: {len(existing_files)}")
print(f"imageMap.ts обновлен с {len(image_mapping)} блюдами")

missing = all_files - existing_files
if missing:
    print(f"Отсутствуют: {len(missing)} файлов")
    sys.exit(1)
else:
    print("Все файлы успешно скопированы!")

