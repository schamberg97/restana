/**
 * restana Web Framework implementation
 *
 * @license MIT
 */

const shortcuts = ['get', 'delete', 'patch', 'post', 'put', 'head', 'options', 'trace', 'all']
const requestRouter = require('./libs/request-router')
const exts = {
  request: {},
  response: require('./libs/response-extensions')
}

module.exports = (options = {}) => {
  const router = requestRouter(options)
  const server = options.server || require('http').createServer()
  const prp = undefined === options.prioRequestsProcessing ? true : options.prioRequestsProcessing
  if (prp) {
    server.on('request', (req, res) => {
      setImmediate(() => app.handle(req, res))
    })
  } else {
    server.on('request', (req, res) => {
      app.handle(req, res)
    })
  }

  const app = {
    getRouter () {
      return router
    },

    errorHandler: options.errorHandler || ((err, req, res) => {
      res.send(err)
    }),

    newRouter (opts = options) {
      return requestRouter(opts)
    },

    getServer () {
      return server
    },

    getConfigOptions () {
      return options
    },

    use: router.use,

    handle: (req, res) => {
      // request object population
      res.send = exts.response.send(options, req, res)

      router.lookup(req, res)
    },

    start: (port = 3000, host) => new Promise((resolve, reject) => {
      server.listen(port, host, (err) => {
        if (err) reject(err)
        resolve(server)
      })
    }),

    close: () => new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err)
        resolve()
      })
    })

  }

  shortcuts.forEach((method) => {
    app[method] = router[method]
  })

  app.callback = () => app.handle

  app.use(async (req, res, next) => {
    try {
      await next()
    } catch (err) {
      return app.errorHandler(err, req, res)
    }
  })

  return app
}
