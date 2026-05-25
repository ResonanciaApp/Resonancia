import { Router, type IRouter } from "express";
import healthRouter from "./health";
import messagesRouter from "./messages";
import usersRouter from "./users";
import friendsRouter from "./friends";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(messagesRouter);
router.use(usersRouter);
router.use(friendsRouter);
router.use(notificationsRouter);

export default router;
