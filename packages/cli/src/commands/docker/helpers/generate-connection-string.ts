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

export type ConnectionConfig =
  | PostgresConnectionConfig
  | MysqlConnectionConfig
  | RedisConnectionConfig
  | MongoConnectionConfig;

export function generateConnectionString(config: ConnectionConfig): string {
  switch (config.type) {
    case "postgresql":
      return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
    case "mysql":
      return `mysql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
    case "redis":
      return `redis://:${config.password}@${config.host}:${config.port}`;
    case "mongodb":
      return `mongodb://${config.user}:${config.password}@${config.host}:${config.port}`;
    default: {
      const _exhaustive: never = config;
      return _exhaustive;
    }
  }
}
