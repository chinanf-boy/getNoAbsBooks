const URI = require('urijs');

const uri = new URI('http://example.org/book/哈哈.html');

log = console.log.bind(console);
// Get filename
log(uri.href()); // Returns string "hello.html" (no leading slash)

log(uri.suffix()); // Returns string "hello.html" (no leading slash)
// set filename

log(URI.encode(uri.href()));

log(uri.pathname());
