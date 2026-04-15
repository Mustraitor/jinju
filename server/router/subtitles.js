import express from "express";
import { getSubtitles } from "../router_handler/subtitles.js";

const router = express.Router();

router.get("/:videoId", getSubtitles);

export default router;
