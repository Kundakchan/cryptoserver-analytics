import type { Symbol } from "../market/symbols";
import { getCoinsSymbol } from "../market";

import type { TickerLinearInverseV5 } from "bybit-api";
import { SETTING } from "..";

export interface Ticker extends Partial<TickerLinearInverseV5> {
  symbol: Symbol;
  tickDirection?: "PlusTick" | "ZeroPlusTick" | "MinusTick" | "ZeroMinusTick";
}

interface CoinsHistoryRecord extends Partial<Record<keyof Ticker, string[]>> {
  timestamp: Date;
}
interface CoinsHistory extends Partial<Record<Symbol, CoinsHistoryRecord[]>> {}
const coinsHistory: CoinsHistory = {};

let historyIndex = 0;
let historyStart = false;

const updateHistoryIndex = () => {
  setTimeout(() => {
    historyIndex = historyIndex + 1;
    updateHistoryIndex();
  }, SETTING.TIME_UPDATE_HISTORY_INDEX * 1000);
};

const updateCoinsHistory = (data: Ticker) => {
  if (!historyStart) {
    updateHistoryIndex();
    historyStart = true;
  }

  const symbol = data?.symbol;

  if (!symbol) return;

  Object.entries(data).forEach(([item, value]) => {
    const history = (coinsHistory[symbol] ??= [{ timestamp: new Date() }]);

    if (!history[historyIndex]) {
      history[historyIndex] = { timestamp: new Date() };
    }
    const currentItem = (history[historyIndex][item] ??= []);

    currentItem.push(value);
  });
};

const getWSParams = () => {
  try {
    const args = getCoinsSymbol().map((symbol) => `tickers.${symbol}`);
    const subscribe = {
      op: "subscribe",
      args: args,
    };
    return JSON.stringify(subscribe);
  } catch (error) {
    console.error(new Error("НЕ УДАЛОСЬ ПОЛУЧИТЬ ПАРАМЕТРЫ СОЕДИНЕНИЯ"));
    throw error;
  }
};

interface WatchTickerAfterUpdate {
  (params: Ticker): void;
}

interface WatchTicker {
  (params?: WatchTickerAfterUpdate): void;
}

const watchTicker: WatchTicker = (afterUpdate) => {
  if (!process.env.API_PUBLIC_WEBSOCKET) {
    throw new Error(
      `Некорректный адрес веб-сокета: ${process.env.API_PUBLIC_WEBSOCKET}`
    );
  }

  const ws = new WebSocket(process.env.API_PUBLIC_WEBSOCKET);

  ws.onopen = () => {
    console.warn("Соединение ws tickers открыто!");
    ws.send(getWSParams());
  };

  ws.onclose = () => {
    console.error("Соединение ws tickers закрыто!");
  };

  ws.onerror = (error: any) => {
    console.error("Ошибка Соединение ws tickers ", error);
  };

  ws.onmessage = (event: any) => {
    const data = JSON.parse(event.data).data as Ticker;
    updateCoinsHistory(data);
    if (afterUpdate) {
      afterUpdate(data);
    }
  };
};

const getHistoryCoin = ({
  symbol,
  interval,
}: {
  symbol: Symbol;
  interval: number;
}) => {
  const coin = coinsHistory[symbol]?.slice(-interval);
  return coin ? coin : [];
};

const getHistoryCoinAsCandles = ({
  symbol,
  interval,
}: {
  symbol: Symbol;
  interval: number;
}) => {
  const history = getHistoryCoin({ symbol, interval });
  return history.map((item) => ({
    timestamp: item.timestamp,
    amountChange: item.symbol?.length ?? 0,
    bid1Price: createCandle(item?.bid1Price),
    bid1Size: createCandle(item?.bid1Size),
    ask1Price: createCandle(item?.ask1Price),
    ask1Size: createCandle(item?.ask1Size),
    price24hPcnt: createCandle(item?.price24hPcnt),
    lastPrice: createCandle(item?.lastPrice),
    turnover24h: createCandle(item?.turnover24h),
    volume24h: createCandle(item?.volume24h),
    markPrice: createCandle(item.markPrice),
    tickDirection: createTickDirectionCandle(item?.tickDirection),
  }));
};

const createCandle = (list?: string[]) => {
  if (!list || list.length === 0) return null;

  // Преобразуем строковые значения в числа
  const numbers = list.map(Number);

  return {
    open: numbers[0], // Первое значение массива
    close: numbers[numbers.length - 1], // Последнее значение массива
    index: numbers.reduce((acc, num) => acc + num, 0) / numbers.length, // Среднее значение
    high: Math.max(...numbers), // Максимальное значение
    low: Math.min(...numbers), // Минимальное значение
    quantity: numbers.length, // Длина массива
  };
};

const createTickDirectionCandle = (list?: string[]) => {
  if (!list || list.length === 0) return null;

  const counts = {
    PlusTick: 0,
    ZeroPlusTick: 0,
    MinusTick: 0,
    ZeroMinusTick: 0,
  };

  // Подсчитываем количество каждого значения
  list.forEach((item) => {
    if (counts[item as keyof typeof counts] !== undefined) {
      counts[item as keyof typeof counts]++;
    }
  });

  // Определяем самое часто встречающееся значение
  const maxValue = Object.keys(counts).reduce((a, b) =>
    counts[a as keyof typeof counts] > counts[b as keyof typeof counts] ? a : b
  );

  return {
    open: list[0], // Первое значение массива
    close: list[list.length - 1], // Последнее значение массива
    quantity: list.length, // Длина массива
    plusTickQuantity: counts.PlusTick, // Количество значений PlusTick в массиве
    zeroPlusTickQuantity: counts.ZeroPlusTick, // Количество значений ZeroPlusTick в массиве
    minusTickQuantity: counts.MinusTick, // Количество значений MinusTick в массиве
    zeroMinusTickQuantity: counts.ZeroMinusTick, // Количество значений ZeroMinusTick в массиве
    max: maxValue, // Самое встречающееся значение в массиве
  };
};

export { watchTicker, getHistoryCoinAsCandles };
