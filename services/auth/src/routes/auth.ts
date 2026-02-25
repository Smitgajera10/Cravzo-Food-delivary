import express from "express";
import { addRole, loginUser, myProfile } from "../controller/auth.controller.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/google-login", loginUser);
router.put("/add-role", isAuth, addRole);
router.get("/me" , isAuth , myProfile);

export default router;