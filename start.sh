#!/bin/bash

echo "🚀 Task Planner 3D - Установка и запуск"
echo "======================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей сервера..."
    npm install
else
    echo "✅ Зависимости сервера уже установлены"
fi

# Check if client/node_modules exists
if [ ! -d "client/node_modules" ]; then
    echo "📦 Установка зависимостей клиента..."
    cd client && npm install && cd ..
else
    echo "✅ Зависимости клиента уже установлены"
fi

echo ""
echo "🎉 Установка завершена!"
echo ""
echo "🚀 Запуск приложения..."
echo "   Backend: http://localhost:5000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "💡 Используйте Ctrl+C для остановки"
echo ""

npm run dev
