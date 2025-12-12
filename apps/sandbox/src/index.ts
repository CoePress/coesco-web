import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import axios from 'axios';
import compression from "compression";
import cookieParser from "cookie-parser";
import logger from './lib/logger';
import env from './lib/env';
import router from './routes';
import { errorHandler } from './middleware/error-handler';

const app = express();

const morganMiddleware = morgan(
  function (tokens, req, res) {
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: Number.parseFloat(tokens.status(req, res) ?? '0'),
      content_length: tokens.res(req, res, 'content-length'),
      response_time: Number.parseFloat(tokens['response-time'](req, res) ?? '0'),
    });
  },
  {
    stream: {
      write: (message) => {
        const data = JSON.parse(message);
        logger.http(`incoming-request`, data);
      },
    },
  }
);

app.use(compression());
app.use(cookieParser());
app.use(express.json());

app.use(morganMiddleware);

app.get('/health', async (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/v1', router);

app.use((req: Request, _res: Response, next: NextFunction) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`) as any;
  err.status = 404;
  next(err);
});

app.use(errorHandler);

app.listen(env.PORT, (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    return;
  }
  console.log(`Server is running on port ${env.PORT}`);
});