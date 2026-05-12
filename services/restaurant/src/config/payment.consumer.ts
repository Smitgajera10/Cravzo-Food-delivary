import { prisma } from '../utils/prisma.js';
import { getChannel } from './rabbitmq.js'

export const startPaymentConsumer = async()=>{
    const channel = getChannel();

    channel.consume(process.env.PAYMENT_QUEUE! , async(msg)=>{
        if(!msg) return;

        try {
            const event = JSON.parse(msg.content.toString());

            if(event.type != "PAYMENT_SUCCESS"){
                channel.ack(msg)
                return;
            }

            const {orderId} = event.data;

            const order = await prisma.order.update({
                where : {
                    id : orderId,
                    paymentStatus : {
                        not : "PAID"
                    }
                },
                data : {
                    paymentStatus : "PAID",
                    status : "PLACED",
                    expiresAt: null
                }
                
            })

            if(!order){
                channel.ack(msg);
                return;
            }

            console.log(`✅Order with id ${orderId} marked as PAID and PLACED`);


            channel.ack(msg);
        } catch (error) {
            console.error("❌ payment cosumer error:", error);
        }
    })
}