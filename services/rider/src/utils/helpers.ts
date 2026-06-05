import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

export const getDistanceFromDB = async (
  restaurantId: string,
  addressId: string,
) => {
  const result = await prisma.$queryRaw<{ distance: number }[]>(
    Prisma.sql`
      SELECT ST_Distance(r.location, a.location) AS distance
      FROM "Restaurant" r
      JOIN "Address" a ON a.id = ${addressId}
      WHERE r.id = ${restaurantId}
    `,
  );
  console.log("Distance query result:", result);

  const row = result[0];

  if (!row || row.distance == null) {
    throw new Error("Distance calculation failed");
  }

  return +(row.distance / 1000).toFixed(2);
};

export const getDistanceHaversine = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return +(R * c).toFixed(2);
};

export const serializeBigInt = (data: any): any => {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
};
