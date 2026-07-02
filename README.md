# Real-Time Chat + Collaboration App

Full-stack real-time chat app: messaging, group channels, presence, file sharing,
message edit/delete, typing indicators, push notifications, and 1:1 WebRTC voice calls.

**Stack:** React (Vite) + Node/Express + Socket.io + MongoDB + Redis, plain JavaScript.

## Project layout

```
client/     React (Vite) frontend
server/     Express + Socket.io backend
docker-compose.yml   Local Mongo + Redis
```

See `server/src` for config/models/middleware/routes/controllers/services/sockets,
and `client/src` for api/context/components/hooks/pages.

## Setup

1. **Start infra** (MongoDB + Redis):
   ```
   docker compose up -d
   ```
   Redis is mapped to host port **6380** (not the default 6379) — this avoids
   clashing with any other Redis container you may already have running locally.
   Adjust `docker-compose.yml` and both `.env` files together if you change it.

2. **Install dependencies** (npm workspaces — installs both client and server):
   ```
   npm install
   ```

3. **Configure environment**:
   ```
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```
   Then in `server/.env`, set real values for `JWT_ACCESS_SECRET` and
   `JWT_REFRESH_SECRET` (any long random string — e.g. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).

   For push notifications, generate VAPID keys:
   ```
   npx web-push generate-vapid-keys
   ```
   Put the public/private key pair into `server/.env` (`VAPID_PUBLIC_KEY` /
   `VAPID_PRIVATE_KEY`) and the public key into `client/.env`
   (`VITE_VAPID_PUBLIC_KEY`). Push notifications are silently disabled if these
   are left blank — everything else works without them.

   If port `4000` or `4100` is already in use on your machine, change `PORT` in
   `server/.env` and the matching `VITE_API_URL` / `VITE_SOCKET_URL` in
   `client/.env`.

4. **Run both apps**:
   ```
   npm run dev
   ```
   Client: http://localhost:5173 — Server: whatever `PORT` you configured.

## Known limitations

- **No TURN server** — voice calls use a public STUN server only. Calls between
  peers behind symmetric NAT or restrictive corporate firewalls may fail to
  connect. Upgrade path: self-hosted [coturn](https://github.com/coturn/coturn)
  or a hosted TURN provider (Metered, Twilio, Xirsys).
- **No group calling** — voice calls are 1:1 peer-to-peer only. Group calls need
  an SFU (e.g. mediasoup/LiveKit), which is out of scope here.
- **File uploads are stored on local disk** (`server/uploads`), served statically.
  This is fine for a single server instance but won't work if you scale the
  server horizontally (a file uploaded to instance A isn't visible on instance
  B) — unlike the rest of the app, which is designed to scale via the Redis
  adapter and Redis-backed presence. Swap `server/src/services/storageService.js`
  for an S3/MinIO-backed implementation to fix this.
- **Presence is app-wide, not scoped to contacts** — all connected clients join
  one shared presence room, rather than computing each user's actual contact
  list on every connect/disconnect. Simple and cheap at this app's scale.

## Verifying it works

- `GET /api/health` checks Mongo + Redis connectivity.
- Register two users in two browser windows, start a DM, and exercise messaging,
  typing indicators, presence, edit/delete, file sharing, and voice calls between
  them.
