const debug = require('debug')('getNoAbsBooks');
const cheerio = require('cheerio');
const URI = require('urijs'); // uri

const superagent = require('superagent');
require('superagent-charset')(superagent); // get gbk html

require('./util'); //replaceAll

const JSONSTORE =
	process.env.JSONSTORE ||
	'https://www.jsonstore.io/4035ca03c1c8b0b257ef405506b41d05d4115ec154d95076981290ebd8087daf';

// getNoAbsBooks tools
const superProGet = async url => {
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

// post: /getNoAbsBooks { url }
async function getNoAbsBooks(ctx) {
	try {
		let G = ctx.request.body;
		let U = G.url; // get url

		debug(`post: /getNoAbsBooks { url }\n ${ctx.request.header} \n${G}`);

		let url = new URI(U); // use urijs

		if (!url.origin()) {
			throw new TypeError(' post { url } no a type:url');
		}

		let resAgain = await superProGet(url.href());

		// console.log('source html', resAgain.text);
		debug(`post: /getNoAbsBooks \n use url get res`);

		let cutAbs = resAgain.text.split('\n');
		let keep = false;

		debug(`post: /getNoAbsBooks \n res.text -> cut Abs`);

		cutAbs = cutAbs.filter(line => {
			// just need header - footer
			if (line.includes(`class="header"`) || line.includes(`class="mmmlink"`)) {
				keep = true;
			} else if (line.includes(`class="footer"`)) {
				keep = false;
			}

			return keep;
		});

		debug(`post: /getNoAbsBooks \n res.text remove uri.suffix()`);

		let removeHTML = cutAbs.map(div => {
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
				// origin
				// "http://example.org/foo/hello.html" => 'http://example.org'
				div = div.replace(url.origin(), '#/');

				if (div.includes(`href="/"`)) {
					div = div.replace(`href="/"`, `href="#/"`);
				}
			}
			// 上下页
			let addPage = `onclick="pageButton(this)"
			`;
			if (div.includes(`上一页`) || div.includes(`下一页`)) {
				if (div.includes('href=')) {
					div = div.replaceAll('href="', ` ${addPage} href="`);
				}
			}

			let reMove = [
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

		let addJS = `onchange="SelectJs(this)"`;

		let addVueHref = removeHTML.map(div => {
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

		let resGood = addVueHref.join('\n');

		// console.log('cut html', resGood);

		ctx.response.body = resGood;
	} catch (e) {
		console.error(' getNoAbsBooks error', e.status);
		ctx.response.status = e.status;
		ctx.response.body = e.message;
	}
}

// getAllBooks tools
const superProG = async url => {
	return new Promise((ok, bad) => {
		superagent.get(url).end((err, res) => {
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
		let J = JSONSTORE + '/books';

		let res = await superProG(J);

		debug(`get: /getAllBooks
		get all books form jsonStore `);

		ctx.response.body = res.text;
	} catch (e) {
		console.error('\n> Could not obtain token\n' + e);
		ctx.response.status = e.status;
		ctx.response.body = e.message;
	}
}

// delete: deleteJsonStore
async function deleteJsonStore(ctx) {
	try {
		let G = ctx.request.body;
		let U = G.name;
		let pwd = G.pwd;

		if (pwd != 'yobrave') {
			// need pwd
			throw new TypeError('get error pwd');
		}

		let url = JSONSTORE + '/books/';

		url = url + U;

		let res = await superProD(url);

		debug(`delete: /deleteJsonStore
		delete book with name and pwd `);

		ctx.response.body = res.text;
	} catch (error) {
		console.error('\n> Could not delete\n' + error);
		ctx.response.status = error.status || 404;
		ctx.response.body = error.message;
	}
}

// deleteJsonStore tools
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

// addJsonStore tools
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
async function addJsonStore(ctx) {
	try {
		let G = ctx.request.body;
		let U = G.url;
		let url = new URI(U);

		if (url.is('url') !== true) {
			throw new TypeError(' post { url } no a type:url');
		}

		// get http://example.com
		let source = url.origin();

		debug(`post: /addJsonStore { url }
		get bookName form url `);
		let name = await idGetName(url.href());

		if (!name) {
			throw new Error('can not get book Name');
		}

		name = encodeURI(name);

		let J = JSONSTORE + '/books/' + name;

		debug(`post: /addJsonStore { url }
		make >form< ready Up jsonstore `);
		let form = {
			id: URI.encode(url.href()),
			routeLink: url.pathname(),
			origin: url.origin(),
			url: url.href(),
			time: new Date().getTime(),
			name: name,
		};

		debug(`post: /addJsonStore { url }
		Up jsonstore with books/>bookName</form`);
		let res = await superProP(J, form);
		ctx.response.body = res.text;
	} catch (error) {
		console.error('addJSONSTORE error', error);
		ctx.response.status = error.status || 405;
		ctx.response.body = error.message;
	}
}

// addJSONSTORE tools
async function idGetName(url) {
	// console.log('add',U)
	let H = await superSource(url)
		.then(res => {
			return res.text
				.split('\n')
				.filter(x => x.includes('bqgmb_h1'))
				.join('');
		})
		.catch(err => '');
	// console.log(H)

	H = H.slice(H.lastIndexOf('1">') + 3, -6);

	return H.trim();
}

// idGetName tools
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
};
