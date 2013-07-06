
var converter = require('epub2html');
var fs = require('fs');
var crypto = require('crypto');
var db = {};

var cacheDir, epubdb={}, epubdbPath;
var idLimit = 100;

// the filter chain idea may get deprecated
// it seems better suited for higher in the stack
// such as at the controller level of an application
// when the response can be modified on its way out the door

var filters = [
	function (filename, data) {
		return data;
	}
];

function getUid()
{
	var current_date = (new Date()).valueOf().toString();
	var random = Math.random().toString();
	return crypto.createHash('sha1').update(current_date + random).digest('hex');
}

function getHashId()
{

}

function basePath(id)
{
	return cacheDir +'/' + id + '/';
}

function runFilterChain(filename, data)
{
	for(var i = 0; i < filters.length; i++) {
		data = filters[i].apply(this, [filename, data]);
	}
	return data;
}

function getPathJson(cacheId) {
	return cacheDir+'/'+cacheId+'.json';
}

module.exports.init = function init(config)
{
	
	cacheDir = config.cacheDir || cacheDir;
	idLimit = config.idLimit || idLimit;

	console.log('cacheDir set by epub-cache module to '+cacheDir);


}


module.exports.has = function has (id, cb)
{
	if(typeof arguments[1]==='function') {
		fs.exists(basePath(id), cb);
	} else {
		return fs.existsSync(basePath(id));
	}
}

module.exports.clear = function clear()
{
	var rmDir = function(dirPath) {
	      try { var files = fs.readdirSync(dirPath); }
	      catch(e) { return; }
	      if (files.length > 0) {
	        for (var i = 0; i < files.length; i++) {
	          var filePath = dirPath + '/' + files[i];
	          if (fs.statSync(filePath).isFile()) {
	            fs.unlinkSync(filePath);
	          } else {
	            rmDir(filePath);
	          }
	      	}
	      }
	      fs.rmdirSync(dirPath);
	 };

	try { var files = fs.readdirSync(cacheDir); }
	catch(e) { return; }
	if (files.length > 0) {
        for (var i = 0; i < files.length; i++) {
          var filePath = cacheDir + '/' + files[i];
          if (fs.statSync(filePath).isFile()) {
          	console.log('removing file '+filePath);
            fs.unlinkSync(filePath);
          } else {
          	console.log('removing '+filePath);
            rmDir(filePath);
          }
        }
	}
}

module.exports.getBundle = function getBundle(cacheId) {
	console.log('getting bundle for '+cacheId);
	var bundleJson = fs.readFileSync(getPathJson(cacheId)).toString();
	var bundle = JSON.parse(bundleJson);
	return bundle;
}

module.exports.cache = function cache (epubfile, cacheId, cb)
{
	
	/* 

		
		epubfile should be valid full local path, full URL, or Buffer object
		

	*/

	console.log('epub-cache #cache() called with explicit cacheId of '+cacheId);
	if(typeof cacheId === 'undefined' || typeof cacheId === 'function') throw new Error("cacheId must be explicitly passed as second argument but is not correctly defined");

	// if it exists already, we should retrieve from the cacheId instead
	if(cacheId && module.exports.has(cacheId)) {

		console.log('already cached...');
		return cb(null,cacheId, module.exports.getBundle(cacheId));

	}

	// cache it

	converter.parse(epubfile, function (err, epubData) {
	
		if(err) return cb(err);
		if(!epubData) return cb(new Error("No epub data found"));
		var htmlData = converter.convertMetadata(epubData);
		var files = converter.getFiles();
		var parser = converter.getParser();
		var hashid = epubData.easy.md5; //crypto.createHash('md5').update(fs.readFileSync(epubfile)).digest("hex");
		if(cacheId==null) {
			cacheId = hashid;
		}
		var basepath = basePath(cacheId);
		var pathjson = getPathJson(cacheId);

		if(module.exports.has(cacheId)) {

			return cb(null,cacheId, module.exports.getBundle(cacheId));

		}
		

/*cacheid+'|'+epubData.easy.primaryID.value+'|'+epubData.easy.primaryID.scheme;//getUid();*/



		console.log('basepath for cacheId is:'+basepath);

		fs.mkdirSync(basepath);

		for(file in files) {

			//console.log(files[file]);
			var path = basepath + files[file].name;

			//console.log(files[file]);

			try {

				if(files[file].options.dir
				   		/* Add a condition to work around erroneous dir reporting */
				   		||  ( files[file].data===''&&files[file].name.match(/\/$/) )
				   ) {

					// THIS IS RETURNING FALSE ERRONEOUSLY!!!

					fs.mkdirSync(path);


				} else {


					if(file.match(/\.(html|xml|htm|css|js|txt|xhtml)$/)) {
						var data = runFilterChain(file, parser.extractText(file));
						fs.writeFileSync(path, data);
					} else {
						var data = parser.extractBinary(file);
						fs.writeFileSync(path, data, 'binary');
					}


				}
			} catch(e) {
				console.log(e);
			} 

		}
		
		delete epubData.raw.xml;

		var bundle = {
			epub: epubData,
			html: htmlData
		};

		fs.writeFileSync(pathjson, JSON.stringify(bundle));

		return cb(null,cacheId, bundle);

	}); // end converter.parse


}

module.exports.getParser = function () {

	return converter.getParser();

}
