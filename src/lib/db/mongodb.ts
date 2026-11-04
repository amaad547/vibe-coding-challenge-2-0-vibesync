import mongoose from "mongoose";
import dns from "node:dns";

// Ensure Node's DNS resolver handles MongoDB SRV queries reliably
if (typeof dns.setServers === "function") {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch {
    // Keep default resolver if environment restricts changing DNS servers
  }
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseConnectionCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseConnectionCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseConnectionCache) {
  global.mongooseConnectionCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in the environment.");
  }

  // Re-ensure DNS servers are set prior to connection in case of runtime reloads
  if (typeof dns.setServers === "function") {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch {
      // Ignore if not permitted in runtime
    }
  }

  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
    };

    cached.promise = mongoose.connect(uri, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export async function disconnectDatabase(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}
