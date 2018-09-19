import test from 'ava';
const request = require('supertest');

const T = 'https://m.zwdu.com/book/9623/';

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

// test(':post /api/addBookTags', async t => {
// 	const { addBookTags } = require('./getOrPost');
// 	let A = 'addBookTags';

// 	const res = await request(makeApp(addBookTags, `${A}`, 'post').listen())
// 		.post(`/${A}`)
// 		.send({ url: T, title: 'test' })
// 		.then(res => {
// 			return res;
// 		});
// 	// res. from post jsonstore is object
// 	t.is(res['ok'], true);
// });

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

test.failing(':post /api/delJsonStore no pwd', async t => {
	const { deleteJsonStore } = require('./getOrPost');
	let A = 'deleteJsonStore';

	const res = await request(makeApp(deleteJsonStore, `${A}`, 'post').listen())
		.post(`/${A}`)
		.send({ name: 'name', pwd: '' })
		.then(res => {
			return res;
		});
	// res. from post jsonstore is object
	t.is(res['ok'], true);
});
