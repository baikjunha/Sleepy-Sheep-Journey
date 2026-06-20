import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sessionsRouter from "./sessions";
import ttsRouter from "./tts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sessionsRouter);
router.use(ttsRouter);

export default router;
