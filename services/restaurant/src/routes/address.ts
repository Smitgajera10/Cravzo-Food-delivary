import express from 'express'
import { isAuth } from '../middlewares/isAuth.js';
import { AddAddress, deleteAddress, getMyaddresses } from '../controllers/address.js';
const router = express.Router()

router.post("/new" , isAuth , AddAddress);
router.delete("/:id" , isAuth , deleteAddress);
router.get("/all" , isAuth , getMyaddresses);

export default router;