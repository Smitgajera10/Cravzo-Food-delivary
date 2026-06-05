import axios from "axios";
import { getChannel } from "./rabbitmq.js";
import { prisma } from "../utils/prisma.js";
import { Prisma } from "@prisma/client";

export const startOrderReadyConsumer = async () => {
  const channel = getChannel();

  console.log("Starting to consume from :", process.env.ORDER_READY_QUEUE);

  channel.consume(process.env.ORDER_READY_QUEUE!, async (msg) => {
    if (!msg) return;

    try {
      console.log("Received message", msg.content.toString());

      const event = JSON.parse(msg.content.toString());

      console.log("event type", event.type);

      if (event.type !== "ORDER_READY_FOR_RIDER") {
        console.log("skipping non-ready-for-rider event");
        channel.ack(msg);
        return;
      }

      const { orderId, restaurantId, latitude, longitude } = event.data;

      console.log("Searching for rider near : ", latitude, longitude);

      const riders = await prisma.$queryRaw<any[]>(Prisma.sql`
            SELECT *,
                ST_Distance(
                location,
                ST_SetSRID(
                    ST_MakePoint(${longitude}, ${latitude}),
                    4326
                )::geography
                ) AS distance
            FROM "Rider"
            WHERE
                "isAvailable" = true
                AND "isVerified" = true
                AND ST_DWithin(
                location,
                ST_SetSRID(
                    ST_MakePoint(${longitude}, ${latitude}),
                    4326
                )::geography,
                5000
                )
            ORDER BY distance ASC
            LIMIT 20
        `);

      console.log(`Found ${riders.length} riders near the restaurant`);

      if (riders.length === 0) {
        console.log("No riders available nearby");
        channel.ack(msg);
        return;
      }

      for (const rider of riders) {
        console.log(`Notifying rider ${rider.id} about order ${orderId}`);

        try {
          await axios.post(
            `${process.env.REALTIME_SERVICE}/api/internal/emit`,
            {
              event: "order:available",
              room: `user:${rider.userId}`,
              payload: { orderId, restaurantId },
            },
            {
              headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY!,
              },
            },
          );

          console.log(`Notified rider ${rider.userId} successfully`);
        } catch (error) {
          console.error(`Failed to notify rider ${rider.userId} : `, error);
        }
      }

      channel.ack(msg);
      console.log("message acknowledged");
    } catch (error) {
      console.error("OrderReady consumer Error processing message : ", error);
      channel.nack(msg, false, false); // discard the message
    }
  });
};
