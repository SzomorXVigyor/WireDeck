import { from, EnvVarError } from 'env-var';

const env = from(process.env, {});

export const JWT_SECRET = env.get('JWT_SECRET').required().asString();
export const PORT = env.get('PORT').default(8080).asPortNumber();
export const FRONTEND_URL = env.get('FRONTEND_URL').default('http://localhost:3000').asString();
export const NODE_ENV = env.get('NODE_ENV').default('development').asString();
export const IN_PRODUCTION = NODE_ENV === 'production';
export const IN_DEVELOPMENT = NODE_ENV === 'development';
export const WIREDECK_SLAVE = env.get('WIREDECK_SLAVE').default('true').asBool();
export const PASS_CHANGE_URL = env.get('PASS_CHANGE_URL').default('').asString();
export const SERVICE_NAME = env.get('SERVICE_NAME').default('').asString();

if (WIREDECK_SLAVE && (!PASS_CHANGE_URL || !SERVICE_NAME)) {
  throw new EnvVarError('WIREDECK_SLAVE is enabled, but PASS_CHANGE_URL and SERVICE_NAME must be defined');
}
