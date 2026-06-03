import { Router, type IRouter } from "express";
import healthRouter from "./health";
import messagesRouter from "./messages";
import usersRouter from "./users";
import friendsRouter from "./friends";
import notificationsRouter from "./notifications";
import dmRouter from "./dm";
import storageRouter from "./storage";
import pushRouter from "./push";
import mixesRouter from "./mixes";
import activityRouter from "./activity";
import catalogRouter from "./catalog";

const router: IRouter = Router();

router.use(healthRouter);
router.use(messagesRouter);
router.use(usersRouter);
router.use(friendsRouter);
router.use(notificationsRouter);
router.use(dmRouter);
router.use(storageRouter);
router.use(pushRouter);
router.use(mixesRouter);
router.use(activityRouter);
router.use(catalogRouter);

export default router;
