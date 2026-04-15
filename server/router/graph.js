import express from 'express'
import { graph, graphlist, getRolesByPlay, getActorsByPlay, getVideosByPlay, getRoleDetail, getActorDetail, getPlayDetail } from '../router_handler/graph.js'

const router = express.Router()

router.get('/play/list', graphlist)
router.get('/play/:Id', graph)

router.get('/play/:Id/roles', getRolesByPlay);
router.get('/play/:Id/actors', getActorsByPlay);
router.get('/play/:Id/videos', getVideosByPlay);

router.get('/node/role/:id', getRoleDetail);   // 获取单个角色详细文案
router.get('/node/actor/:id', getActorDetail); // 获取单个演员生平资料
router.get('/node/play/:id', getPlayDetail);

export default router