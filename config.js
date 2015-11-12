var environment = {
  'development': {
    'database_url': "postgres://gxcwajlqnngmcd:Zwn-y92PuvU3_POXPm4IXjMq-x@ec2-54-204-6-113.compute-1.amazonaws.com:5432/d4kfkhe3k34bbp?ssl=true"
  },
  'production': {
    'database_url': "postgres://gxcwajlqnngmcd:Zwn-y92PuvU3_POXPm4IXjMq-x@ec2-54-204-6-113.compute-1.amazonaws.com:5432/d4kfkhe3k34bbp"
  }
}

module.exports = function() {
  switch (process.env.NODE_ENV) {
    case 'development':
      return environment.development;

    case 'production':
      return environment.production;

    default:
      return environment.development;
  }
}
