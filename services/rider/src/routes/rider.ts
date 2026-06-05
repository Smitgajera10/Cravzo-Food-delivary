import express from 'express';
import { isAuth } from '../middlewares/isAuth.js';
import { acceptOrder, addRiderProfile, fetchMycurrentOrder, fetchMyProfile, toggleRiderAvailability, updateOrderStatusByRider } from '../controllers/rider.js';
import uploadFile from '../middlewares/multer.js';


const router = express.Router();

router.get("/myprofile" , isAuth , fetchMyProfile)
router.patch("/toggle" , isAuth , toggleRiderAvailability)
router.post("/new" , isAuth , uploadFile , addRiderProfile);
router.post("/accept/:orderId" , isAuth , acceptOrder); 
router.get("/order/current" , isAuth , fetchMycurrentOrder);
router.put("/order/update/:orderId" , isAuth , updateOrderStatusByRider);

export default router;