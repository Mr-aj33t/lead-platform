require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const config = require('./config');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const noteRoutes = require('./routes/notes');
const activityRoutes = require('./routes/activity');
const userRoutes = require('./routes/users');
const publicRoutes = require('./routes/public');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());

const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => res.send('Lead Platform API Server is running successfully!'));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

if (require.main === module) {
  connectDB().then(() => {
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });
  });
}

module.exports = app;
