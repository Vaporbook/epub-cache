
var converter = require('epub2html');
var fs = require('fs');
var crypto = require('crypto');

var cacheDir = '/tmp';
var idLimit = 100;
var filters = [
	function (data) {
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

function runFilterChain(data)
{
	for(var i = 0; i < filters.length; i++) {
		data = filters[i].apply(this, [data]);
	}
	return data;
}

module.exports.init = function init(config)
{

	cacheDir = config.cacheDir || cacheDir;
	idLimit = config.idLimit || idLimit;

}

module.exports.has = function has (id)
{
	return fs.existsSync(basePath(id));
}

module.exports.clear = function clear()
{
	// stub

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

		var hashid = epubData.easy.md5; //crypto.createHash('md5').update(fs.readFileSync(epubfile)).digest("hex");

		if(cacheId==null) {
			cacheId = hashid;
		}

/*cacheid+'|'+epubData.easy.primaryID.value+'|'+epubData.easy.primaryID.scheme;//getUid();*/


		console.log('cacheId set to '+cacheId);

		var basepath = basePath(cacheId);

		var pathjson = cacheDir+'/'+cacheId+'.json';


		try {
			fs.mkdirSync(basepath);
		} catch (e) { // already exists?
			;
		}

		for(file in files) {

			//console.log(files[file]);
			var path = basepath + files[file].name;

			try {
				if(files[file].data.length==0) {
					fs.mkdirSync(path);
				} else {

					var data = runFilterChain(files[file].data);

					fs.writeFileSync(path, data);

				}
			} catch(e) {
				//console.log(e);
			} 

		}
		delete epubData.raw.xml;
		var bundle = {
			epub: epubData,
			html: htmlData
		};

		fs.writeFileSync(pathjson, JSON.stringify(bundle));

		cb(cacheId, bundle);

	});

}
