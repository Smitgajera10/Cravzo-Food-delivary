import express from 'express';
import { createRazorpayOrder, payWithStripe, verifyRazorpayPayment, verifyStrpe } from '../controllers/payment.js';

const router = express.Router();

router.post("/create", createRazorpayOrder);
router.post("/verify" , verifyRazorpayPayment);
router.post("/stripe/create", payWithStripe);
router.post("/stripe/verify" , verifyStrpe);

export default router;