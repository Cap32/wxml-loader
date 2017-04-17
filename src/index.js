
import { resolve } from 'path';
import sax from 'sax';
import { Script } from 'vm';
import Minimize from 'minimize';
import { isUrlRequest, urlToRequest, getOptions } from 'loader-utils';

const isSrc = (name) => name === 'src';
const isRelative = (url) => /^\.+\//.test(url);
const replaceAt = (str, start, end, replacement) =>
	str.slice(0, start) + replacement + str.slice(end)
;

const extract = (src) => {
	const script = new Script(src, { displayErrors: true });
	const sandbox = {
		__webpack_public_path__: '',
		module: {},
	};
	script.runInNewContext(sandbox);
	return sandbox.module.exports.toString();
};

const defaultMinimizeConf = {
	empty: true,
	quotes: true,
	dom: { recognizeSelfClosing: true, },
};

export default function (content) {
	this.cacheable && this.cacheable();

	const callback = this.async();
	const {
		options: { context, output },
		context: resourceDir,
		_module,
	} = this;
	const options = getOptions(this) || {};

	const hasIssuer = _module && _module.issuer;
	const issuerContext = hasIssuer && _module.issuer.context || context;

	const {
		root = resolve(context, issuerContext),
		publicPath = output.publicPath || '/',
		minimize: forceMinimize,
		...minimizeOptions,
	} = options;

	const requests = [];
	const hasMinimzeConfig = typeof forceMinimize === 'boolean';
	const shouldMinimize = hasMinimzeConfig ? forceMinimize : this.minimize;

	const minimize = (content) =>
		new Minimize({ ...defaultMinimizeConf, ...minimizeOptions }).parse(content)
	;

	const loadModule = (request) => new Promise((done, reject) => {
		if (isRelative(request)) {
			request = resolve(resourceDir, request);
		}
		this.addDependency(request);
		this.loadModule(request, (err, src) => {
			if (isRelative(request)) { request = resolve(resourceDir, request); }
			if (err) { reject(err); }
			else { done(src); }
		});
	});

	const replace = async ({ request, startIndex, endIndex }) => {
		const src = await loadModule(request);
		const url = extract(src);
		const replacement = isRelative(url) ? url : publicPath + url;
		content = replaceAt(content, startIndex, endIndex, replacement);
	};

	const parser = sax.parser(false, { lowercase: true });

	parser.onattribute = ({ name, value = '' }) => {
		if (!isSrc(name) || !isUrlRequest(value, root)) { return; }

		const endIndex = parser.position - 1;
		const startIndex = endIndex - value.length;
		const request = urlToRequest(value, root);
		requests.unshift({ request, startIndex, endIndex });
	};

	parser.onend = async () => {
		try {
			await Promise.all(requests.map(replace));
			if (shouldMinimize) { content = minimize(content); }
			callback(null, content);
		}
		catch (err) {
			callback(err, content);
		}
	};

	parser.write(content).close();
}
