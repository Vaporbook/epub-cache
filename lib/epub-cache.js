
var converter = require('epub2html');
var fs = require('fs');
var crypto = require('crypto');

var cacheDir = '/tmp';
var idLimit = 100;
var filters = [
	function (filename, data) {
		return data;
	}
]

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

}

module.exports.getParser = function () {

	return converter.getParser();

}

module.exports.has = function has (id)
{
	return fs.existsSync(basePath(id));
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
	var bundleJson = fs.readFileSync(getPathJson(cacheId)).toString();
	var bundle = JSON.parse(bundleJson);
	return bundle;
}

module.exports.cache = function cache (epubfile, cacheId, cb)
{

	console.log(arguments);

	if(typeof arguments[2] === 'undefined') {
		cb = cacheId;
		cacheId = null;
	}

	converter.parse(epubfile, function (err, epubData) {
		
		var htmlData = converter.convertMetadata(epubData);
	
		var files = converter.getFiles();
		var parser = converter.getParser();

		var hashid = epubData.easy.md5; //crypto.createHash('md5').update(fs.readFileSync(epubfile)).digest("hex");

		if(cacheId==null) {
			cacheId = hashid;
		}

/*cacheid+'|'+epubData.easy.primaryID.value+'|'+epubData.easy.primaryID.scheme;//getUid();*/


		console.log('cacheId set to '+cacheId);

		var basepath = basePath(cacheId);

		var pathjson = getPathJson(cacheId);


		try {
			
			console.log(basepath);

			fs.mkdirSync(basepath);

			for(file in files) {

				//console.log(files[file]);
				var path = basepath + files[file].name;

				try {
					if(files[file].options.dir) {
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


		} catch (e) { // already exists?
			
			console.log('path exists in cache, pulling json data...');
			var bundle = module.exports.getBundle(cacheId);

		}


		cb(cacheId, bundle);

	});

}
