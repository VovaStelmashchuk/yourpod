export function staticFiles(server) {
  server.route({
    method: 'GET',
    path: '/public/{param*}',
    handler: {
      directory: {
        path: 'src/public'
      }
    },
    options: {
      auth: false
    }
  });
}
