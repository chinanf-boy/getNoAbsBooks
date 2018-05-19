const path = require('path');

// koa
const Koa = require('koa');
const cors = require('@koa/cors');
const body = require('koa-body');
const logger = require('koa-logger');
const router = require('koa-router')({
	prefix: '/api',
});
const static = require('koa-static')(path.resolve(__dirname, '.', 'dist'));

// config
const PORT = process.env.PORT || 5000;

const ROOT_DIR = process.env.NODE_ENV === 'production' ? '/' : __dirname;

const app = new Koa();

// route func
const {
	getNoAbsBooks,
	getAllBooks,
	addJsonStore,
	deleteJsonStore,
} = require('./getOrPost');

// Routes definition
router.post('/getNoAbsBooks', getNoAbsBooks);
router.post('/addJsonStore', addJsonStore);
router.delete('/deleteJsonStore', deleteJsonStore);

router.get('/getAllBooks', getAllBooks);

// Middleware
app.use(cors());
app.use(body());
app.use(logger());
app.use(static);
app.use(router.routes());
app.use(router.allowedMethods());

// Start server
app.listen(PORT);
console.log('* get 81 started on port %s', PORT);
console.log('* Output directory: %s', ROOT_DIR);
