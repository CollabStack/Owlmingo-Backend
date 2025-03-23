const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("./config/passport.config");
const connectDB = require("./database");
const { port, mongoUri } = require("./config/app.config");
const crypto = require("crypto");
const cors = require('cors');

// Initialize Express App first
const app = express();

// Session secret
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");

var corsOptions = {
	origin: function (origin, callback) {
		// Build whitelist from environment variable
		// const whitelist = process.env.WHITELIST ? process.env.WHITELIST.split(",") : [];
    const whitelist = ["http://localhost:5000", "https://owlmingo.space"];
		if (!origin || whitelist.indexOf(origin) !== -1) {
			callback(null, true);
		} else {
			callback(new Error('Not allowed by CORS'));
		}
	},
	methods: "GET, POST, PUT, DELETE",
	credentials: true
}

// Middleware
app.use(express.json());

app.use(cors(corsOptions));

// Initialize session middleware with MongoDB store
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI || mongoUri,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60, // Session TTL (1 day)
      autoRemove: 'native' // Use MongoDB's TTL index
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
  })
);

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Database Connection
connectDB();

// Import Routes
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");

// Use Routes
app.get('/', (req, res) => {
  res.send('Welcome to Owlmingo 🦉 Bro Sann is the King 👑');
});

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);

const PORT = process.env.PORT || port;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});