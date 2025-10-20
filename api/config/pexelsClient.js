import { createClient } from "pexels";
import "dotenv/config";

export const pexelsClient = createClient(process.env.PEXELS_API_KEY);