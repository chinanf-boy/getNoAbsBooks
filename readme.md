# getnoabsbooks [![Build Status](https://travis-ci.org/chinanf-boy/getnoabsbooks.svg?branch=master)](https://travis-ci.org/chinanf-boy/getnoabsbooks) [![codecov](https://codecov.io/gh/chinanf-boy/getnoabsbooks/badge.svg?branch=master)](https://codecov.io/gh/chinanf-boy/getnoabsbooks?branch=master)

> koa 👋 heroku : get no abs books

## Install

```
git clone project
```

## HeroKu

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Usage

```js
node index.js
```

---

## router

1.  `:get` - `/api/getAllBooks`

2.  `:post` { url } - `/api/getNoAbsBooks`

> request url, cut the Abs, return the html:string

3.  `:post` { url } - `/api/addJsonStore`

> add JsonStore-API **/books/chinaBookName/form**

> form

```js
let form = {
	id: URI.encode(url.href()),
	routeLink: url.pathname(),
	origin: url.origin(),
	url: url.href(),
	time: new Date().getTime(),
	name: name,
};
```

---

## License

MIT © [chinanf-boy](http://llever.com)
