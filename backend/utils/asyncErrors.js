// Express 4 does not catch rejected promises from async route handlers – a single DB hiccup would
// crash the process. This patches Express' Route so any rejection is forwarded to the error middleware.
const Route = require('express/lib/router/route');

['all', 'get', 'post', 'put', 'delete', 'patch'].forEach((method) => {
  const original = Route.prototype[method];
  Route.prototype[method] = function patched(...handlers) {
    const wrapped = handlers.flat(Infinity).map((fn) =>
      typeof fn === 'function' && fn.length < 4
        ? (req, res, next) => {
            try {
              const out = fn(req, res, next);
              if (out && typeof out.catch === 'function') out.catch(next);
            } catch (e) { next(e); }
          }
        : fn
    );
    return original.apply(this, wrapped);
  };
});

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));
