import { Router, type IRouter } from "express";
import healthRouter from "./health";
import messagesRouter from "./messages";
import usersRouter from "./users";
import friendsRouter from "./friends";

const router: IRouter = Router();

router.use(healthRouter);
router.use(messagesRouter);
router.use(usersRouter);
router.use(friendsRouter);

export default router;
