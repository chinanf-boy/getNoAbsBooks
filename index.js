const fs = require('fs');
const path = require('path');
const URI = require('urijs');
const hashids = require('hashids');

const debug = require('debug')('getNoAbsBooks');

const superagent = require('superagent');
require('superagent-charset')(superagent);
const Koa = require('koa');
const cors = require('@koa/cors');
const body = require('koa-body');
const logger = require('koa-logger');
const router = require('koa-router')({
	prefix: '/api',
});
const static = require('koa-static')(path.resolve(__dirname, '.', 'dist'));
const { removeHttP } = require('./util'); //replaceAll

const PORT = process.env.PORT || 5000;
const JSONSTORE =
	process.env.JSONSTORE ||
	'https://www.jsonstore.io/4035ca03c1c8b0b257ef405506b41d05d4115ec154d95076981290ebd8087daf';

const ROOT_DIR = process.env.NODE_ENV === 'production' ? '/' : __dirname;

const app = new Koa();

// Routes definition
router.post('/getNoAbsBooks', getNoAbsBooks);
router.post('/addJsonStore', addJsonStore);

router.get('/getAllBooks', getAllBooks);

// router.get('/getNoAbsBooksA', getNoAbsBooksA)

// Middleware
app.use(cors());
app.use(body());
app.use(logger());
app.use(static);
app.use(router.routes());
app.use(router.allowedMethods());

app;
// Start server
app.listen(PORT);
console.log('* get 81 started on port %s', PORT);
console.log('* Output directory: %s', ROOT_DIR);

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

async function getNoAbsBooks(ctx) {
	try {
		let G = ctx.request.body;
		let U = G.url; // get url

		debug(`post: /getNoAbsBooks \n ${ctx.request.header} \n${G}`);

		let url = URI(U); // use urijs

		let resAgain = await superProGet(url.href());

		let cutAbs = resAgain.text.split('\n');
		let keep = false;

		cutAbs = cutAbs.filter(line => {
			// just need header - footer
			if (line.includes(`class="header"`)) {
				keep = true;
			} else if (line.includes(`class="footer"`)) {
				keep = false;
			}
			if (line.includes('script')) {
				return false;
			}
			return keep;
		});

		let removeHTML = cutAbs.map(div => {
			// remove url_file.*
			let h = url.suffix() || `html`;
			// "http://example.org/foo/hello.html" => 'html'

			h = `.${h}`; // html => .html

			if (div.includes(h)) {
				div = div.replaceAll(h, ``);
			}
			// change 首页
			if (div.includes(`首页`)) {
				// origin
				// "http://example.org/foo/hello.html" => 'http://example.org'
				div = div.replace(url.origin(), '/');
			}
			let reMove = ['字体', '关灯', '护眼', '>大<', '>小<', '>中<'];
			if (reMove.some(r => div.includes(r))) {
				div = '';
			}
			return div;
		});

		// make select element change work with $route
		let addJS = `onchange="
		 var A = document.createElement('a');
		 let href = window.location.href
		 if(window.location.href.includes('/index_')){
			let RmHrefIndex = window.location.href.lastIndexOf('/')
			href = href.substring(0, RmHrefIndex)
		 }
		 if(!href.endsWith('/')){
			href += '/'
		 }
		 A.href= href+options[selectedIndex].value;
		 console.log(A)
		 A.click();"
		 `;

		let addVueHref = removeHTML.map(div => {
			if (div.includes(`href="/book`)) {
				div = div.replaceAll(`href="/book`, `href="#/book`);
			}
			if (
				div.includes(
					`onchange="self.location.href=options[selectedIndex].value"`
				)
			) {
				div = div.replace(
					`onchange="self.location.href=options[selectedIndex].value"`,
					`${addJS} multiple style="width: 100%; height" `
				);
			}
			return div;
		});

		let resGood = addVueHref.join('\n');

		ctx.response.body = resGood;
	} catch (e) {
		console.error(' getNoAbsBooks error', ctx.request);
		ctx.response.body = e;
	}
}

//
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

async function getAllBooks(ctx) {
	try {
		let J = JSONSTORE + '/books';

		let res = await superProG(J);

		ctx.response.body = res.text;
	} catch (e) {
		console.error('\n> Could not obtain token\n' + e);
		process.exit(1);
	}
}

//
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

async function addJsonStore(ctx) {
	try {
		let G = ctx.request.body;
		let U = G.url;
		let url = new URI(U);

		// get http://example.com
		let source = url.origin();

		let name = await idGetName(url.href());

		let J = JSONSTORE + '/books/' + name;

		if (!name) {
			throw new Error('can not get Name');
		}

		let form = {
			id: URI.encode(url.href()),
			routeLink: url.pathname(),
			origin: url.origin(),
			url: url.href(),
			time: new Date().getTime(),
			name: name,
		};
		// console.log('addJSON ',form)
		let res = await superProP(J, form);
		ctx.response.body = res.text;
	} catch (error) {
		console.error('addJSONSTORE error', ctx.request);
		ctx.response.body = error;
	}
}

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

	return H;
}

//

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
