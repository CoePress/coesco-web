import express from 'express';
import morgan from 'morgan';
import axios from 'axios';
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

app.use(morganMiddleware);

app.get('/crypto', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api2.binance.com/api/v3/ticker/24hr',
    );
    const tickerPrice = response.data;
    res.json(tickerPrice);
  } catch (err) {
    logger.error(err);
    res.status(500).send('Internal server error');
  }
});

app.use('/v1', router);

app.use(errorHandler);

app.listen(env.PORT, (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    return;
  }
  console.log(`Server is running on port ${env.PORT}`);
});