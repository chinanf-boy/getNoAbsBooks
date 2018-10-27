import test from 'ava';

const request = require('supertest');

const T = 'https://m.zwdu.com/book/9623/';

function makeApp(func, route, method = 'get') {
	// Koa
	const Koa = require('koa');
	const router = require('koa-router')();
	const body = require('koa-body');

	const app = new Koa();
	// Console.log(`/${route}`, func)
	if (method) {
		router[method](`/${route}`, func);
	}
	// Middleware
	app.use(body());
	app.use(router.routes());
	app.use(router.allowedMethods());

	return app;
}

let J =
	'https://www.jsonstore.io/32bbb6aa2e294524b78a186f20433d70cd2839af2820a410ce10d65fe9338c39';

test.beforeEach('change JSONSTORE', t => {
	const { setJSONSTORE, getJSONSTORE } = require('./getOrPost');
	setJSONSTORE(J);

	t.is(getJSONSTORE(), J);
});

test(':get /api/getAllBooks', async t => {
	const { getAllBooks, getJSONSTORE } = require('./getOrPost');

	const res = await request(makeApp(getAllBooks, 'getAllBooks').listen())
		.get('/getAllBooks')
		.then(res => {
			return res;
		});
	// Res.text from get jsonstore is json
	t.is(res.ok, true);
});

test(':post /api/addJsonStore', async t => {
	const { addJsonStore } = require('./getOrPost');
	const A = 'addJsonStore';

	const res = await request(makeApp(addJsonStore, `${A}`, 'post').listen())
		.post(`/${A}`)
		.send({ url: T })
		.then(res => {
			return res;
		});
	// Res. from post jsonstore is object
	t.is(res.ok, true);
});

test.serial(':post /api/addBookTags', async t => {
	const { addBookTags } = require('./getOrPost');
	let A = 'addBookTags';

	const res = await request(makeApp(addBookTags, `${A}`, 'post').listen())
		.post(`/${A}`)
		.send({ url: T, title: 'test' })
		.then(res => {
			return res;
		});
	// res. from post jsonstore is object
	t.is(res.ok, true);
});

test.serial(':del /api/delBookTags', async t => {
	const { delBookTag } = require('./getOrPost');
	let A = 'delBookTag';

	const res = await request(makeApp(delBookTag, `${A}`, 'post').listen())
		.post(`/${A}`)
		.send({ url: T, title: 'test' })
		.then(res => {
			return res;
		});
	// res. from post jsonstore is object
	t.is(res.ok, true);
});

test(':post /api/getNoAbsBooks', async t => {
	const { getNoAbsBooks } = require('./getOrPost');
	const A = 'getNoAbsBooks';

	const res = await request(makeApp(getNoAbsBooks, `${A}`, 'post').listen())
		.post(`/${A}`)
		.send({ url: T })
		.then(res => {
			return res;
		});
	// Res. from post jsonstore is object
	t.is(res.ok, true);
});

test.failing(':post /api/delJsonStore no pwd', async t => {
	const { deleteJsonStore } = require('./getOrPost');
	const A = 'deleteJsonStore';

	const res = await request(makeApp(deleteJsonStore, `${A}`, 'post').listen())
		.post(`/${A}`)
		.send({ name: 'name', pwd: '' })
		.then(res => {
			return res;
		});
	// Res. from post jsonstore is object
	t.is(res.ok, true);
});
