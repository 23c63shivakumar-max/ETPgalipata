// CORS Configuration
const corsConfig = {
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            // Add any other origins you need
        ];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin);
        } else {
            callback(new Error('CORS not allowed'));
        }
    }
};

export default corsConfig;