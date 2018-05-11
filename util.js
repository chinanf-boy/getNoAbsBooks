String.prototype.replaceAll = function(search, replacement) {
	var target = this;

	return target.replace(new RegExp(search, 'g'), replacement);
};

module.exports.removeHttP = function(U) {
	let url = U;
	url = url.slice(url.lastIndexOf('/') + 1);

	url = url.split('.').join('');

	return url;
};
