import express from 'express'
import { isAuth } from '../middlewares/isAuth.js';
import { addTocart, fetchMycart } from '../controllers/cart.js';
const router = express.Router()

router.post("/add" , isAuth , addTocart);
router.get("/all" , isAuth , fetchMycart);

export default router;