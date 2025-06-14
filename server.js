const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stdAttendance = require('./db/db1.js');

const app = express();
const PORT = process.env.PORT || 5004;

let prevName = "";



const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://attendance-frontend.vercel.app',
  'https://attendance-frontend-jagrat-khatter.vercel.app',
  'https://attendance-frontend-git-main-jagrat-khatter.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser clients like curl/postman
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn("❌ Blocked by CORS:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));


app.use(bodyParser.json()); // Converts incoming JSON to JS object

// Middleware to avoid duplicate marking
function deBounce(req, res, next) {
  const { name, distance } = req.body;
  if (name === prevName) {
    console.log(`⚠️ Already marked for today: ${name}`);
    return res.status(200).json({ message: "Attendance already marked" });
  } else {
    prevName = name;
    next();
  }
}

// Main route
app.post('/mark-attendance', deBounce, async (req, res) => {
  //console.log('_________________');
  try {
    const { name, distance } = req.body;

    // Basic validation
    if (!name || typeof distance !== 'number' || distance > 0.5) {
      return res.status(400).json({ message: 'Invalid or low-quality recognition result' });
    }

    const [username, rollNo] = name.split(' ');
    if (!username || !rollNo) {
      return res.status(400).json({ message: 'Name format should be "Username RollNo"' });
    }

    const dateString = new Date().toDateString();

    const userStatus = await stdAttendance.findOne({ username, rollNo });

    if (!userStatus) {
      // Create new student document
      await stdAttendance.create({
        username,
        rollNo,
        presentDays: [dateString],
      });
      console.log(`🆕 New student created: ${name} with distance ${distance.toFixed(4)}`);
    } else {
      // Update existing student if not marked already
      if (!userStatus.presentDays.includes(dateString)) {
        await stdAttendance.updateOne(
          { username, rollNo },
          { $push: { presentDays: dateString } }
        );
        console.log(`🟢 Attendance marked: ${name} with distance ${distance.toFixed(4)}`);
      } else {
        console.log(`⚠️ Already marked for today: ${name}`);
      }
    }

    res.json({ message: 'Attendance processed.' });
  } catch (err) {
    console.error("❌ Error marking attendance:", err);
    res.status(500).json({ message: "Server error while processing attendance" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend listening on http://localhost:${PORT}`);
});
