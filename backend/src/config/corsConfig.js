export const corsOptions = {
  origin: true, // Automatically reflect request origin (allowing localhost:3000, 3001, 127.0.0.1, etc.)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization'],
};

export default corsOptions;
