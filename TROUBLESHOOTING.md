# 🔧 Устранение проблем

## ❌ Ошибка 403 (Forbidden)

### Проблема
```
Failed to load resource: the server responded with a status of 403 (Forbidden)
Error creating task: AxiosError: Request failed with status code 403
```

### Причины и решения

#### 1. Backend сервер не запущен

**Проверка:** Откройте http://localhost:5000/api/tasks в браузере

**Решение:**
```bash
cd ~/Desktop/planner
npm run server
```

В отдельном терминале:
```bash
cd ~/Desktop/planner
npm run client
```

Или используйте одну команду:
```bash
npm run dev
```

#### 2. Порт 5000 занят другим приложением

**Проверка:**
```bash
lsof -ti:5000
```

**Решение А - Остановить процесс:**
```bash
kill -9 $(lsof -ti:5000)
```

**Решение Б - Изменить порт:**

Отредактируйте [`server/index.js`](server/index.js):
```javascript
const PORT = 5001; // Вместо 5000
```

Затем отредактируйте [`client/package.json`](client/package.json):
```json
"proxy": "http://localhost:5001"
```

#### 3. CORS проблемы

Если сервер запущен, но все равно 403, проверьте что в [`server/index.js`](server/index.js) есть:
```javascript
app.use(cors());
```

### Полная перезагрузка

```bash
# Остановить все процессы (Ctrl+C)
# Очистить порты
kill -9 $(lsof -ti:5000)
kill -9 $(lsof -ti:3000)

# Перезапустить
cd ~/Desktop/planner
npm run dev
```

## 🚫 Другие ошибки

### Module not found

**Решение:**
```bash
cd ~/Desktop/planner
npm install
cd client && npm install
```

### Port already in use

**Решение:**
```bash
# Для порта 3000
kill -9 $(lsof -ti:3000)

# Для порта 5000
kill -9 $(lsof -ti:5000)
```

### Cannot connect to server

1. Убедитесь что сервер запущен
2. Проверьте что в браузере открыт http://localhost:3000 (не 5000)
3. Проверьте что proxy настроен в [`client/package.json`](client/package.json)

## ✅ Проверка работоспособности

### Шаг 1: Проверить backend
```bash
curl http://localhost:5000/api/tasks
```

Должен вернуть: `[]` или список задач

### Шаг 2: Проверить frontend

Откройте http://localhost:3000 в браузере - должно загрузиться приложение

### Шаг 3: Создать тестовую задачу

1. Нажмите "➕ Добавить задачу"
2. Заполните форму
3. Нажмите "Создать"

Если ошибки нет - все работает! ✨

## 📝 Логи

### Смотреть логи сервера
Они выводятся в терминале где запущен `npm run server`

### Смотреть логи клиента
Откройте DevTools в браузере (F12) → вкладка Console

## 💡 Полезные команды

```bash
# Проверить процессы на портах
lsof -i:5000
lsof -i:3000

# Убить все node процессы
pkill -9 node

# Перезапустить с чистого листа
cd ~/Desktop/planner
rm -rf node_modules client/node_modules
npm run install-all
npm run dev
```
