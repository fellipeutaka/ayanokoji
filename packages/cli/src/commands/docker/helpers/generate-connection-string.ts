export interface PostgresConnectionConfig {
  type: "postgresql";
  user: string;
  password: string;
  host: string;
  port: string;
  database: string;
}

export interface MysqlConnectionConfig {
  type: "mysql";
  user: string;
  password: string;
  host: string;
  port: string;
  database: string;
}

export interface RedisConnectionConfig {
  type: "redis";
  password: string;
  host: string;
  port: string;
}

export interface MongoConnectionConfig {
  type: "mongodb";
  user: string;
  password: string;
  host: string;
  port: string;
}

export interface MariadbConnectionConfig {
  type: "mariadb";
  user: string;
  password: string;
  host: string;
  port: string;
  database: string;
}

export interface ValkeyConnectionConfig {
  type: "valkey";
  password: string;
  host: string;
  port: string;
}

export interface RabbitmqConnectionConfig {
  type: "rabbitmq";
  user: string;
  password: string;
  host: string;
  port: string;
}

export interface MinioConnectionConfig {
  type: "minio";
  user: string;
  password: string;
  host: string;
  port: string;
}

export interface MailpitConnectionConfig {
  type: "mailpit";
  host: string;
  smtpPort: string;
  uiPort: string;
}

export type ConnectionConfig =
  | PostgresConnectionConfig
  | MysqlConnectionConfig
  | RedisConnectionConfig
  | MongoConnectionConfig
  | MariadbConnectionConfig
  | ValkeyConnectionConfig
  | RabbitmqConnectionConfig
  | MinioConnectionConfig
  | MailpitConnectionConfig;

export function generateConnectionString(config: ConnectionConfig): string {
  switch (config.type) {
    case "postgresql": {
      return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
    }
    case "mysql": {
      return `mysql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
    }
    case "redis": {
      return `redis://:${config.password}@${config.host}:${config.port}`;
    }
    case "mongodb": {
      return `mongodb://${config.user}:${config.password}@${config.host}:${config.port}`;
    }
    case "mariadb": {
      return `mysql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
    }
    case "valkey": {
      return `redis://:${config.password}@${config.host}:${config.port}`;
    }
    case "rabbitmq": {
      return `amqp://${config.user}:${config.password}@${config.host}:${config.port}`;
    }
    case "minio": {
      return `http://${config.host}:${config.port}`;
    }
    case "mailpit": {
      return `smtp://${config.host}:${config.smtpPort}`;
    }
    default: {
      const _exhaustive: never = config;
      return _exhaustive;
    }
  }
}
