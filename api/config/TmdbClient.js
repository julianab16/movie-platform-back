import axios from 'axios';
import 'dotenv/config';

export const tmdbClient = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  headers: {
    Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    'Content-Type': 'application/json;charset=utf-8',

  },
});
