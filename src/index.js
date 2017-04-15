
import { relative } from 'path';
import sax from 'sax';
import { isUrlRequest, urlToRequest, getOptions } from 'loader-utils';
import { readFileSync } from 'fs';

const isRelativeUrl = (url) => /^\.+\//.test(url);
const isSrc = (name) => name === 'src';
const noop = () => {};
const replaceAt = (str, start, end, replacement) =>
	str.slice(0, start) + replacement + str.slice(end)
;

export default function (content) {
	this.cacheable && this.cacheable();
	if (!this.emitFile) {
		throw new Error('emitFile is required from module system');
	}

	const callback = this.async();
	const {
		options: { context },
		context: resourceDir,
		resourcePath,
		_module,
	} = this;
	const options = getOptions(this) || {};

	const hasIssuer = _module && _module.issuer;
	const issuerContext = hasIssuer && _module.issuer.context || context;

	const {
		root = issuerContext,
	} = options;

	const urls = [];

	const emit = (dep, content) => {
		const filename = relative(issuerContext, dep);
		this.emitFile(filename, content || readFileSync(dep, 'utf8'));
	};

	const replace = ({ url, startIndex, endIndex }) =>
		content = replaceAt(content, startIndex, endIndex, url)
	;

	const parser = sax.parser(false, { lowercase: true });

	parser.onattribute = ({ name, value = '' }) => {
		if (!isSrc(name) || !isUrlRequest(value, root)) { return; }

		let url;

		if (isRelativeUrl(value)) {
			url = urlToRequest(value, resourceDir);
		}
		else {
			const endIndex = parser.position - 1;
			const startIndex = endIndex - value.length;
			const moduleUrl = urlToRequest(value, root);
			url = relative(resourceDir, moduleUrl);
			urls.unshift({ url, startIndex, endIndex });
		}

		this.loadModule(url, noop);
	};

	parser.onend = () => {
		urls.forEach(replace);
		emit(resourcePath, content);
		callback(null, '');
	};

	parser.write(content).close();
}
