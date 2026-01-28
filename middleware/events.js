// events.js
let connections = [];

function eventsHandler(req, res) {
  // Required SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // If you're behind a proxy, you sometimes need this:
  res.flushHeaders && res.flushHeaders();

  // Keep the connection open by sending an initial comment
  res.write(":\n\n");

  const id = Date.now();
  connections.push({ id, res });

  req.on("close", () => {
    connections = connections.filter((c) => c.id !== id);
  });
}

function sendEvent(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  connections.forEach((c) => c.res.write(payload));
}

module.exports = { eventsHandler, sendEvent };