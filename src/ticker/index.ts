import type { Symbol } from "../market/symbols";
import { getCoinsSymbol } from "../market";

import type { TickerLinearInverseV5 } from "bybit-api";
import { SETTING } from "..";

export interface Ticker extends Partial<TickerLinearInverseV5> {
  symbol: Symbol;
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
    console.log(args);
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

export { watchTicker };
