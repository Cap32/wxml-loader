
import { resolve } from 'path';
import sax from 'sax';
import { Script } from 'vm';
import Minifier from 'html-minifier';
import { isUrlRequest, urlToRequest, getOptions } from 'loader-utils';

const ROOT_TAG_NAME = 'xxx-wxml-root-xxx';
const ROOT_TAG_START = `<${ROOT_TAG_NAME}>`;
const ROOT_TAG_END = `</${ROOT_TAG_NAME}>`;
const ROOT_TAG_LENGTH = ROOT_TAG_START.length;

const isSrc = (name) => name === 'src';

const isDynamicSrc = (src) => /\{\{/.test(src);

const replaceAt = (str, start, end, replacement) =>
	str.slice(0, start) + replacement + str.slice(end)
;

const extract = (src, __webpack_public_path__) => {
	const script = new Script(src, { displayErrors: true });
	const sandbox = {
		__webpack_public_path__,
		module: {},
	};
	script.runInNewContext(sandbox);
	return sandbox.module.exports.toString();
};

const defaultMinimizeConf = {
	html5: false,
	removeComments: true,
	removeCommentsFromCDATA: true,
	removeCDATASectionsFromCDATA: true,
	collapseWhitespace: true,
	collapseBooleanAttributes: true,
	removeRedundantAttributes: true,
	removeEmptyAttributes: true,
	keepClosingSlash: true,
	removeScriptTypeAttributes: true,
	removeStyleLinkTypeAttributes: true,
};

export default function (content) {
	this.cacheable && this.cacheable();

	const callback = this.async();
	const {
		options: { context, output, target },
		_module = {},
	} = this;
	const options = getOptions(this) || {};
	const { resource } = _module;

	const hasIssuer = _module.issuer;
	const issuerContext = hasIssuer && _module.issuer.context || context;

	const {
		root = resolve(context, issuerContext),
		publicPath = output.publicPath || '',
		format,
		transformContent = (content) => {
			switch (target.name) {
				case 'Alipay':
					return content.replace(/\bwx:/g, 'a:');
				case 'Wechat':
					return content.replace(/\ba:/g, 'wx:');
				default:
					return content;
			}
		},
		transformUrl = (url) => {
			switch (target.name) {
				case 'Alipay':
					return url.replace(/\.wxml$/g, '.axml');
				case 'Wechat':
					return url.replace(/\.axml$/g, '.wxml');
				default:
					return url;
			}
		},
		minimize: forceMinimize,
		...minimizeOptions,
	} = options;

	const requests = [];
	const hasMinimzeConfig = typeof forceMinimize === 'boolean';
	const shouldMinimize = hasMinimzeConfig ? forceMinimize : this.minimize;

	const loadModule = (request) => new Promise((resolve, reject) => {
		this.addDependency(request);
		this.loadModule(request, (err, src) => {
			if (err) { reject(err); }
			else { resolve(src); }
		});
	});

	const xmlContent = `${ROOT_TAG_START}${content}${ROOT_TAG_END}`;

	const replaceRequest = async ({ request, startIndex, endIndex }) => {
		const src = await loadModule(request);
		let url = extract(src, publicPath);
		if (typeof transformUrl === 'function') {
			url = transformUrl(url, resource);
		}
		content = replaceAt(content, startIndex, endIndex, url);
	};

	const parser = sax.parser(false, { lowercase: true });

	parser.onattribute = ({ name, value = '' }) => {
		if (!isSrc(name) || isDynamicSrc(value) || !isUrlRequest(value, root)) {
			return;
		}

		const endIndex = parser.position - 1 - ROOT_TAG_LENGTH;
		const startIndex = endIndex - value.length;
		const request = urlToRequest(value, root);

		requests.unshift({ request, startIndex, endIndex });
	};

	parser.onend = async () => {
		try {
			for (const req of requests) {
				await replaceRequest(req);
			}

			if (typeof transformContent === 'function') {
				content = transformContent(content, resource);
			}

			if (typeof format === 'function') {
				if (!format.__warned) {
					format.__warned = true;
					console.warn(
						'[DEPRECATED]: wxml-loader `format` option has been deprecated.',
						'Please use `transformContent() instead`.',
					);
				}
				content = format(content, resource);
			}

			if (shouldMinimize) {
				content = Minifier.minify(content, {
					...defaultMinimizeConf,
					...minimizeOptions,
				});
			}
			callback(null, content);
		}
		catch (err) {
			callback(err, content);
		}
	};

	parser.write(xmlContent).close();
}
