export default {
  driver: 'database',

  database: {
    tableName: 'adonis_jobs',
    config: {
      pollingDelay: 500,
    },
  },
}
