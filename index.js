const fs = require('fs');
const path = require('path');
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
require('./util'); //replaceAll

const PORT = process.env.PORT || 5000;
const ROOT_DIR = process.env.NODE_ENV === 'production' ? '/' : __dirname;

const app = new Koa();

// Routes definition
router.post('/getNoAbsBooks', getNoAbsBooks);
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
		let U = G.Url;
		let resAgain = await superProGet(U);

		let cutAbs = resAgain.text.split('\n');
		let keep = false;
		cutAbs = cutAbs.filter(line => {
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
			if (div.includes(`.html`)) {
				div = div.replaceAll(`.html`, ``);
			}
			// if(div.includes(`option value`)){
			// 	div = div.replaceAll()
			// }
			return div;
		});

		let addVueHref = removeHTML.map(div => {
			if (div.includes(`href="/book`)) {
				div = div.replaceAll(`href="/book`, `href="#/book`);
			}
			return div;
		});

		let resGood = addVueHref.join('\n');

		let addJsOnchange = `<script>
		function C(event){

		}
		</script>`;

		ctx.response.body = resGood;
	} catch (e) {
		console.error('\n> Could not obtain token\n' + e);
		process.exit(1);
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
		let JSONSTORE =
			'https://www.jsonstore.io/4035ca03c1c8b0b257ef405506b41d05d4115ec154d95076981290ebd8087daf';
		JSONSTORE = JSONSTORE + '/books';

		let res = await superProG(JSONSTORE);

		ctx.response.body = res.text;
	} catch (e) {
		console.error('\n> Could not obtain token\n' + e);
		process.exit(1);
	}
}
