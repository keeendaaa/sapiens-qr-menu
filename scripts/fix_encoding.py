#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Утилита для исправления кодировки имен файлов в ZIP архиве
"""

import zipfile
import struct

def get_raw_filename_from_zip(zip_path, member_name):
    """Получает сырые байты имени файла из ZIP архива"""
    with open(zip_path, 'rb') as f:
        data = f.read()
    
    # Ищем центральный заголовок
    pos = 0
    while True:
        pos = data.find(b'PK\x01\x02', pos)
        if pos == -1:
            break
        
        # Читаем длину имени файла (offset 28)
        name_len = struct.unpack('<H', data[pos + 28:pos + 30])[0]
        extra_len = struct.unpack('<H', data[pos + 30:pos + 32])[0]
        comment_len = struct.unpack('<H', data[pos + 32:pos + 34])[0]
        
        # Читаем имя файла (offset 46)
        filename_start = pos + 46
        filename_bytes = data[filename_start:filename_start + name_len]
        
        # Пробуем декодировать разными способами
        decoded_name = None
        for encoding in ['cp866', 'cp1251', 'utf-8']:
            try:
                test_name = filename_bytes.decode(encoding, errors='ignore')
                # Проверяем, соответствует ли декодированное имя
                if member_name.replace('/', '\\').encode('utf-8', errors='ignore')[:20] in filename_bytes[:30] or \
                   any(c.isalpha() and ord(c) > 127 for c in test_name[:10]):
                    decoded_name = test_name.replace('\\', '/')
                    break
            except:
                pass
        
        # Проверяем, соответствует ли это нашему файлу
        current_decoded = filename_bytes.decode('cp437', errors='ignore').replace('\\', '/')
        if member_name in current_decoded or current_decoded in member_name:
            return filename_bytes, current_decoded
        
        pos += 1
        if pos >= len(data) - 100:
            break
    
    return None, None

# Тестируем на реальном файле
if __name__ == '__main__':
    zip_path = 'sapiens photo.zip'
    z = zipfile.ZipFile(zip_path, 'r')
    
    # Берем файл с русским именем
    for info in z.infolist():
        if 'Stefan' not in info.filename and not info.filename.endswith('/'):
            print(f"Тестируем: {info.filename[:50]}")
            raw_bytes, decoded = get_raw_filename_from_zip(zip_path, info.filename)
            if raw_bytes:
                print(f"Сырые байты: {raw_bytes[:50]}")
                print(f"Декодировано: {decoded[:80]}")
                
                # Пробуем разные кодировки
                for enc in ['cp866', 'cp1251', 'koi8-r']:
                    try:
                        test = raw_bytes.decode(enc, errors='ignore')
                        if any('\u0400' <= c <= '\u04FF' for c in test[:30]):
                            print(f"  {enc}: {test[:80]}")
                    except:
                        pass
                break

