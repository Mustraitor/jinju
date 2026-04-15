import express from 'express'
import multer from 'multer';
import { getAllUsers, updateUserRole, addUser, deleteUser, restoreUser, importGraphData, syncVideos } from '../router_handler/admin.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() });

router.get('/getAllUsers', getAllUsers)
router.post('/updateUserRole', updateUserRole)
router.post('/addUser', addUser)
router.delete('/deleteUser', deleteUser) 
router.post('/restoreUser', restoreUser) 
router.post('/importGraphData', upload.single('file'), importGraphData);
router.post('/syncVideos',syncVideos);

export default router