var URI = require('urijs');

var uri = new URI('http://example.org/book/哈哈.html');

log = console.log.bind(console);
// get filename
log(uri.href()); // returns string "hello.html" (no leading slash)

log(uri.suffix()); // returns string "hello.html" (no leading slash)
// set filename

log(URI.encode(uri.href()));

log(uri.pathname());
