import { from } from 'env-var';

const env = from(process.env, {});

export const JWT_SECRET = env.get('JWT_SECRET').required().asString();
export const PORT = env.get('PORT').default(8080).asPortNumber();
export const FRONTEND_URL = env.get('FRONTEND_URL').default('http://localhost:3000').asString();
export const NODE_ENV = env.get('NODE_ENV').default('development').asString();
export const IN_PRODUCTION = NODE_ENV === 'production';
export const IN_DEVELOPMENT = NODE_ENV === 'development';