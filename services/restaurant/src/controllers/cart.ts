import { AuthRequest } from "../middlewares/isAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../utils/prisma.js";

export const addTocart  = asyncHandler(async(req : AuthRequest , res)=>{
    try {
        if(!req.user){
            return res.status(401).json({
                message : "Please Login",
            })
        }

        const userId = req.user.id;

        const {restaurantId , itemId} = req.body;

        if(!restaurantId || !itemId){
            return res.status(400).json({
                message : "Restaurent id and item id are required",
            });
        }

        const cartFromDiffrentRestaurant = await prisma.cart.findFirst({
            where:{
                userId,
                restaurantId : {
                    not : restaurantId,
                } 
            }
        });

        if(cartFromDiffrentRestaurant){
            return res.status(401).json({
                message : "you can order from only one restaurant at a time, Please clear your cart first to add items from this restaurant.",
            });
        }

        const cartItem = await prisma.cart.upsert({
            where:{
                userId_restaurantId_itemId:{
                    userId,
                    restaurantId,
                    itemId
                }
            },
            update:{
                quantity:{  
                    increment:1,
                }
            },
            create:{
                userId,
                restaurantId,
                itemId,
                quantity : 1
            }
            
        });

        return res.json({
            message : "Item added to cart",
            cart : cartItem,
        })
    } catch (error) {
        console.log(error)
    }
})


export const fetchMycart = asyncHandler(async(req:AuthRequest , res)=>{
    try{
        if(!req.user){
            return res.status(401).json({
                message : "Please Login",
            })
        }

        const userId = req.user.id;

        const cartItems = await prisma.cart.findMany({
            where:{
                userId,
            },
        })

        let subtotal = 0;
        let cartLength = 0;
        
        for(const cartItem of cartItems){
            const item : any = cartItem.itemId;

            subtotal += item.price * cartItem.quantity;
            cartLength += cartItem.quantity
        }

        return res.json({
            success : true,
            cartLength,
            subtotal,
            cart : cartItems
        })
    }catch(error){
        console.log(error);
    }
})