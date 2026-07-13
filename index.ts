import { Router, type IRouter } from "express";
import healthRouter from "./health";
import configsRouter from "./configs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(configsRouter);

export default router;
