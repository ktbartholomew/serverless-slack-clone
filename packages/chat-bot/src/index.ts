import { readFile } from "fs/promises";
import { WebSocket } from "ws";

async function main() {
  if (!process.env.URL) {
    throw new Error("URL is required");
  }

  const file = await readFile("./src/quotes.txt", "utf-8");

  const lines = new Array<string>();
  file.split("\n").forEach((line) => {
    if (line.trim().length > 0) {
      lines.push(line.trim());
    }
  });

  const ws = new WebSocket(process.env.URL, {
    headers: {
      authorization: "Bearer zwn17MznDSVvJD4Z-KnNF",
    },
  });

  ws.on("error", (e) => {
    console.error(e.toString());
  });
  ws.on("unexpected-response", (e) => {
    console.error(e.toString());
  });
  ws.on("message", (e) => {
    console.log(e.toString());
  });

  while (true) {
    if (ws.readyState === ws.OPEN) {
      const line = lines[Math.floor(Math.random() * lines.length)];

      ws.send(
        JSON.stringify({
          event: "sendMessage",
          detail: { message: line, room: "general" },
        }) + "\n"
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
