import { fetchCoins } from "./market";
import {
  addMarkPrice,
  addOpenPositions,
  addTicker,
  getNormalizedStatistics,
} from "./relevance";
import { watchTicker } from "./ticker";
import { WebSocketService } from "./webSocketService";

import TestData from "../TestData";

export const SETTING = {
  TIME_UPDATE_HISTORY_INDEX: 5 * 60 * 1000, // миллисекунды
  TIME_CHECK_COIN_INTERVAL: 10 * 1000, // Интервал проверки времени (раз в минуту)
  COIN_CHECK_FREQUENCY: 5, // Частота проверки в минутах (кратно 5)
};

// Инициализируем WebSocket сервер на порту 8080
const webSocketService = new WebSocketService(8080);

// Обработчик ошибок с улучшенным логированием
const handleError = (error: unknown, context: string) => {
  console.error(`[${new Date().toISOString()}] Ошибка в ${context}:`, error);
};

// Флаг, указывающий на выполнение проверки монет
let isCheckingCoin = false;

// Функция проверки времени и запуска процесса проверки монет
const startCoinChecker = () => {
  setInterval(async () => {
    const currentMinutes = new Date().getMinutes();

    // Проверяем кратность минут пяти
    if (currentMinutes % SETTING.COIN_CHECK_FREQUENCY !== 0) return;

    // Если проверка уже идёт, не запускаем новую
    if (isCheckingCoin) return;

    // Устанавливаем флаг блокировки
    isCheckingCoin = true;

    try {
      await checkCoin();
    } catch (error) {
      handleError(error, "проверке монет");
    } finally {
      // Сбрасываем флаг после завершения проверки
      isCheckingCoin = false;
    }
  }, SETTING.TIME_CHECK_COIN_INTERVAL); // Проверяем раз в минуту
};

// Основная функция проверки монет
const checkCoin = async () => {
  try {
    await addOpenPositions();
    await addMarkPrice();
    addTicker();

    const data = getNormalizedStatistics();
    console.table(data);
    webSocketService.broadcastData(data);
  } catch (error) {
    handleError(error, "checkCoin");
  }
};

// Главная функция приложения
const app = async () => {
  try {
    await fetchCoins();
    watchTicker();
    startCoinChecker();

    // setInterval(() => {
    //   webSocketService.broadcastData(TestData);
    // }, 10 * 1000);
  } catch (error) {
    handleError(error, "запуске приложения");
  }
};

// Запуск приложения
app();
