import test from 'ava';
const request = require('supertest');

const T = 'http://m.76wx.com/book/1563/';

function makeApp(func, route, method = 'get') {
	// koa
	const Koa = require('koa');
	const router = require('koa-router')();
	const body = require('koa-body');

	const app = new Koa();
	// console.log(`/${route}`, func)
	if (method) {
		router[method](`/${route}`, func);
	}
	// Middleware
	app.use(body());
	app.use(router.routes());
	app.use(router.allowedMethods());

	return app;
}

test(':get /api/getAllBooks', async t => {
	const { getAllBooks } = require('./getOrPost');

	const res = await request(makeApp(getAllBooks, 'getAllBooks').listen())
		.get('/getAllBooks')
		.then(res => {
			return res;
		});
	// res.text from get jsonstore is json
	t.is(JSON.parse(res.text)['ok'], true);
});

test(':post /api/addJsonStore', async t => {
	const { addJsonStore } = require('./getOrPost');
	let A = 'addJsonStore';

	const res = await request(makeApp(addJsonStore, `${A}`, 'post').listen())
		.post(`/${A}`)
		.send({ url: T })
		.then(res => {
			return res;
		});
	// res. from post jsonstore is object
	t.is(res['ok'], true);
});

test(':post /api/getNoAbsBooks', async t => {
	const { getNoAbsBooks } = require('./getOrPost');
	let A = 'getNoAbsBooks';

	const res = await request(makeApp(getNoAbsBooks, `${A}`, 'post').listen())
		.post(`/${A}`)
		.send({ url: T })
		.then(res => {
			return res;
		});
	// res. from post jsonstore is object
	t.is(res['ok'], true);
});
