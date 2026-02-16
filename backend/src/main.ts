import'reflect-metadata';
import { NestFactory } from'@nestjs/core';
import { ValidationPipe } from'@nestjs/common';
import * as express from'express';
import { AppModule } from'./app.module';

async function bootstrap() {
 const app = await NestFactory.create(AppModule);

 // Increase body-parser limit so large preview payloads (all member files) succeed
 app.use(express.json({ limit:'5mb' }));
 app.use(express.urlencoded({ extended: true, limit:'5mb' }));

 // Enable CORS for local development (including preview ports 5200+)
 app.enableCors({
 origin: (origin, callback) => {
 // Allow requests with no origin (e.g. server-to-server, curl)
 if (!origin) return callback(null, true);
 // Allow localhost on any port (frontend 5173, backend 3000, previews 5200+)
 if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
 if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return callback(null, true);
 callback(null, false);
 },
 credentials: true,
 });

 // Strip unknown properties and auto-transform payloads
 app.useGlobalPipes(
 new ValidationPipe({
 whitelist: true,
 transform: true,
 forbidNonWhitelisted: false,
 }),
 );

 // Graceful shutdown
 app.enableShutdownHooks();

 const port = process.env.PORT || 3000;
 await app.listen(port);
 console.log(`Backend running on http://localhost:${port}`);
}

bootstrap();
