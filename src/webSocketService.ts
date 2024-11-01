import WebSocket, { WebSocketServer } from "ws";

export class WebSocketService {
  private connectedClients: WebSocket[] = [];
  private wss: WebSocketServer;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.init();
  }

  private init() {
    this.wss.on("connection", (ws: WebSocket) => {
      console.log("Новое соединение установлено.");
      this.connectedClients.push(ws);

      ws.on("close", () => {
        console.log("Соединение закрыто");
        this.removeClient(ws);
      });
    });

    console.log(
      `WebSocket сервер запущен на ws://localhost:${this.wss.options.port}`
    );
  }

  private removeClient(client: WebSocket) {
    const index = this.connectedClients.indexOf(client);
    if (index > -1) {
      this.connectedClients.splice(index, 1);
    }
  }

  public broadcastData(data: any) {
    this.connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
}
