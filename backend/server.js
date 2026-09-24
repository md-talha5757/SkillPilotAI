require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const courseRoutes = require('./routes/courseRoutes');
const jobRoutes = require('./routes/jobRoutes');
const industryRoutes = require('./routes/industryRoutes');
const academiaRoutes = require('./routes/academiaRoutes');
const skillVerificationRoutes = require('./routes/skillVerificationRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors()); // allows the frontend (different origin) to call this API
app.use(express.json()); // lets Express read JSON request bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/industry', industryRoutes);
app.use('/api/academia', academiaRoutes);
app.use('/api/skill', skillVerificationRoutes);

// Simple health check route — visit this in browser to confirm server is alive
app.get('/', (req, res) => {
  res.send('SkillPilot AI backend is running ✅');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
