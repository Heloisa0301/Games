import express from 'express';
import cors from 'cors';
import { routes } from './routes';
import { initDb } from './database';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(routes);

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`API rodando na porta ${PORT}`);
  });
});