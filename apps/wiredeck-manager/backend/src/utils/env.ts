import { from } from 'env-var';

const env = from(process.env, {});

export const DATABASE_URL = env.get('DATABASE_URL').required().asString();
export const JWT_SECRET = env.get('JWT_SECRET').required().asString();
export const PORT = env.get('PORT').default(8080).asPortNumber();
export const FRONTEND_URL = env.get('FRONTEND_URL').default('http://localhost:3000').asString();
export const NODE_ENV = env.get('NODE_ENV').default('development').asString();
export const IN_PRODUCTION = NODE_ENV === 'production';
export const IN_DEVELOPMENT = NODE_ENV === 'development';
export const SERVICE_NAME = env.get('SERVICE_NAME').required().asString();
export const VERSION = env.get('npm_package_version').default('0.0.0').asString();

// The application will use /24 subnets for instances
// Each module will use the same last octet as the instance's internal IP, but each submodules has a dedicated subnet (3th octet)
// Example: instance ip = 10.0.0.1, then webVNC will be 10.0.1.1, webView will be 10.0.2.1
export const INSTANCE_START_IP = env.get('INSTANCE_START_IP').required().asString();
// The first available port for instance, also open the next 255 ports on host for later instances
export const INSTANCE_START_PORT = env.get('INSTANCE_START_PORT').required().asPortNumber();
// Root domain for the application
export const ROOT_DOMAIN = env.get('ROOT_DOMAIN').required().asString();
// Email for certification obtain and renewal
export const CERTBOT_EMAIL = env.get('CERTBOT_EMAIL').required().asString();
// Users for the application
export const USERS = env.get('USERS').required().asJson();
