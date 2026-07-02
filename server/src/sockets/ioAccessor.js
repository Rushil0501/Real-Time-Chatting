// Lets REST controllers emit socket.io events (e.g. channel:created) without importing
// the socket layer directly, avoiding a circular dependency between sockets/index.js
// (which mounts on the http server created in server.js) and the route/controller tree.
let ioInstance = null;

export function setIO(io) {
  ioInstance = io;
}

export function getIO() {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized yet');
  }
  return ioInstance;
}
