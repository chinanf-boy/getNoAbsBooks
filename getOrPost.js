const debug = require('debug')('getNoAbsBooks');
const cheerio = require('cheerio');
const URI = require('urijs'); // Uri

const superagent = require('superagent');
require('superagent-charset')(superagent); // Get gbk html

require('./util'); // ReplaceAll

let JSONSTORE =
	process.env.JSONSTORE ||
	'https://www.jsonstore.io/4035ca03c1c8b0b257ef405506b41d05d4115ec154d95076981290ebd8087daf';

const TIMEOUT = 8000;

function setJSONSTORE(s) {
	JSONSTORE = s;
}

function getJSONSTORE() {
	return JSONSTORE;
}

// GetNoAbsBooks tools
const superProGet = url => {
	return new Promise((ok, bad) => {
		superagent
			.get(url)
			.timeout({
				response: TIMEOUT,
			})
			.charset('gbk')
			.end((err, res) => {
				if (!err) {
					ok(res);
				}
				bad(err);
			});
	});
};

// Post: /getNoAbsBooks { url }
async function getNoAbsBooks(ctx) {
	try {
		const G = ctx.request.body;
		const U = G.url; // Get url

		debug(`post: /getNoAbsBooks { url }\n ${ctx.request.header} \n${G}`);

		const url = new URI(U); // Use urijs

		if (!url.origin()) {
			throw new TypeError(' post { url } no a type:url');
		}

		const resAgain = await superProGet(url.href());

		// Console.log('source html', resAgain.text);
		debug(`post: /getNoAbsBooks \n use url get res`);

		let cutAbs = resAgain.text.split('\n');
		let keep = false;

		debug(`post: /getNoAbsBooks \n res.text -> cut Abs`);

		cutAbs = cutAbs.filter(line => {
			// Just need header - footer
			if (line.includes(`class="header"`) || line.includes(`class="mmmlink"`)) {
				keep = true;
			} else if (line.includes(`class="footer"`)) {
				keep = false;
			}

			return keep;
		});

		debug(`post: /getNoAbsBooks \n res.text remove uri.suffix()`);

		const removeHTML = cutAbs.map(div => {
			// // remove url_file.*
			// let h = url.suffix() || `html`;
			// // "http://example.org/foo/hello.html" => 'html'

			// h = `.${h}`; // html => .html

			// if (div.includes(h)) {
			// 	div = div.replaceAll(h, ``);
			// }
			// change 首页
			debug(`post: /getNoAbsBooks \n res.text remove fontSize color set`);

			if (div.includes(`首页`)) {
				// Origin
				// "http://example.org/foo/hello.html" => 'http://example.org'
				div = div.replace(url.origin(), '#/');

				if (div.includes(`href="/"`)) {
					div = div.replace(`href="/"`, `href="#/"`);
				}
			}
			// 上下页
			const addPage = `onclick="pageButton(this)"
			`;
			if (div.includes(`上一页`) || div.includes(`下一页`)) {
				if (div.includes('href=')) {
					div = div.replaceAll('href="', ` ${addPage} href="`);
				}
			}

			const reMove = [
				'字体',
				'关灯',
				'护眼',
				'>大<',
				'>小<',
				'>中<',
				'form>',
				'input>',
				'button>',
			];
			if (reMove.some(r => div.includes(r))) {
				div = '';
			}
			if (div.includes('加入书架')) {
				div = div.replace('加入书架', ``);
			}

			return div;
		});

		debug(`post: /getNoAbsBooks
		 create JS: make select element change work with $route`);

		const addJS = `onchange="SelectJs(this)"`;

		const addVueHref = removeHTML.map(div => {
			if (div.includes(`href="/`)) {
				debug(`post: /getNoAbsBooks
				change / => #/`);
				div = div.replaceAll(`href="/`, `href="#/${url.origin()}/`);
			}
			if (
				div.includes(
					`onchange="self.location.href=options[selectedIndex].value"`
				)
			) {
				debug(`post: /getNoAbsBooks
				add select onchange listen And remove old`);
				div = div.replace(
					`onchange="self.location.href=options[selectedIndex].value"`,
					`${addJS} style="width: 50%; height:auto" `
				);
			}
			return div;
		});

		debug(`post: /getNoAbsBooks
		Done with get no abs book response html`);

		const resGood = addVueHref.join('\n');

		// Console.log('cut html', resGood);

		ctx.response.body = resGood;
	} catch (e) {
		console.error(' getNoAbsBooks error', e.status);
		ctx.response.status = e.status;
		ctx.response.body = e.message;
	}
}

// GetAllBooks tools
const superProG = async url => {
	return new Promise((ok, bad) => {
		superagent
			.get(url)
			.timeout({
				response: TIMEOUT,
			})
			.end((err, res) => {
				if (!err) {
					ok(res);
				}
				bad(err);
			});
	});
};

/**
 * @description get: /getAllBooks 「get all books form jsonStore」
 * @param {any} ctx
 * @returns {string|json}
 */
async function getAllBooks(ctx) {
	try {
		let J = JSONSTORE;

		const res = await superProG(J);

		debug(`get: /getAllBooks
		get all books + booktags form jsonStore `);

		ctx.response.body = res.text;
	} catch (e) {
		console.error('\n> Could not obtain token\n' + e);
		ctx.response.status = e.status;
		ctx.response.body = e.message;
	}
}

// AddJsonStore tools
const superProP = async (url, form) => {
	return new Promise((ok, bad) => {
		superagent
			.post(url)
			.send(form)
			.end((err, res) => {
				if (!err) {
					ok(res);
				}
				bad(err);
			});
	});
};

/**
 * @description post: /addJsonStore { url } get bookName form url
 * @param {url} ctx.request.body.url
 * @returns {any}
 */
async function addBookTags(ctx) {
	try {
		const G = ctx.request.body;
		const U = G.url;
		const title = G.title;
		// Get book name
		let bookName = '';
		if (title.indexOf('>') >= 0) {
			bookName = title.slice(0, title.indexOf('>')).trim();
		}
		bookName = URI.encode(bookName);

		const url = new URI(U);

		if (url.is('url') !== true) {
			throw new TypeError(' post { url } no a type:url');
		}

		// Get http://example.com
		const source = url.origin();

		debug(`post: /addBookTags { url }
		get bookName form url `);

		const TAG = bookName || URI.encode(title);
		const J = JSONSTORE + '/booktags/' + TAG;

		debug(`post: /addBookTags { url }
		make >form< ready Up jsonstore `);
		const form = {
			id: URI.encode(url.href()),
			routeLink: url.pathname(),
			origin: url.origin(),
			url: url.href(),
			time: new Date().getTime(),
			name: bookName,
			title,
		};

		debug(`post: /addBookTags { url }
		Up jsonstore with booktags/url.origin/form`);
		const res = await superProP(J, form);
		ctx.response.body = res.text;
	} catch (error) {
		console.error('addBookTags error', error);
		ctx.response.status = error.status || 405;
		ctx.response.body = error.message;
	}
}

// Delete: deleteJsonStore
async function deleteJsonStore(ctx) {
	try {
		const G = ctx.request.body;
		const U = G.name;
		const pwd = G.pwd;

		if (pwd != 'yobrave') {
			// Need pwd
			throw new TypeError('get error pwd');
		}

		let url = JSONSTORE + '/books/';

		url += U;

		const res = await superProD(url);

		debug(`delete: /deleteJsonStore
		delete book with name and pwd `);

		ctx.response.body = res.text;
	} catch (error) {
		console.error('\n> Could not delete\n' + error);
		ctx.response.status = error.status || 404;
		ctx.response.body = error.message;
	}
}

// DeleteJsonStore tools
const superProD = async url => {
	return new Promise((ok, bad) => {
		superagent.delete(url).end((err, res) => {
			if (!err) {
				ok(res);
			}
			bad(err);
		});
	});
};

/**
 * @description post: /addJsonStore { url } get bookName form url
 * @param {url} ctx.request.body.url
 * @returns {any}
 */
async function delBookTag(ctx) {
	try {
		const G = ctx.request.body;
		const U = G.url;
		const title = G.title;
		// Get book name
		let bookName = '';
		if (title.indexOf('>') >= 0) {
			bookName = title.slice(0, title.indexOf('>')).trim();
		}
		bookName = URI.encode(bookName);

		debug(`POST: /delBookTag { bookName }
		get bookName form url `);

		const TAG = bookName || URI.encode(title);
		const J = JSONSTORE + '/booktags/' + TAG;

		const res = await superProD(J);

		debug(`POST: /delBookTag done `);

		ctx.response.body = res.text;
	} catch (error) {
		console.error('delBookTag error', error);
		ctx.response.status = error.status || 405;
		ctx.response.body = error.message;
	}
}

/**
 * @description post: /addJsonStore { url } get bookName form url
 * @param {url} ctx.request.body.url
 * @returns {any}
 */
async function addJsonStore(ctx) {
	try {
		const G = ctx.request.body;
		const U = G.url;
		const url = new URI(U);

		if (url.is('url') !== true) {
			throw new TypeError(' post { url } no a type:url');
		}

		// Get http://example.com
		const source = url.origin();

		debug(`post: /addJsonStore { url }
		get bookName form url `);
		let name = await idGetName(url.href());

		if (!name) {
			throw new Error('can not get book Name');
		}

		name = encodeURI(name);

		const J = JSONSTORE + '/books/' + name;

		debug(`post: /addJsonStore { url }
		make >form< ready Up jsonstore `);
		const form = {
			id: URI.encode(url.href()),
			routeLink: url.pathname(),
			origin: url.origin(),
			url: url.href(),
			time: new Date().getTime(),
			name,
		};

		debug(`post: /addJsonStore { url }
		Up jsonstore with books/>bookName</form`);
		const res = await superProP(J, form);
		ctx.response.body = res.text;
	} catch (error) {
		console.error('addJSONSTORE error', error);
		ctx.response.status = error.status || 405;
		ctx.response.body = error.message;
	}
}

// AddJSONSTORE tools
async function idGetName(url) {
	// Console.log('add',U)
	let H = await superSource(url)
		.then(res => {
			return res.text
				.split('\n')
				.filter(x => x.includes('bqgmb_h1'))
				.join('');
		})
		.catch(err => '');
	// Console.log(H)

	H = H.slice(H.lastIndexOf('1">') + 3, -6);

	return H.trim();
}

// IdGetName tools
const superSource = async url => {
	return new Promise((ok, bad) => {
		superagent
			.get(url)
			.charset('gbk')
			.end((err, res) => {
				if (!err) {
					ok(res);
				}
				bad(err);
			});
	});
};

module.exports = {
	getNoAbsBooks,
	getAllBooks,
	addJsonStore,
	deleteJsonStore,
	addBookTags,
	delBookTag,
	getJSONSTORE,
	setJSONSTORE, // for test
};
