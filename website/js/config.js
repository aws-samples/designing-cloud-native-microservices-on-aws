/**
 * API Configuration for EventStorming Coffeeshop microservices.
 */
const API_CONFIG = Object.freeze({
  orders: {
    baseUrl: 'http://localhost:8081',
    endpoints: {
      create: '/order',
    },
  },
  coffee: {
    baseUrl: 'http://localhost:8082',
    endpoints: {
      list: '/coffee',
    },
  },
  inventory: {
    baseUrl: 'http://localhost:8083',
    endpoints: {
      list: '/inventory',
    },
  },
  timeout: 10000,
});
