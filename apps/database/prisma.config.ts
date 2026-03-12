import { defineConfig, env } from "prisma/config";

const pgSchema: string = env("SERVICE_NAME") as string;
const pgName: string = env("SERVICE_IDENTIFIER") as string;
const dbUrl = new URL(env("DATABASE_URL") + pgName as string);
dbUrl.searchParams.set("schema", pgSchema);

export default defineConfig({
	schema: `./prisma/${pgName}/schema.prisma`,
	migrations: {
		path: `./migrations/${pgName}`,
	},
	datasource: {
		url: dbUrl.toString(),
	},
});
