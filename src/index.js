import { resolve, isAbsolute, relative, dirname, join } from 'path';
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

const isStartsWithDot = (src) => /^\./.test(src);

const hasProcotol = (src) => /^(\w+:)?\/\//.test(src);

const replaceAt = (str, start, end, replacement) =>
	str.slice(0, start) + replacement + str.slice(end);

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
	caseSensitive: true,
	html5: true,
	removeComments: true,
	removeCommentsFromCDATA: true,
	removeCDATASectionsFromCDATA: true,
	collapseWhitespace: true,
	removeRedundantAttributes: true,
	removeEmptyAttributes: true,
	keepClosingSlash: true,
	removeScriptTypeAttributes: true,
	removeStyleLinkTypeAttributes: true,
};

export default function(content) {
	this.cacheable && this.cacheable();

	const callback = this.async();
	const {
		options: { context, output, target },
		_module = {},
		resourcePath,
	} = this;

	const options = getOptions(this) || {};
	const { resource } = _module;

	const hasIssuer = _module.issuer;
	const issuerContext = (hasIssuer && _module.issuer.context) || context;

	const {
		root = resolve(context, issuerContext),
		publicPath = output.publicPath || '',
		enforceRelativePath = false,
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
		...minimizeOptions
	} = options;

	const requests = [];
	const hasMinimzeConfig = typeof forceMinimize === 'boolean';
	const shouldMinimize = hasMinimzeConfig ? forceMinimize : this.minimize;

	const loadModule = (request) =>
		new Promise((resolve, reject) => {
			this.addDependency(request);
			this.loadModule(request, (err, src) => {
				/* istanbul ignore if */
				if (err) {
					reject(err);
				} else {
					resolve(src);
				}
			});
		});

	const xmlContent = `${ROOT_TAG_START}${content}${ROOT_TAG_END}`;

	const ensureStartsWithDot = (source) =>
		isStartsWithDot(source) ? source : `./${source}`;

	const ensureRelativePath = (source) => {
		const sourcePath = join(root, source);
		const resourceDirname = dirname(resourcePath);
		source = relative(resourceDirname, sourcePath).replace(/\\/g, '/');
		return ensureStartsWithDot(source);
	};

	const replaceRequest = async ({ request, startIndex, endIndex }) => {
		const module = await loadModule(request);
		let source = extract(module, publicPath);
		const isSourceAbsolute = isAbsolute(source);
		if (!isSourceAbsolute && !hasProcotol(source)) {
			source = ensureStartsWithDot(source);
		}
		if (enforceRelativePath && isSourceAbsolute) {
			source = ensureRelativePath(source);
		}

		/* istanbul ignore else */
		if (typeof transformUrl === 'function') {
			source = transformUrl(source, resource);
		}
		content = replaceAt(content, startIndex, endIndex, source);
	};

	const parser = sax.parser(false, { lowercase: true });

	parser.onattribute = ({ name, value }) => {
		if (
			!value ||
			!isSrc(name) ||
			isDynamicSrc(value) ||
			!isUrlRequest(value, root)
		) {
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

			/* istanbul ignore else */
			if (typeof format === 'function') {
				/* istanbul ignore else */
				if (!format.__warned) {
					format.__warned = true;
					console.warn(
						'[DEPRECATED]: wxml-loader `format` option has been deprecated.',
						'Please use `transformContent() instead`.'
					);
				}
				content = format(content, resource);
			} else if (typeof transformContent === 'function') {
				content = transformContent(content, resource);
			}

			if (shouldMinimize) {
				content = Minifier.minify(content, {
					...defaultMinimizeConf,
					...minimizeOptions,
				});
			}
			callback(null, content);
		} catch (err) {
			/* istanbul ignore next */
			callback(err, content);
		}
	};

	parser.write(xmlContent).close();
}
