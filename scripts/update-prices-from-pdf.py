#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для извлечения цен из PDF меню и обновления menu.json
"""

import json
import re
import sys
from pathlib import Path

def normalize_name(name):
    """Нормализует имя блюда для сравнения"""
    # Убираем лишние пробелы, приводим к нижнему регистру
    name = re.sub(r'\s+', ' ', name.strip().lower())
    # Убираем специальные символы и пунктуацию для лучшего сопоставления
    name = re.sub(r'[^\w\s]', '', name)
    # Заменяем ё на е для лучшего сопоставления
    name = name.replace('ё', 'е')
    return name

def extract_prices_from_pdf_content():
    """Извлекает цены из содержимого PDF (данные из веб-поиска)"""
    
    # Данные из PDF (из веб-поиска)
    pdf_content = """
Устрицы ..... 590
Морской ёж ..... 420
Паштет из утки с угрём, орехом макадамия ..... 980
Бородинские эклеры с кремом из печени трески, ..... 1290
Оливки с артишоками и вялеными томатами / 210 г ..... 1120
Запечённый камамбер с чатни из сезонных фруктов / 240 г ..... 1290
Карпаччо из кабачков с тартаром из томатов и артишоков / 120 г ..... 960
Запечённый баклажан с кремом из овечьего сыра ..... 980
Зелёный салат с авокадо, кабачком, яблоком ..... 960
Буррата с тыквой и соусом из бальзамического уксуса / 200 г ..... 1260
Свёкла с вяленой уткой, козьим сыром, мёдом ..... 1190
Салат романо с соусом Цезарь / 170 г ..... 820
Креветки на гриле / 60 г ..... 580
Пастрами из индейки / 60 г ..... 1180
Stefan salad / 250 г / 500 г ..... 1100 / 2200
Рукола с креветками и авокадо / 240 г ..... 1890
Вителло тоннато / 150 г ..... 1290
Обожженный лосось с авокадо, томатным шисо ..... 1890
Маринованные креветки с грейпфрутом / 150 г ..... 1490
Карпаччо из стриплойна с пармезаном и трюфелем / 130 г ..... 2090
Тартар из говядины с чесночным айоли / 190 г ..... 1290
Том ям с креветками и шиитаке / 370 г ..... 1390
Бульон со шпинатом и вонтонами из цыплёнка / 400 г ..... 790
Борщ от шефа с говяжьим ребром / 450 г ..... 1090
Крем-суп из тыквы с креветками / 350 г ..... 1290
Вишисуаз с бастурмой / 290 г ..... 1290
Лимонно-шафрановое ризотто с гребешком / 230 г ..... 2190
Равиоли с судаком, кинзой и соусом том ям / 230 г ..... 1290
Равиоли с уткой, шиитаке и фермерской сметаной / 290 г ..... 1290
Качо э пепе с кампотским перцем / 320 г ..... 1490
Казаречне с креветками, брокколи и бобами эдамаме / 350 г ..... 1990
Рёбрышки ягнёнка / 100 г ..... 1590
Шатобриан Black Angus / 100 г ..... 2200
Рибай / 100 г ..... 2090
Шаурма SAPIENS / 320 г ..... 1490
Фрикадельки с клюквенным соусом и картофельным пюре / 370 г ..... 1190
Кебаб из мраморной говядины с хумусом, соусом сацебели ..... 1390
Мозговая кость с мисо, яблоком и запечённой бриошью / 600 г ..... 1290
Телячий язык с картофельным кремом, хреном ..... 1690
Пожарская котлета с картофельным крокетом и трюфелем / 320 г ..... 1490
Запечённая треска с томатами, оливками и артишоками / 330 г ..... 2290
Спинка лосося с брокколи и бобами эдамаме / 210 г ..... 2390
Голубец с креветкой и соусом из красной икры / 200 г ..... 1690
Судак с чёрным рисом, кабачками и соусом из креветок / 270 г ..... 1690
Кейк из щуки с тайским соусом, шпинатом и кремом ..... 1490
Осьминог на гриле с хумусом и ароматным маслом / 200 г ..... 2990
Полба с кебабом из креветок / 220 г ..... 1390
Перловая каша с уткой, грибами и чёрной смородиной / 200 г ..... 1290
Перепёлка со шпинатом и картофельным пюре / 290 г ..... 1920
Ошидзуси с тунцом / 8/12 шт, 180/250 г 1890 / 2190
Ошидзуси с угрём / 8/12 шт, 180/250 г 1890 / 2190
Ошидзуси с лососем / 8/12 шт, 180/250 г 1890 / 2190
Калифорния с крабом / 200 г 1720
Филадельфия с лососем / 230 г 1820
Радуга / 280 г 2190
Креветка, гребешок, лосось / 310 г 2390
Краб, авокадо и клубника / 240 г 1890
Тунец, лосось, гребешок, креветка и красная икра / 220 г 2390
Угорь, манго, батат / 200 г 1590
Дайкон, авокадо, шиитаке, васаби кизами / 180 г 1390
Лосось, гребешок, манго, авокадо, тобико / 230 г 1890
Лосось, тунец, угорь / 250 г 1890
Угорь, лосось, тофу / 280 г 1990
Деконструированный медовик с медовыми сотами ..... 920
Тыквенный тирамису / 160 г ..... 1090
Крем-брюле с розмарином и мандаринами / 190 г ..... 920
Тарт татен с грушей / 160 г ..... 1190
Павлова с клубникой и юдзу / 150 г ..... 1090
Чизкейк Сан-Себастьян с малиновым соусом и сорбетом / 170 г ..... 1190
Яблочный пирог с миндалём, орехом пекан и кремом ..... 920
Вагаси моти / 1 шт / 75 г ..... 420
Мороженое / 50 г ..... 300
Сорбет / 50 г ..... 300
"""
    
    prices_map = {}
    
    lines = pdf_content.strip().split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Ищем паттерн: название ... цена или название / ... цена
        # Убираем вес и другие данные в скобках
        match = re.match(r'^(.+?)\s*(?:/.*?)?\s*\.\.\.\s*(\d+)', line)
        if not match:
            # Пробуем другой паттерн без точек
            match = re.match(r'^(.+?)\s*(?:/.*?)?\s+(\d+)\s*(?:/\s*\d+)?$', line)
        
        if match:
            name_raw = match.group(1).strip()
            price = int(match.group(2))
            
            # Очищаем название от веса и других дополнений
            name = re.sub(r'\s*/\s*\d+.*$', '', name_raw)  # Убираем вес
            name = re.sub(r'\s*\.\.\.\s*$', '', name)  # Убираем точки в конце
            
            # Если есть диапазон цен, берем первую
            if ' / ' in str(price):
                price = int(str(price).split(' / ')[0])
            
            normalized_name = normalize_name(name)
            
            # Если уже есть запись, не перезаписываем (берем первую)
            if normalized_name not in prices_map:
                prices_map[normalized_name] = {
                    'name': name,
                    'price': price
                }
    
    return prices_map

def update_menu_json(menu_json_path, prices_data):
    """Обновляет menu.json ценами из PDF"""
    with open(menu_json_path, 'r', encoding='utf-8') as f:
        menu_data = json.load(f)
    
    updated_count = 0
    
    # Обновляем все элементы в all_items
    if 'all_items' in menu_data:
        for item in menu_data['all_items']:
            item_name_normalized = normalize_name(item['name'])
            
            # Пробуем точное совпадение
            if item_name_normalized in prices_data:
                price_info = prices_data[item_name_normalized]
                if not item.get('price'):
                    item['price'] = price_info['price']
                    updated_count += 1
                continue
            
            # Пробуем частичное совпадение (если название содержит ключевые слова)
            best_match = None
            best_score = 0
            
            # Специальные случаи для лучшего сопоставления
            item_name_clean = item['name'].lower()
            
            for price_name_norm, price_info in prices_data.items():
                price_name_clean = price_info['name'].lower()
                
                # Проверяем точное вхождение ключевых слов
                item_words = set(item_name_normalized.split())
                price_words = set(price_name_norm.split())
                
                # Если название начинается одинаково - высокий приоритет
                if item_name_clean.startswith(price_name_clean[:15]) or price_name_clean.startswith(item_name_clean[:15]):
                    if not item.get('price'):
                        item['price'] = price_info['price']
                        updated_count += 1
                        continue
                
                # Ищем совпадение ключевых слов
                common_words = item_words & price_words
                # Снижаем требование до 2 слов для лучшего сопоставления
                if len(common_words) >= 2 and len(common_words) > best_score:
                    best_score = len(common_words)
                    best_match = price_info
            
            if best_match and not item.get('price'):
                item['price'] = best_match['price']
                updated_count += 1
    
    # Обновляем элементы в категориях
    if 'menu' in menu_data and 'categories' in menu_data['menu']:
        for category in menu_data['menu']['categories']:
            for item in category.get('items', []):
                item_name_normalized = normalize_name(item['name'])
                
                if item_name_normalized in prices_data:
                    price_info = prices_data[item_name_normalized]
                    if not item.get('price'):
                        item['price'] = price_info['price']
                else:
                    # Частичное совпадение
                    best_match = None
                    best_score = 0
                    
                    for price_name_norm, price_info in prices_data.items():
                        item_words = set(item_name_normalized.split())
                        price_words = set(price_name_norm.split())
                        
                        common_words = item_words & price_words
                        if len(common_words) >= 3 and len(common_words) > best_score:
                            best_score = len(common_words)
                            best_match = price_info
                    
                    if best_match and not item.get('price'):
                        item['price'] = best_match['price']
    
    # Сохраняем обновленный menu.json
    with open(menu_json_path, 'w', encoding='utf-8') as f:
        json.dump(menu_data, f, ensure_ascii=False, indent=2)
    
    print(f"Обновлено {updated_count} блюд с ценами")
    return updated_count

def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    menu_json = project_root / 'menu.json'
    
    if not menu_json.exists():
        print(f"Ошибка: файл {menu_json} не найден")
        sys.exit(1)
    
    print("Извлечение цен из PDF...")
    prices = extract_prices_from_pdf_content()
    print(f"Найдено {len(prices)} цен в PDF")
    
    # Показываем несколько примеров
    print("\nПримеры цен:")
    for i, (name, info) in enumerate(list(prices.items())[:5]):
        print(f"  - {info['name']}: {info['price']} ₽")
    
    print("\nОбновление menu.json...")
    updated = update_menu_json(menu_json, prices)
    
    print(f"Готово! Обновлено {updated} блюд с ценами")

if __name__ == '__main__':
    main()

