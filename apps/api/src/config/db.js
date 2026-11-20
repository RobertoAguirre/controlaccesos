import mongoose from 'mongoose';

let connecting = null;

/**
 * Conexión reutilizable (local + serverless Vercel).
 */
export async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('Falta MONGODB_URI en el entorno');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connecting) return connecting;

  mongoose.set('strictQuery', true);
  connecting = mongoose
    .connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10,
    })
    .then((conn) => {
      console.log('MongoDB conectado');
      connecting = null;
      return conn;
    })
    .catch((err) => {
      connecting = null;
      throw err;
    });

  return connecting;
}
