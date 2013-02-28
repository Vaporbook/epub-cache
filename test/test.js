var cacher = require('../lib/epub-cache');

if(!process.argv[2]) {
  throw "You must supply a path to a valid EPUB file!";
}

// 1. init the cache

cacher.init({

	cacheDir: './test-cache',
	idLimit: 100

});

console.log('clearing cache...');

try {
	cacher.clear();
	console.log('SUCCESS: cleared');
} catch(e) {
	console.log('ERROR clearing cache');
}

// 2. cache epub contents and get a cache id back

var epubfile = process.argv[2] || './testbook.epub';

if(typeof epubfile === 'undefined') throw "You must provide an epub filename.";
var cacheId = (new Date()).getTime();
cacher.cache(epubfile, cacheId, function (err, cacheId, bundle) {

	if(err) throw err;

	console.log('cached epub file '+epubfile+'. cacheId is '+cacheId);

	// 3. see if the cacheId exists

	console.log('testing the cacher.has() method... should find in cache');

	if(cacher.has(cacheId)) {

		console.log('SUCCESS: found cached id '+cacheId+' in cache');

	}


});

console.log('testing to see if we pull from cache the second time...');

cacher.cache(epubfile, cacheId, function (err, cacheId, bundle) {

	if(err) throw err;

	console.log('cached epub file '+epubfile+'. cacheId is '+cacheId);


});






