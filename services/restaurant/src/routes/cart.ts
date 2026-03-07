import express from 'express'
import { isAuth } from '../middlewares/isAuth.js';
import { addTocart, clearCart, decrementCartItem, fetchMycart, incrementCartItem } from '../controllers/cart.js';
const router = express.Router()

router.post("/add" , isAuth , addTocart);
router.get("/all" , isAuth , fetchMycart);
router.put("/inc" , isAuth , incrementCartItem);
router.put("/dec" , isAuth , decrementCartItem);
router.delete("/clear" , isAuth , clearCart);

export default router;