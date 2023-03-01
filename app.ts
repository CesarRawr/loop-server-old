import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import mongoSanitize from 'express-mongo-sanitize';
import router from './src/routes/v1.js';

const app = express();
const port = 8080;

dotenv.config();

app.use(express.static('public'));
app.use(cors());
app.use(mongoSanitize());

app.use(bodyParser.json());
app.use('/v1', router);

app.listen(port, () => {
  console.log(`Listen on port ${port}`);
});
