// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import * as fs from 'fs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  try {
    // Read the JSON file
    const dataPath = path.join(process.cwd(), 'restaurants.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const restaurants = JSON.parse(rawData);
    console.log(restaurants);

    // Find the restaurant by ID
    const restaurant = restaurants.find((restaurant: { id: any; }) => restaurant.id === id);

    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
    } else {
      res.status(200).json(restaurant);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
