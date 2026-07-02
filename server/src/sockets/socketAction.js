// Wraps a socket event handler with zod validation and a consistent ack contract:
// {ok:true, ...result} on success, {ok:false, error:{code,message}} on failure.
// Unhandled (non-AppError) exceptions are logged server-side but still ack'd cleanly
// so a bug never leaves the client's optimistic-UI promise hanging forever.
export function createSocketAction(socket, schema, handler) {
  return async (payload, ack) => {
    const cb = typeof ack === 'function' ? ack : () => {};

    const parsed = schema ? schema.safeParse(payload) : { success: true, data: payload };
    if (!parsed.success) {
      return cb({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid payload' } });
    }

    try {
      const result = await handler(parsed.data);
      cb({ ok: true, ...(result || {}) });
    } catch (err) {
      cb({
        ok: false,
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.isOperational ? err.message : 'Something went wrong',
        },
      });
      if (!err.isOperational) {
        console.error(`[socket:${socket.id}] handler error:`, err);
      }
    }
  };
}
