var cacher = require('../lib/epub-cache');

if(!process.argv[2]) {
  throw "You must supply a path to a valid EPUB file!";
}

// 1. init the cache - older sub-folders that exceed limit will be purged

cacher.init({

	cacheDir: '/Users/asm/testcache',
	idLimit: 100

});


// 2. cache epub contents and get a cache id back

var epubfile = process.argv[2];

if(typeof epubfile === 'undefined') throw "You must provide an epub filename.";

cacher.cache(epubfile, function (cacheId) {

	console.log('cached epub file '+epubfile+'. cacheId is '+cacheId);

	// 3. see if the cacheId exists

	if(cacher.has(cacheId)) {

		console.log('found cached id '+cacheId+' in cache');

	}

	// 4. cache it as a different id this time
	cacher.cache(epubfile, 'foobar7', function (cacheId) {

		console.log('cached epub file '+epubfile+'. cacheId is '+cacheId);


	});


});
