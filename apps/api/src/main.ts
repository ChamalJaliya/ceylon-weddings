import "./load-env";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { cleanupOpenApiDoc, ZodValidationPipe } from "nestjs-zod";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { loadApiEnv } from "@ceylonweddings/env";
import { AppModule } from "./app.module";
import { RedisIoAdapter } from "./realtime.adapter";

async function bootstrap() {
  const env = loadApiEnv();
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: [
            "'self'",
            "data:",
            "blob:",
            "https://images.unsplash.com",
            "https://*.amazonaws.com",
            "https://*.googleusercontent.com",
          ],
          connectSrc: ["'self'", "ws:", "wss:", "https://accounts.google.com"],
          frameSrc: ["'self'", "https://accounts.google.com"],
          objectSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(cookieParser());
  app.enableCors({
    origin: env.CORS_ORIGINS,
    credentials: true,
  });
  app.useGlobalPipes(new ZodValidationPipe());

  const redisIoAdapter = new RedisIoAdapter(app, env.REDIS_URL);
  try {
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
  } catch (error) {
    console.warn("Redis unavailable; Socket.IO running without adapter", error);
  }

  const swagger = new DocumentBuilder()
    .setTitle("Ceylon Weddings API")
    .setDescription("Contract-based OpenAPI for the Ceylon Weddings site")
    .setVersion("0.1.0")
    .addCookieAuth("cw_access")
    .build();

  const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, swagger));
  SwaggerModule.setup("docs", app, document);

  await app.listen(env.PORT);
}

void bootstrap();
