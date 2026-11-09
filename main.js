const { Modal, Platform, Plugin, MarkdownRenderer, Component, TFolder, setIcon, Notice, getFrontMatterInfo, parseYaml, stringifyYaml } = require("obsidian");
// BEGIN BUNDLED YAML (ISC; see assets/yaml-LICENSE.txt)
const preservingYaml = (() => {
const modules = [function(module,exports,load){
'use strict';

var composer = load(1);
var Document = load(5);
var Schema = load(23);
var errors = load(48);
var Alias = load(6);
var identity = load(3);
var Pair = load(14);
var Scalar = load(13);
var YAMLMap = load(25);
var YAMLSeq = load(28);
var cst = load(64);
var lexer = load(68);
var lineCounter = load(69);
var parser = load(70);
var publicApi = load(71);
var visit = load(4);



exports.Composer = composer.Composer;
exports.Document = Document.Document;
exports.Schema = Schema.Schema;
exports.YAMLError = errors.YAMLError;
exports.YAMLParseError = errors.YAMLParseError;
exports.YAMLWarning = errors.YAMLWarning;
exports.Alias = Alias.Alias;
exports.isAlias = identity.isAlias;
exports.isCollection = identity.isCollection;
exports.isDocument = identity.isDocument;
exports.isMap = identity.isMap;
exports.isNode = identity.isNode;
exports.isPair = identity.isPair;
exports.isScalar = identity.isScalar;
exports.isSeq = identity.isSeq;
exports.Pair = Pair.Pair;
exports.Scalar = Scalar.Scalar;
exports.YAMLMap = YAMLMap.YAMLMap;
exports.YAMLSeq = YAMLSeq.YAMLSeq;
exports.CST = cst;
exports.Lexer = lexer.Lexer;
exports.LineCounter = lineCounter.LineCounter;
exports.Parser = parser.Parser;
exports.parse = publicApi.parse;
exports.parseAllDocuments = publicApi.parseAllDocuments;
exports.parseDocument = publicApi.parseDocument;
exports.stringify = publicApi.stringify;
exports.visit = visit.visit;
exports.visitAsync = visit.visitAsync;

},
function(module,exports,load){
'use strict';

var node_process = ({env:{}});
var directives = load(2);
var Document = load(5);
var errors = load(48);
var identity = load(3);
var composeDoc = load(49);
var resolveEnd = load(59);

function getErrorPos(src) {
    if (typeof src === 'number')
        return [src, src + 1];
    if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
    const { offset, source } = src;
    return [offset, offset + (typeof source === 'string' ? source.length : 1)];
}
function parsePrelude(prelude) {
    let comment = '';
    let atComment = false;
    let afterEmptyLine = false;
    for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
            case '#':
                comment +=
                    (comment === '' ? '' : afterEmptyLine ? '\n\n' : '\n') +
                        (source.substring(1) || ' ');
                atComment = true;
                afterEmptyLine = false;
                break;
            case '%':
                if (prelude[i + 1]?.[0] !== '#')
                    i += 1;
                atComment = false;
                break;
            default:
                // This may be wrong after doc-end, but in that case it doesn't matter
                if (!atComment)
                    afterEmptyLine = true;
                atComment = false;
        }
    }
    return { comment, afterEmptyLine };
}
/**
 * Compose a stream of CST nodes into a stream of YAML Documents.
 *
 * ```ts
 * import { Composer, Parser } from 'yaml'
 *
 * const src: string = ...
 * const tokens = new Parser().parse(src)
 * const docs = new Composer().compose(tokens)
 * ```
 */
class Composer {
    constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
            const pos = getErrorPos(source);
            if (warning)
                this.warnings.push(new errors.YAMLWarning(pos, code, message));
            else
                this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        this.directives = new directives.Directives({ version: options.version || '1.2' });
        this.options = options;
    }
    decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        //console.log({ dc: doc.comment, prelude, comment })
        if (comment) {
            const dc = doc.contents;
            if (afterDoc) {
                doc.comment = doc.comment ? `${doc.comment}\n${comment}` : comment;
            }
            else if (afterEmptyLine || doc.directives.docStart || !dc) {
                doc.commentBefore = comment;
            }
            else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
                let it = dc.items[0];
                if (identity.isPair(it))
                    it = it.key;
                const cb = it.commentBefore;
                it.commentBefore = cb ? `${comment}\n${cb}` : comment;
            }
            else {
                const cb = dc.commentBefore;
                dc.commentBefore = cb ? `${comment}\n${cb}` : comment;
            }
        }
        if (afterDoc) {
            for (let i = 0; i < this.errors.length; ++i)
                doc.errors.push(this.errors[i]);
            for (let i = 0; i < this.warnings.length; ++i)
                doc.warnings.push(this.warnings[i]);
        }
        else {
            doc.errors = this.errors;
            doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
    }
    /**
     * Current stream status information.
     *
     * Mostly useful at the end of input for an empty stream.
     */
    streamInfo() {
        return {
            comment: parsePrelude(this.prelude).comment,
            directives: this.directives,
            errors: this.errors,
            warnings: this.warnings
        };
    }
    /**
     * Compose tokens into documents.
     *
     * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
     * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
     */
    *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
            yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
    }
    /** Advance the composer by one CST token. */
    *next(token) {
        if (node_process.env.LOG_STREAM)
            console.dir(token, { depth: null });
        switch (token.type) {
            case 'directive':
                this.directives.add(token.source, (offset, message, warning) => {
                    const pos = getErrorPos(token);
                    pos[0] += offset;
                    this.onError(pos, 'BAD_DIRECTIVE', message, warning);
                });
                this.prelude.push(token.source);
                this.atDirectives = true;
                break;
            case 'document': {
                const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
                if (this.atDirectives && !doc.directives.docStart)
                    this.onError(token, 'MISSING_CHAR', 'Missing directives-end/doc-start indicator line');
                this.decorate(doc, false);
                if (this.doc)
                    yield this.doc;
                this.doc = doc;
                this.atDirectives = false;
                break;
            }
            case 'byte-order-mark':
            case 'space':
                break;
            case 'comment':
            case 'newline':
                this.prelude.push(token.source);
                break;
            case 'error': {
                const msg = token.source
                    ? `${token.message}: ${JSON.stringify(token.source)}`
                    : token.message;
                const error = new errors.YAMLParseError(getErrorPos(token), 'UNEXPECTED_TOKEN', msg);
                if (this.atDirectives || !this.doc)
                    this.errors.push(error);
                else
                    this.doc.errors.push(error);
                break;
            }
            case 'doc-end': {
                if (!this.doc) {
                    const msg = 'Unexpected doc-end without preceding document';
                    this.errors.push(new errors.YAMLParseError(getErrorPos(token), 'UNEXPECTED_TOKEN', msg));
                    break;
                }
                this.doc.directives.docEnd = true;
                const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
                this.decorate(this.doc, true);
                if (end.comment) {
                    const dc = this.doc.comment;
                    this.doc.comment = dc ? `${dc}\n${end.comment}` : end.comment;
                }
                this.doc.range[2] = end.offset;
                break;
            }
            default:
                this.errors.push(new errors.YAMLParseError(getErrorPos(token), 'UNEXPECTED_TOKEN', `Unsupported token ${token.type}`));
        }
    }
    /**
     * Call at end of input to yield any remaining document.
     *
     * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
     * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
     */
    *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
            this.decorate(this.doc, true);
            yield this.doc;
            this.doc = null;
        }
        else if (forceDoc) {
            const opts = Object.assign({ _directives: this.directives }, this.options);
            const doc = new Document.Document(undefined, opts);
            if (this.atDirectives)
                this.onError(endOffset, 'MISSING_CHAR', 'Missing directives-end indicator line');
            doc.range = [0, endOffset, endOffset];
            this.decorate(doc, false);
            yield doc;
        }
    }
}

exports.Composer = Composer;

},
function(module,exports,load){
'use strict';

var identity = load(3);
var visit = load(4);

const escapeChars = {
    '!': '%21',
    ',': '%2C',
    '[': '%5B',
    ']': '%5D',
    '{': '%7B',
    '}': '%7D'
};
const escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, ch => escapeChars[ch]);
class Directives {
    constructor(yaml, tags) {
        /**
         * The directives-end/doc-start marker `---`. If `null`, a marker may still be
         * included in the document's stringified representation.
         */
        this.docStart = null;
        /** The doc-end marker `...`.  */
        this.docEnd = false;
        this.yaml = Object.assign({}, Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, Directives.defaultTags, tags);
    }
    clone() {
        const copy = new Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
    }
    /**
     * During parsing, get a Directives instance for the current document and
     * update the stream state according to the current version's spec.
     */
    atDocument() {
        const res = new Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
            case '1.1':
                this.atNextDocument = true;
                break;
            case '1.2':
                this.atNextDocument = false;
                this.yaml = {
                    explicit: Directives.defaultYaml.explicit,
                    version: '1.2'
                };
                this.tags = Object.assign({}, Directives.defaultTags);
                break;
        }
        return res;
    }
    /**
     * @param onError - May be called even if the action was successful
     * @returns `true` on success
     */
    add(line, onError) {
        if (this.atNextDocument) {
            this.yaml = { explicit: Directives.defaultYaml.explicit, version: '1.1' };
            this.tags = Object.assign({}, Directives.defaultTags);
            this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
            case '%TAG': {
                if (parts.length !== 2) {
                    onError(0, '%TAG directive should contain exactly two parts');
                    if (parts.length < 2)
                        return false;
                }
                const [handle, prefix] = parts;
                this.tags[handle] = prefix;
                return true;
            }
            case '%YAML': {
                this.yaml.explicit = true;
                if (parts.length !== 1) {
                    onError(0, '%YAML directive should contain exactly one part');
                    return false;
                }
                const [version] = parts;
                if (version === '1.1' || version === '1.2') {
                    this.yaml.version = version;
                    return true;
                }
                else {
                    const isValid = /^\d+\.\d+$/.test(version);
                    onError(6, `Unsupported YAML version ${version}`, isValid);
                    return false;
                }
            }
            default:
                onError(0, `Unknown directive ${name}`, true);
                return false;
        }
    }
    /**
     * Resolves a tag, matching handles to those defined in %TAG directives.
     *
     * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
     *   `'!local'` tag, or `null` if unresolvable.
     */
    tagName(source, onError) {
        if (source === '!')
            return '!'; // non-specific tag
        if (source[0] !== '!') {
            onError(`Not a valid tag: ${source}`);
            return null;
        }
        if (source[1] === '<') {
            const verbatim = source.slice(2, -1);
            if (verbatim === '!' || verbatim === '!!') {
                onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
                return null;
            }
            if (source[source.length - 1] !== '>')
                onError('Verbatim tags must end with a >');
            return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
            onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
            try {
                return prefix + decodeURIComponent(suffix);
            }
            catch (error) {
                onError(String(error));
                return null;
            }
        }
        if (handle === '!')
            return source; // local tag
        onError(`Could not resolve tag: ${source}`);
        return null;
    }
    /**
     * Given a fully resolved tag, returns its printable string form,
     * taking into account current tag prefixes and defaults.
     */
    tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
            if (tag.startsWith(prefix))
                return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === '!' ? tag : `!<${tag}>`;
    }
    toString(doc) {
        const lines = this.yaml.explicit
            ? [`%YAML ${this.yaml.version || '1.2'}`]
            : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
            const tags = {};
            visit.visit(doc.contents, (_key, node) => {
                if (identity.isNode(node) && node.tag)
                    tags[node.tag] = true;
            });
            tagNames = Object.keys(tags);
        }
        else
            tagNames = [];
        for (const [handle, prefix] of tagEntries) {
            if (handle === '!!' && prefix === 'tag:yaml.org,2002:')
                continue;
            if (!doc || tagNames.some(tn => tn.startsWith(prefix)))
                lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join('\n');
    }
}
Directives.defaultYaml = { explicit: false, version: '1.2' };
Directives.defaultTags = { '!!': 'tag:yaml.org,2002:' };

exports.Directives = Directives;

},
function(module,exports,load){
'use strict';

const ALIAS = Symbol.for('yaml.alias');
const DOC = Symbol.for('yaml.document');
const MAP = Symbol.for('yaml.map');
const PAIR = Symbol.for('yaml.pair');
const SCALAR = Symbol.for('yaml.scalar');
const SEQ = Symbol.for('yaml.seq');
const NODE_TYPE = Symbol.for('yaml.node.type');
const isAlias = (node) => !!node && typeof node === 'object' && node[NODE_TYPE] === ALIAS;
const isDocument = (node) => !!node && typeof node === 'object' && node[NODE_TYPE] === DOC;
const isMap = (node) => !!node && typeof node === 'object' && node[NODE_TYPE] === MAP;
const isPair = (node) => !!node && typeof node === 'object' && node[NODE_TYPE] === PAIR;
const isScalar = (node) => !!node && typeof node === 'object' && node[NODE_TYPE] === SCALAR;
const isSeq = (node) => !!node && typeof node === 'object' && node[NODE_TYPE] === SEQ;
function isCollection(node) {
    if (node && typeof node === 'object')
        switch (node[NODE_TYPE]) {
            case MAP:
            case SEQ:
                return true;
        }
    return false;
}
function isNode(node) {
    if (node && typeof node === 'object')
        switch (node[NODE_TYPE]) {
            case ALIAS:
            case MAP:
            case SCALAR:
            case SEQ:
                return true;
        }
    return false;
}
const hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;

exports.ALIAS = ALIAS;
exports.DOC = DOC;
exports.MAP = MAP;
exports.NODE_TYPE = NODE_TYPE;
exports.PAIR = PAIR;
exports.SCALAR = SCALAR;
exports.SEQ = SEQ;
exports.hasAnchor = hasAnchor;
exports.isAlias = isAlias;
exports.isCollection = isCollection;
exports.isDocument = isDocument;
exports.isMap = isMap;
exports.isNode = isNode;
exports.isPair = isPair;
exports.isScalar = isScalar;
exports.isSeq = isSeq;

},
function(module,exports,load){
'use strict';

var identity = load(3);

const BREAK = Symbol('break visit');
const SKIP = Symbol('skip children');
const REMOVE = Symbol('remove node');
/**
 * Apply a visitor to an AST node or document.
 *
 * Walks through the tree (depth-first) starting from `node`, calling a
 * `visitor` function with three arguments:
 *   - `key`: For sequence values and map `Pair`, the node's index in the
 *     collection. Within a `Pair`, `'key'` or `'value'`, correspondingly.
 *     `null` for the root node.
 *   - `node`: The current node.
 *   - `path`: The ancestry of the current node.
 *
 * The return value of the visitor may be used to control the traversal:
 *   - `undefined` (default): Do nothing and continue
 *   - `visit.SKIP`: Do not visit the children of this node, continue with next
 *     sibling
 *   - `visit.BREAK`: Terminate traversal completely
 *   - `visit.REMOVE`: Remove the current node, then continue with the next one
 *   - `Node`: Replace the current node, then continue by visiting it
 *   - `number`: While iterating the items of a sequence or map, set the index
 *     of the next step. This is useful especially if the index of the current
 *     node has changed.
 *
 * If `visitor` is a single function, it will be called with all values
 * encountered in the tree, including e.g. `null` values. Alternatively,
 * separate visitor functions may be defined for each `Map`, `Pair`, `Seq`,
 * `Alias` and `Scalar` node. To define the same visitor function for more than
 * one node type, use the `Collection` (map and seq), `Value` (map, seq & scalar)
 * and `Node` (alias, map, seq & scalar) targets. Of all these, only the most
 * specific defined one will be used for each node.
 */
function visit(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (identity.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
            node.contents = null;
    }
    else
        visit_(null, node, visitor_, Object.freeze([]));
}
// Without the `as symbol` casts, TS declares these in the `visit`
// namespace using `var`, but then complains about that because
// `unique symbol` must be `const`.
/** Terminate visit traversal completely */
visit.BREAK = BREAK;
/** Do not visit the children of the current node */
visit.SKIP = SKIP;
/** Remove the current node */
visit.REMOVE = REMOVE;
function visit_(key, node, visitor, path) {
    const ctrl = callVisitor(key, node, visitor, path);
    if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path, ctrl);
        return visit_(key, ctrl, visitor, path);
    }
    if (typeof ctrl !== 'symbol') {
        if (identity.isCollection(node)) {
            path = Object.freeze(path.concat(node));
            for (let i = 0; i < node.items.length; ++i) {
                const ci = visit_(i, node.items[i], visitor, path);
                if (typeof ci === 'number')
                    i = ci - 1;
                else if (ci === BREAK)
                    return BREAK;
                else if (ci === REMOVE) {
                    node.items.splice(i, 1);
                    i -= 1;
                }
            }
        }
        else if (identity.isPair(node)) {
            path = Object.freeze(path.concat(node));
            const ck = visit_('key', node.key, visitor, path);
            if (ck === BREAK)
                return BREAK;
            else if (ck === REMOVE)
                node.key = null;
            const cv = visit_('value', node.value, visitor, path);
            if (cv === BREAK)
                return BREAK;
            else if (cv === REMOVE)
                node.value = null;
        }
    }
    return ctrl;
}
/**
 * Apply an async visitor to an AST node or document.
 *
 * Walks through the tree (depth-first) starting from `node`, calling a
 * `visitor` function with three arguments:
 *   - `key`: For sequence values and map `Pair`, the node's index in the
 *     collection. Within a `Pair`, `'key'` or `'value'`, correspondingly.
 *     `null` for the root node.
 *   - `node`: The current node.
 *   - `path`: The ancestry of the current node.
 *
 * The return value of the visitor may be used to control the traversal:
 *   - `Promise`: Must resolve to one of the following values
 *   - `undefined` (default): Do nothing and continue
 *   - `visit.SKIP`: Do not visit the children of this node, continue with next
 *     sibling
 *   - `visit.BREAK`: Terminate traversal completely
 *   - `visit.REMOVE`: Remove the current node, then continue with the next one
 *   - `Node`: Replace the current node, then continue by visiting it
 *   - `number`: While iterating the items of a sequence or map, set the index
 *     of the next step. This is useful especially if the index of the current
 *     node has changed.
 *
 * If `visitor` is a single function, it will be called with all values
 * encountered in the tree, including e.g. `null` values. Alternatively,
 * separate visitor functions may be defined for each `Map`, `Pair`, `Seq`,
 * `Alias` and `Scalar` node. To define the same visitor function for more than
 * one node type, use the `Collection` (map and seq), `Value` (map, seq & scalar)
 * and `Node` (alias, map, seq & scalar) targets. Of all these, only the most
 * specific defined one will be used for each node.
 */
async function visitAsync(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (identity.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
            node.contents = null;
    }
    else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
}
// Without the `as symbol` casts, TS declares these in the `visit`
// namespace using `var`, but then complains about that because
// `unique symbol` must be `const`.
/** Terminate visit traversal completely */
visitAsync.BREAK = BREAK;
/** Do not visit the children of the current node */
visitAsync.SKIP = SKIP;
/** Remove the current node */
visitAsync.REMOVE = REMOVE;
async function visitAsync_(key, node, visitor, path) {
    const ctrl = await callVisitor(key, node, visitor, path);
    if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path, ctrl);
        return visitAsync_(key, ctrl, visitor, path);
    }
    if (typeof ctrl !== 'symbol') {
        if (identity.isCollection(node)) {
            path = Object.freeze(path.concat(node));
            for (let i = 0; i < node.items.length; ++i) {
                const ci = await visitAsync_(i, node.items[i], visitor, path);
                if (typeof ci === 'number')
                    i = ci - 1;
                else if (ci === BREAK)
                    return BREAK;
                else if (ci === REMOVE) {
                    node.items.splice(i, 1);
                    i -= 1;
                }
            }
        }
        else if (identity.isPair(node)) {
            path = Object.freeze(path.concat(node));
            const ck = await visitAsync_('key', node.key, visitor, path);
            if (ck === BREAK)
                return BREAK;
            else if (ck === REMOVE)
                node.key = null;
            const cv = await visitAsync_('value', node.value, visitor, path);
            if (cv === BREAK)
                return BREAK;
            else if (cv === REMOVE)
                node.value = null;
        }
    }
    return ctrl;
}
function initVisitor(visitor) {
    if (typeof visitor === 'object' &&
        (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
            Alias: visitor.Node,
            Map: visitor.Node,
            Scalar: visitor.Node,
            Seq: visitor.Node
        }, visitor.Value && {
            Map: visitor.Value,
            Scalar: visitor.Value,
            Seq: visitor.Value
        }, visitor.Collection && {
            Map: visitor.Collection,
            Seq: visitor.Collection
        }, visitor);
    }
    return visitor;
}
function callVisitor(key, node, visitor, path) {
    if (typeof visitor === 'function')
        return visitor(key, node, path);
    if (identity.isMap(node))
        return visitor.Map?.(key, node, path);
    if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path);
    if (identity.isPair(node))
        return visitor.Pair?.(key, node, path);
    if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path);
    if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path);
    return undefined;
}
function replaceNode(key, path, node) {
    const parent = path[path.length - 1];
    if (identity.isCollection(parent)) {
        parent.items[key] = node;
    }
    else if (identity.isPair(parent)) {
        if (key === 'key')
            parent.key = node;
        else
            parent.value = node;
    }
    else if (identity.isDocument(parent)) {
        parent.contents = node;
    }
    else {
        const pt = identity.isAlias(parent) ? 'alias' : 'scalar';
        throw new Error(`Cannot replace node with ${pt} parent`);
    }
}

exports.visit = visit;
exports.visitAsync = visitAsync;

},
function(module,exports,load){
'use strict';

var Alias = load(6);
var Collection = load(11);
var identity = load(3);
var Pair = load(14);
var toJS = load(10);
var Schema = load(23);
var stringifyDocument = load(47);
var anchors = load(7);
var applyReviver = load(9);
var createNode = load(12);
var directives = load(2);

class Document {
    constructor(value, replacer, options) {
        /** A comment before this Document */
        this.commentBefore = null;
        /** A comment immediately after this Document */
        this.comment = null;
        /** Errors encountered during parsing. */
        this.errors = [];
        /** Warnings encountered during parsing. */
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === 'function' || Array.isArray(replacer)) {
            _replacer = replacer;
        }
        else if (options === undefined && replacer) {
            options = replacer;
            replacer = undefined;
        }
        const opt = Object.assign({
            intAsBigInt: false,
            keepSourceTokens: false,
            logLevel: 'warn',
            prettyErrors: true,
            strict: true,
            stringKeys: false,
            uniqueKeys: true,
            version: '1.2'
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
            this.directives = options._directives.atDocument();
            if (this.directives.yaml.explicit)
                version = this.directives.yaml.version;
        }
        else
            this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        // @ts-expect-error We can't really know that this matches Contents.
        this.contents =
            value === undefined ? null : this.createNode(value, _replacer, options);
    }
    /**
     * Create a deep copy of this Document and its contents.
     *
     * Custom Node values that inherit from `Object` still refer to their original instances.
     */
    clone() {
        const copy = Object.create(Document.prototype, {
            [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
            copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        // @ts-expect-error We can't really know that this matches Contents.
        copy.contents = identity.isNode(this.contents)
            ? this.contents.clone(copy.schema)
            : this.contents;
        if (this.range)
            copy.range = this.range.slice();
        return copy;
    }
    /** Adds a value to the document. */
    add(value) {
        if (assertCollection(this.contents))
            this.contents.add(value);
    }
    /** Adds a value to the document. */
    addIn(path, value) {
        if (assertCollection(this.contents))
            this.contents.addIn(path, value);
    }
    /**
     * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
     *
     * If `node` already has an anchor, `name` is ignored.
     * Otherwise, the `node.anchor` value will be set to `name`,
     * or if an anchor with that name is already present in the document,
     * `name` will be used as a prefix for a new unique anchor.
     * If `name` is undefined, the generated anchor will use 'a' as a prefix.
     */
    createAlias(node, name) {
        if (!node.anchor) {
            const prev = anchors.anchorNames(this);
            node.anchor =
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                !name || prev.has(name) ? anchors.findNewAnchor(name || 'a', prev) : name;
        }
        return new Alias.Alias(node.anchor);
    }
    createNode(value, replacer, options) {
        let _replacer = undefined;
        if (typeof replacer === 'function') {
            value = replacer.call({ '': value }, '', value);
            _replacer = replacer;
        }
        else if (Array.isArray(replacer)) {
            const keyToStr = (v) => typeof v === 'number' || v instanceof String || v instanceof Number;
            const asStr = replacer.filter(keyToStr).map(String);
            if (asStr.length > 0)
                replacer = replacer.concat(asStr);
            _replacer = replacer;
        }
        else if (options === undefined && replacer) {
            options = replacer;
            replacer = undefined;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(this, 
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        anchorPrefix || 'a');
        const ctx = {
            aliasDuplicateObjects: aliasDuplicateObjects ?? true,
            keepUndefined: keepUndefined ?? false,
            onAnchor,
            onTagObj,
            replacer: _replacer,
            schema: this.schema,
            sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity.isCollection(node))
            node.flow = true;
        setAnchors();
        return node;
    }
    /**
     * Convert a key and a value into a `Pair` using the current schema,
     * recursively wrapping all values as `Scalar` or `Collection` nodes.
     */
    createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
    }
    /**
     * Removes a value from the document.
     * @returns `true` if the item was found and removed.
     */
    delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
    }
    /**
     * Removes a value from the document.
     * @returns `true` if the item was found and removed.
     */
    deleteIn(path) {
        if (Collection.isEmptyPath(path)) {
            if (this.contents == null)
                return false;
            // @ts-expect-error Presumed impossible if Strict extends false
            this.contents = null;
            return true;
        }
        return assertCollection(this.contents)
            ? this.contents.deleteIn(path)
            : false;
    }
    /**
     * Returns item at `key`, or `undefined` if not found. By default unwraps
     * scalar values from their surrounding node; to disable set `keepScalar` to
     * `true` (collections are always returned intact).
     */
    get(key, keepScalar) {
        return identity.isCollection(this.contents)
            ? this.contents.get(key, keepScalar)
            : undefined;
    }
    /**
     * Returns item at `path`, or `undefined` if not found. By default unwraps
     * scalar values from their surrounding node; to disable set `keepScalar` to
     * `true` (collections are always returned intact).
     */
    getIn(path, keepScalar) {
        if (Collection.isEmptyPath(path))
            return !keepScalar && identity.isScalar(this.contents)
                ? this.contents.value
                : this.contents;
        return identity.isCollection(this.contents)
            ? this.contents.getIn(path, keepScalar)
            : undefined;
    }
    /**
     * Checks if the document includes a value with the key `key`.
     */
    has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
    }
    /**
     * Checks if the document includes a value at `path`.
     */
    hasIn(path) {
        if (Collection.isEmptyPath(path))
            return this.contents !== undefined;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path) : false;
    }
    /**
     * Sets a value in this document. For `!!set`, `value` needs to be a
     * boolean to add/remove the item from the set.
     */
    set(key, value) {
        if (this.contents == null) {
            // @ts-expect-error We can't really know that this matches Contents.
            this.contents = Collection.collectionFromPath(this.schema, [key], value);
        }
        else if (assertCollection(this.contents)) {
            this.contents.set(key, value);
        }
    }
    /**
     * Sets a value in this document. For `!!set`, `value` needs to be a
     * boolean to add/remove the item from the set.
     */
    setIn(path, value) {
        if (Collection.isEmptyPath(path)) {
            // @ts-expect-error We can't really know that this matches Contents.
            this.contents = value;
        }
        else if (this.contents == null) {
            // @ts-expect-error We can't really know that this matches Contents.
            this.contents = Collection.collectionFromPath(this.schema, Array.from(path), value);
        }
        else if (assertCollection(this.contents)) {
            this.contents.setIn(path, value);
        }
    }
    /**
     * Change the YAML version and schema used by the document.
     * A `null` version disables support for directives, explicit tags, anchors, and aliases.
     * It also requires the `schema` option to be given as a `Schema` instance value.
     *
     * Overrides all previously set schema options.
     */
    setSchema(version, options = {}) {
        if (typeof version === 'number')
            version = String(version);
        let opt;
        switch (version) {
            case '1.1':
                if (this.directives)
                    this.directives.yaml.version = '1.1';
                else
                    this.directives = new directives.Directives({ version: '1.1' });
                opt = { resolveKnownTags: false, schema: 'yaml-1.1' };
                break;
            case '1.2':
            case 'next':
                if (this.directives)
                    this.directives.yaml.version = version;
                else
                    this.directives = new directives.Directives({ version });
                opt = { resolveKnownTags: true, schema: 'core' };
                break;
            case null:
                if (this.directives)
                    delete this.directives;
                opt = null;
                break;
            default: {
                const sv = JSON.stringify(version);
                throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
            }
        }
        // Not using `instanceof Schema` to allow for duck typing
        if (options.schema instanceof Object)
            this.schema = options.schema;
        else if (opt)
            this.schema = new Schema.Schema(Object.assign(opt, options));
        else
            throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
    }
    // json & jsonArg are only used from toJSON()
    toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
            anchors: new Map(),
            doc: this,
            keep: !json,
            mapAsMap: mapAsMap === true,
            mapKeyWarned: false,
            maxAliasCount: typeof maxAliasCount === 'number' ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? '', ctx);
        if (typeof onAnchor === 'function')
            for (const { count, res } of ctx.anchors.values())
                onAnchor(res, count);
        return typeof reviver === 'function'
            ? applyReviver.applyReviver(reviver, { '': res }, '', res)
            : res;
    }
    /**
     * A JSON representation of the document `contents`.
     *
     * @param jsonArg Used by `JSON.stringify` to indicate the array index or
     *   property name.
     */
    toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
    }
    /** A YAML representation of the document. */
    toString(options = {}) {
        if (this.errors.length > 0)
            throw new Error('Document with errors cannot be stringified');
        if ('indent' in options &&
            (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
            const s = JSON.stringify(options.indent);
            throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
    }
}
function assertCollection(contents) {
    if (identity.isCollection(contents))
        return true;
    throw new Error('Expected a YAML collection as document contents');
}

exports.Document = Document;

},
function(module,exports,load){
'use strict';

var anchors = load(7);
var visit = load(4);
var identity = load(3);
var Node = load(8);
var toJS = load(10);

class Alias extends Node.NodeBase {
    constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, 'tag', {
            set() {
                throw new Error('Alias nodes cannot have tags');
            }
        });
    }
    /**
     * Resolve the value of this alias within `doc`, finding the last
     * instance of the `source` anchor before this node.
     */
    resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
            throw new ReferenceError('Alias resolution is disabled');
        let nodes;
        if (ctx?.aliasResolveCache) {
            nodes = ctx.aliasResolveCache;
        }
        else {
            nodes = [];
            visit.visit(doc, {
                Node: (_key, node) => {
                    if (identity.isAlias(node) || identity.hasAnchor(node))
                        nodes.push(node);
                }
            });
            if (ctx)
                ctx.aliasResolveCache = nodes;
        }
        let found = undefined;
        for (const node of nodes) {
            if (node === this)
                break;
            if (node.anchor === this.source)
                found = node;
        }
        if (found && ctx) {
            const { anchors, doc, maxAliasCount } = ctx;
            let data = anchors.get(found);
            if (!data) {
                // Resolve anchors for Node.prototype.toJS()
                toJS.toJS(found, null, ctx);
                data = anchors.get(found);
            }
            /* istanbul ignore if */
            if (data?.res === undefined) {
                const msg = 'This should not happen: Alias anchor was not resolved?';
                throw new ReferenceError(msg);
            }
            if (maxAliasCount >= 0) {
                data.count += 1;
                if (data.aliasCount === 0)
                    data.aliasCount = getAliasCount(doc, found, anchors);
                if (data.count * data.aliasCount > maxAliasCount) {
                    const msg = 'Excessive alias count indicates a resource exhaustion attack';
                    throw new ReferenceError(msg);
                }
            }
        }
        return found;
    }
    toJSON(_arg, ctx) {
        if (!ctx)
            return { source: this.source };
        const source = this.resolve(ctx.doc, ctx);
        if (!source) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new ReferenceError(msg);
        }
        return ctx.anchors.get(source).res;
    }
    toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
            anchors.anchorIsValid(this.source);
            if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
                const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
                throw new Error(msg);
            }
            if (ctx.implicitKey)
                return `${src} `;
        }
        return src;
    }
}
function getAliasCount(doc, node, anchors) {
    if (identity.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors && source && anchors.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
    }
    else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
            const c = getAliasCount(doc, item, anchors);
            if (c > count)
                count = c;
        }
        return count;
    }
    else if (identity.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors);
        const vc = getAliasCount(doc, node.value, anchors);
        return Math.max(kc, vc);
    }
    return 1;
}

exports.Alias = Alias;

},
function(module,exports,load){
'use strict';

var identity = load(3);
var visit = load(4);

/**
 * Verify that the input string is a valid anchor.
 *
 * Will throw on errors.
 */
function anchorIsValid(anchor) {
    if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
    }
    return true;
}
function anchorNames(root) {
    const anchors = new Set();
    visit.visit(root, {
        Value(_key, node) {
            if (node.anchor)
                anchors.add(node.anchor);
        }
    });
    return anchors;
}
/** Find a new anchor name with the given `prefix` and a one-indexed suffix. */
function findNewAnchor(prefix, exclude) {
    for (let i = 1; true; ++i) {
        const name = `${prefix}${i}`;
        if (!exclude.has(name))
            return name;
    }
}
function createNodeAnchors(doc, prefix) {
    const aliasObjects = [];
    const sourceObjects = new Map();
    let prevAnchors = null;
    return {
        onAnchor: (source) => {
            aliasObjects.push(source);
            prevAnchors ?? (prevAnchors = anchorNames(doc));
            const anchor = findNewAnchor(prefix, prevAnchors);
            prevAnchors.add(anchor);
            return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
            for (const source of aliasObjects) {
                const ref = sourceObjects.get(source);
                if (typeof ref === 'object' &&
                    ref.anchor &&
                    (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
                    ref.node.anchor = ref.anchor;
                }
                else {
                    const error = new Error('Failed to resolve repeated object (this should not happen)');
                    error.source = source;
                    throw error;
                }
            }
        },
        sourceObjects
    };
}

exports.anchorIsValid = anchorIsValid;
exports.anchorNames = anchorNames;
exports.createNodeAnchors = createNodeAnchors;
exports.findNewAnchor = findNewAnchor;

},
function(module,exports,load){
'use strict';

var applyReviver = load(9);
var identity = load(3);
var toJS = load(10);

class NodeBase {
    constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
    }
    /** Create a copy of this node.  */
    clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
            copy.range = this.range.slice();
        return copy;
    }
    /** A plain JavaScript representation of this node. */
    toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
            throw new TypeError('A document argument is required');
        const ctx = {
            anchors: new Map(),
            doc,
            keep: true,
            mapAsMap: mapAsMap === true,
            mapKeyWarned: false,
            maxAliasCount: typeof maxAliasCount === 'number' ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, '', ctx);
        if (typeof onAnchor === 'function')
            for (const { count, res } of ctx.anchors.values())
                onAnchor(res, count);
        return typeof reviver === 'function'
            ? applyReviver.applyReviver(reviver, { '': res }, '', res)
            : res;
    }
}

exports.NodeBase = NodeBase;

},
function(module,exports,load){
'use strict';

/**
 * Applies the JSON.parse reviver algorithm as defined in the ECMA-262 spec,
 * in section 24.5.1.1 "Runtime Semantics: InternalizeJSONProperty" of the
 * 2021 edition: https://tc39.es/ecma262/#sec-json.parse
 *
 * Includes extensions for handling Map and Set objects.
 */
function applyReviver(reviver, obj, key, val) {
    if (val && typeof val === 'object') {
        if (Array.isArray(val)) {
            for (let i = 0, len = val.length; i < len; ++i) {
                const v0 = val[i];
                const v1 = applyReviver(reviver, val, String(i), v0);
                // eslint-disable-next-line @typescript-eslint/no-array-delete
                if (v1 === undefined)
                    delete val[i];
                else if (v1 !== v0)
                    val[i] = v1;
            }
        }
        else if (val instanceof Map) {
            for (const k of Array.from(val.keys())) {
                const v0 = val.get(k);
                const v1 = applyReviver(reviver, val, k, v0);
                if (v1 === undefined)
                    val.delete(k);
                else if (v1 !== v0)
                    val.set(k, v1);
            }
        }
        else if (val instanceof Set) {
            for (const v0 of Array.from(val)) {
                const v1 = applyReviver(reviver, val, v0, v0);
                if (v1 === undefined)
                    val.delete(v0);
                else if (v1 !== v0) {
                    val.delete(v0);
                    val.add(v1);
                }
            }
        }
        else {
            for (const [k, v0] of Object.entries(val)) {
                const v1 = applyReviver(reviver, val, k, v0);
                if (v1 === undefined)
                    delete val[k];
                else if (v1 !== v0)
                    val[k] = v1;
            }
        }
    }
    return reviver.call(obj, key, val);
}

exports.applyReviver = applyReviver;

},
function(module,exports,load){
'use strict';

var identity = load(3);

/**
 * Recursively convert any node or its contents to native JavaScript
 *
 * @param value - The input value
 * @param arg - If `value` defines a `toJSON()` method, use this
 *   as its first argument
 * @param ctx - Conversion context, originally set in Document#toJS(). If
 *   `{ keep: true }` is not set, output should be suitable for JSON
 *   stringification.
 */
function toJS(value, arg, ctx) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
    if (value && typeof value.toJSON === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        if (!ctx || !identity.hasAnchor(value))
            return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: undefined };
        ctx.anchors.set(value, data);
        ctx.onCreate = res => {
            data.res = res;
            delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
            ctx.onCreate(res);
        return res;
    }
    if (typeof value === 'bigint' && !ctx?.keep)
        return Number(value);
    return value;
}

exports.toJS = toJS;

},
function(module,exports,load){
'use strict';

var createNode = load(12);
var identity = load(3);
var Node = load(8);

function collectionFromPath(schema, path, value) {
    let v = value;
    for (let i = path.length - 1; i >= 0; --i) {
        const k = path[i];
        if (typeof k === 'number' && Number.isInteger(k) && k >= 0) {
            const a = [];
            a[k] = v;
            v = a;
        }
        else {
            v = new Map([[k, v]]);
        }
    }
    return createNode.createNode(v, undefined, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
            throw new Error('This should not happen, please report a bug.');
        },
        schema,
        sourceObjects: new Map()
    });
}
// Type guard is intentionally a little wrong so as to be more useful,
// as it does not cover untypable empty non-string iterables (e.g. []).
const isEmptyPath = (path) => path == null ||
    (typeof path === 'object' && !!path[Symbol.iterator]().next().done);
class Collection extends Node.NodeBase {
    constructor(type, schema) {
        super(type);
        Object.defineProperty(this, 'schema', {
            value: schema,
            configurable: true,
            enumerable: false,
            writable: true
        });
    }
    /**
     * Create a copy of this collection.
     *
     * @param schema - If defined, overwrites the original's schema
     */
    clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
            copy.schema = schema;
        copy.items = copy.items.map(it => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
        if (this.range)
            copy.range = this.range.slice();
        return copy;
    }
    /**
     * Adds a value to the collection. For `!!map` and `!!omap` the value must
     * be a Pair instance or a `{ key, value }` object, which may not have a key
     * that already exists in the map.
     */
    addIn(path, value) {
        if (isEmptyPath(path))
            this.add(value);
        else {
            const [key, ...rest] = path;
            const node = this.get(key, true);
            if (identity.isCollection(node))
                node.addIn(rest, value);
            else if (node === undefined && this.schema)
                this.set(key, collectionFromPath(this.schema, rest, value));
            else
                throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
    }
    /**
     * Removes a value from the collection.
     * @returns `true` if the item was found and removed.
     */
    deleteIn(path) {
        const [key, ...rest] = path;
        if (rest.length === 0)
            return this.delete(key);
        const node = this.get(key, true);
        if (identity.isCollection(node))
            return node.deleteIn(rest);
        else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
    /**
     * Returns item at `key`, or `undefined` if not found. By default unwraps
     * scalar values from their surrounding node; to disable set `keepScalar` to
     * `true` (collections are always returned intact).
     */
    getIn(path, keepScalar) {
        const [key, ...rest] = path;
        const node = this.get(key, true);
        if (rest.length === 0)
            return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
            return identity.isCollection(node) ? node.getIn(rest, keepScalar) : undefined;
    }
    hasAllNullValues(allowScalar) {
        return this.items.every(node => {
            if (!identity.isPair(node))
                return false;
            const n = node.value;
            return (n == null ||
                (allowScalar &&
                    identity.isScalar(n) &&
                    n.value == null &&
                    !n.commentBefore &&
                    !n.comment &&
                    !n.tag));
        });
    }
    /**
     * Checks if the collection includes a value with the key `key`.
     */
    hasIn(path) {
        const [key, ...rest] = path;
        if (rest.length === 0)
            return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
    }
    /**
     * Sets a value in this collection. For `!!set`, `value` needs to be a
     * boolean to add/remove the item from the set.
     */
    setIn(path, value) {
        const [key, ...rest] = path;
        if (rest.length === 0) {
            this.set(key, value);
        }
        else {
            const node = this.get(key, true);
            if (identity.isCollection(node))
                node.setIn(rest, value);
            else if (node === undefined && this.schema)
                this.set(key, collectionFromPath(this.schema, rest, value));
            else
                throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
    }
}

exports.Collection = Collection;
exports.collectionFromPath = collectionFromPath;
exports.isEmptyPath = isEmptyPath;

},
function(module,exports,load){
'use strict';

var Alias = load(6);
var identity = load(3);
var Scalar = load(13);

const defaultTagPrefix = 'tag:yaml.org,2002:';
function findTagObject(value, tagName, tags) {
    if (tagName) {
        const match = tags.filter(t => t.tag === tagName);
        const tagObj = match.find(t => !t.format) ?? match[0];
        if (!tagObj)
            throw new Error(`Tag ${tagName} not found`);
        return tagObj;
    }
    return tags.find(t => t.identify?.(value) && !t.format);
}
function createNode(value, tagName, ctx) {
    if (identity.isDocument(value))
        value = value.contents;
    if (identity.isNode(value))
        return value;
    if (identity.isPair(value)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
    }
    if (value instanceof String ||
        value instanceof Number ||
        value instanceof Boolean ||
        (typeof BigInt !== 'undefined' && value instanceof BigInt) // not supported everywhere
    ) {
        // https://tc39.es/ecma262/#sec-serializejsonproperty
        value = value.valueOf();
    }
    const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
    // Detect duplicate references to the same object & use Alias nodes for all
    // after first. The `ref` wrapper allows for circular references to resolve.
    let ref = undefined;
    if (aliasDuplicateObjects && value && typeof value === 'object') {
        ref = sourceObjects.get(value);
        if (ref) {
            ref.anchor ?? (ref.anchor = onAnchor(value));
            return new Alias.Alias(ref.anchor);
        }
        else {
            ref = { anchor: null, node: null };
            sourceObjects.set(value, ref);
        }
    }
    if (tagName?.startsWith('!!'))
        tagName = defaultTagPrefix + tagName.slice(2);
    let tagObj = findTagObject(value, tagName, schema.tags);
    if (!tagObj) {
        if (value && typeof value.toJSON === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            value = value.toJSON();
        }
        if (!value || typeof value !== 'object') {
            const node = new Scalar.Scalar(value);
            if (ref)
                ref.node = node;
            return node;
        }
        tagObj =
            value instanceof Map
                ? schema[identity.MAP]
                : Symbol.iterator in Object(value)
                    ? schema[identity.SEQ]
                    : schema[identity.MAP];
    }
    if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
    }
    const node = tagObj?.createNode
        ? tagObj.createNode(ctx.schema, value, ctx)
        : typeof tagObj?.nodeClass?.from === 'function'
            ? tagObj.nodeClass.from(ctx.schema, value, ctx)
            : new Scalar.Scalar(value);
    if (tagName)
        node.tag = tagName;
    else if (!tagObj.default)
        node.tag = tagObj.tag;
    if (ref)
        ref.node = node;
    return node;
}

exports.createNode = createNode;

},
function(module,exports,load){
'use strict';

var identity = load(3);
var Node = load(8);
var toJS = load(10);

const isScalarValue = (value) => !value || (typeof value !== 'function' && typeof value !== 'object');
class Scalar extends Node.NodeBase {
    constructor(value) {
        super(identity.SCALAR);
        this.value = value;
    }
    toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
    }
    toString() {
        return String(this.value);
    }
}
Scalar.BLOCK_FOLDED = 'BLOCK_FOLDED';
Scalar.BLOCK_LITERAL = 'BLOCK_LITERAL';
Scalar.PLAIN = 'PLAIN';
Scalar.QUOTE_DOUBLE = 'QUOTE_DOUBLE';
Scalar.QUOTE_SINGLE = 'QUOTE_SINGLE';

exports.Scalar = Scalar;
exports.isScalarValue = isScalarValue;

},
function(module,exports,load){
'use strict';

var createNode = load(12);
var stringifyPair = load(15);
var addPairToJSMap = load(20);
var identity = load(3);

function createPair(key, value, ctx) {
    const k = createNode.createNode(key, undefined, ctx);
    const v = createNode.createNode(value, undefined, ctx);
    return new Pair(k, v);
}
class Pair {
    constructor(key, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value;
    }
    clone(schema) {
        let { key, value } = this;
        if (identity.isNode(key))
            key = key.clone(schema);
        if (identity.isNode(value))
            value = value.clone(schema);
        return new Pair(key, value);
    }
    toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
    }
    toString(ctx, onComment, onChompKeep) {
        return ctx?.doc
            ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep)
            : JSON.stringify(this);
    }
}

exports.Pair = Pair;
exports.createPair = createPair;

},
function(module,exports,load){
'use strict';

var identity = load(3);
var Scalar = load(13);
var stringify = load(16);
var stringifyComment = load(17);

function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
    const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
    let keyComment = (identity.isNode(key) && key.comment) || null;
    if (simpleKeys) {
        if (keyComment) {
            throw new Error('With simple keys, key nodes cannot have comments');
        }
        if (identity.isCollection(key) || (!identity.isNode(key) && typeof key === 'object')) {
            const msg = 'With simple keys, collection cannot be used as a key value';
            throw new Error(msg);
        }
    }
    let explicitKey = !simpleKeys &&
        (!key ||
            (keyComment && value == null && !ctx.inFlow) ||
            identity.isCollection(key) ||
            (identity.isScalar(key)
                ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL
                : typeof key === 'object'));
    ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
    });
    let keyCommentDone = false;
    let chompKeep = false;
    let str = stringify.stringify(key, ctx, () => (keyCommentDone = true), () => (chompKeep = true));
    if (!explicitKey && !ctx.inFlow && str.length > 1024) {
        if (simpleKeys)
            throw new Error('With simple keys, single line scalar must not span more than 1024 characters');
        explicitKey = true;
    }
    if (ctx.inFlow) {
        if (allNullValues || value == null) {
            if (keyCommentDone && onComment)
                onComment();
            return str === '' ? '?' : explicitKey ? `? ${str}` : str;
        }
    }
    else if ((allNullValues && !simpleKeys) || (value == null && explicitKey)) {
        str = `? ${str}`;
        if (keyComment && !keyCommentDone) {
            str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        }
        else if (chompKeep && onChompKeep)
            onChompKeep();
        return str;
    }
    if (keyCommentDone)
        keyComment = null;
    if (explicitKey) {
        if (keyComment)
            str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        str = `? ${str}\n${indent}:`;
    }
    else {
        str = `${str}:`;
        if (keyComment)
            str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
    }
    let vsb, vcb, valueComment;
    if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
    }
    else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === 'object')
            value = doc.createNode(value);
    }
    ctx.implicitKey = false;
    if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str.length + 1;
    chompKeep = false;
    if (!indentSeq &&
        indentStep.length >= 2 &&
        !ctx.inFlow &&
        !explicitKey &&
        identity.isSeq(value) &&
        !value.flow &&
        !value.tag &&
        !value.anchor) {
        // If indentSeq === false, consider '- ' as part of indentation where possible
        ctx.indent = ctx.indent.substring(2);
    }
    let valueCommentDone = false;
    const valueStr = stringify.stringify(value, ctx, () => (valueCommentDone = true), () => (chompKeep = true));
    let ws = ' ';
    if (keyComment || vsb || vcb) {
        ws = vsb ? '\n' : '';
        if (vcb) {
            const cs = commentString(vcb);
            ws += `\n${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === '' && !ctx.inFlow) {
            if (ws === '\n' && valueComment)
                ws = '\n\n';
        }
        else {
            ws += `\n${ctx.indent}`;
        }
    }
    else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf('\n');
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
            let hasPropsLine = false;
            if (hasNewline && (vs0 === '&' || vs0 === '!')) {
                let sp0 = valueStr.indexOf(' ');
                if (vs0 === '&' &&
                    sp0 !== -1 &&
                    sp0 < nl0 &&
                    valueStr[sp0 + 1] === '!') {
                    sp0 = valueStr.indexOf(' ', sp0 + 1);
                }
                if (sp0 === -1 || nl0 < sp0)
                    hasPropsLine = true;
            }
            if (!hasPropsLine)
                ws = `\n${ctx.indent}`;
        }
    }
    else if (valueStr === '' || valueStr[0] === '\n') {
        ws = '';
    }
    str += ws + valueStr;
    if (ctx.inFlow) {
        if (valueCommentDone && onComment)
            onComment();
    }
    else if (valueComment && !valueCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
    }
    else if (chompKeep && onChompKeep) {
        onChompKeep();
    }
    return str;
}

exports.stringifyPair = stringifyPair;

},
function(module,exports,load){
'use strict';

var anchors = load(7);
var identity = load(3);
var stringifyComment = load(17);
var stringifyString = load(18);

function createStringifyContext(doc, options) {
    const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: 'PLAIN',
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: 'false',
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: 'null',
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: 'true',
        verifyAliasOrder: true
    }, doc.schema.toStringOptions, options);
    let inFlow;
    switch (opt.collectionStyle) {
        case 'block':
            inFlow = false;
            break;
        case 'flow':
            inFlow = true;
            break;
        default:
            inFlow = null;
    }
    return {
        anchors: new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? ' ' : '',
        indent: '',
        indentStep: typeof opt.indent === 'number' ? ' '.repeat(opt.indent) : '  ',
        inFlow,
        options: opt
    };
}
function getTagObject(tags, item) {
    if (item.tag) {
        const match = tags.filter(t => t.tag === item.tag);
        if (match.length > 0)
            return match.find(t => t.format === item.format) ?? match[0];
    }
    let tagObj = undefined;
    let obj;
    if (identity.isScalar(item)) {
        obj = item.value;
        let match = tags.filter(t => t.identify?.(obj));
        if (match.length > 1) {
            const testMatch = match.filter(t => t.test);
            if (testMatch.length > 0)
                match = testMatch;
        }
        tagObj =
            match.find(t => t.format === item.format) ?? match.find(t => !t.format);
    }
    else {
        obj = item;
        tagObj = tags.find(t => t.nodeClass && obj instanceof t.nodeClass);
    }
    if (!tagObj) {
        const name = obj?.constructor?.name ?? (obj === null ? 'null' : typeof obj);
        throw new Error(`Tag not resolved for ${name} value`);
    }
    return tagObj;
}
// needs to be called before value stringifier to allow for circular anchor refs
function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
    if (!doc.directives)
        return '';
    const props = [];
    const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
    if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
    }
    const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
    if (tag)
        props.push(doc.directives.tagString(tag));
    return props.join(' ');
}
function stringify(item, ctx, onComment, onChompKeep) {
    if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
    if (identity.isAlias(item)) {
        if (ctx.doc.directives)
            return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
            throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        }
        else {
            if (ctx.resolvedAliases)
                ctx.resolvedAliases.add(item);
            else
                ctx.resolvedAliases = new Set([item]);
            item = item.resolve(ctx.doc);
        }
    }
    let tagObj = undefined;
    const node = identity.isNode(item)
        ? item
        : ctx.doc.createNode(item, { onTagObj: o => (tagObj = o) });
    tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
    const props = stringifyProps(node, tagObj, ctx);
    if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
    const str = typeof tagObj.stringify === 'function'
        ? tagObj.stringify(node, ctx, onComment, onChompKeep)
        : identity.isScalar(node)
            ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep)
            : node.toString(ctx, onComment, onChompKeep);
    if (!props)
        return str;
    return identity.isScalar(node) || str[0] === '{' || str[0] === '['
        ? `${props} ${str}`
        : `${props}\n${ctx.indent}${str}`;
}

exports.createStringifyContext = createStringifyContext;
exports.stringify = stringify;

},
function(module,exports,load){
'use strict';

/**
 * Stringifies a comment.
 *
 * Empty comment lines are left empty,
 * lines consisting of a single space are replaced by `#`,
 * and all other lines are prefixed with a `#`.
 */
const stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, '#');
function indentComment(comment, indent) {
    if (/^\n+$/.test(comment))
        return comment.substring(1);
    return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
}
const lineComment = (str, indent, comment) => str.endsWith('\n')
    ? indentComment(comment, indent)
    : comment.includes('\n')
        ? '\n' + indentComment(comment, indent)
        : (str.endsWith(' ') ? '' : ' ') + comment;

exports.indentComment = indentComment;
exports.lineComment = lineComment;
exports.stringifyComment = stringifyComment;

},
function(module,exports,load){
'use strict';

var Scalar = load(13);
var foldFlowLines = load(19);

const getFoldOptions = (ctx, isBlock) => ({
    indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
    lineWidth: ctx.options.lineWidth,
    minContentWidth: ctx.options.minContentWidth
});
// Also checks for lines starting with %, as parsing the output as YAML 1.1 will
// presume that's starting a new document.
const containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
function lineLengthOverLimit(str, lineWidth, indentLength) {
    if (!lineWidth || lineWidth < 0)
        return false;
    const limit = lineWidth - indentLength;
    const strLen = str.length;
    if (strLen <= limit)
        return false;
    for (let i = 0, start = 0; i < strLen; ++i) {
        if (str[i] === '\n') {
            if (i - start > limit)
                return true;
            start = i + 1;
            if (strLen - start <= limit)
                return false;
        }
    }
    return true;
}
function doubleQuotedString(value, ctx) {
    const json = JSON.stringify(value);
    if (ctx.options.doubleQuotedAsJSON)
        return json;
    const { implicitKey } = ctx;
    const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
    const indent = ctx.indent || (containsDocumentMarker(value) ? '  ' : '');
    let str = '';
    let start = 0;
    for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === ' ' && json[i + 1] === '\\' && json[i + 2] === 'n') {
            // space before newline needs to be escaped to not be folded
            str += json.slice(start, i) + '\\ ';
            i += 1;
            start = i;
            ch = '\\';
        }
        if (ch === '\\')
            switch (json[i + 1]) {
                case 'u':
                    {
                        str += json.slice(start, i);
                        const code = json.substr(i + 2, 4);
                        switch (code) {
                            case '0000':
                                str += '\\0';
                                break;
                            case '0007':
                                str += '\\a';
                                break;
                            case '000b':
                                str += '\\v';
                                break;
                            case '001b':
                                str += '\\e';
                                break;
                            case '0085':
                                str += '\\N';
                                break;
                            case '00a0':
                                str += '\\_';
                                break;
                            case '2028':
                                str += '\\L';
                                break;
                            case '2029':
                                str += '\\P';
                                break;
                            default:
                                if (code.substr(0, 2) === '00')
                                    str += '\\x' + code.substr(2);
                                else
                                    str += json.substr(i, 6);
                        }
                        i += 5;
                        start = i + 1;
                    }
                    break;
                case 'n':
                    if (implicitKey ||
                        json[i + 2] === '"' ||
                        json.length < minMultiLineLength) {
                        i += 1;
                    }
                    else {
                        // folding will eat first newline
                        str += json.slice(start, i) + '\n\n';
                        while (json[i + 2] === '\\' &&
                            json[i + 3] === 'n' &&
                            json[i + 4] !== '"') {
                            str += '\n';
                            i += 2;
                        }
                        str += indent;
                        // space after newline needs to be escaped to not be folded
                        if (json[i + 2] === ' ')
                            str += '\\';
                        i += 1;
                        start = i + 1;
                    }
                    break;
                default:
                    i += 1;
            }
    }
    str = start ? str + json.slice(start) : json;
    return implicitKey
        ? str
        : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
}
function singleQuotedString(value, ctx) {
    if (ctx.options.singleQuote === false ||
        (ctx.implicitKey && value.includes('\n')) ||
        /[ \t]\n|\n[ \t]/.test(value) // single quoted string can't have leading or trailing whitespace around newline
    )
        return doubleQuotedString(value, ctx);
    const indent = ctx.indent || (containsDocumentMarker(value) ? '  ' : '');
    const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&\n${indent}`) + "'";
    return ctx.implicitKey
        ? res
        : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
}
function quotedString(value, ctx) {
    const { singleQuote } = ctx.options;
    let qs;
    if (singleQuote === false)
        qs = doubleQuotedString;
    else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
            qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
            qs = doubleQuotedString;
        else
            qs = singleQuote ? singleQuotedString : doubleQuotedString;
    }
    return qs(value, ctx);
}
// The negative lookbehind avoids a polynomial search,
// but isn't supported yet on Safari: https://caniuse.com/js-regexp-lookbehind
let blockEndNewlines;
try {
    blockEndNewlines = new RegExp('(^|(?<!\n))\n+(?!\n|$)', 'g');
}
catch {
    blockEndNewlines = /\n+(?!\n|$)/g;
}
function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
    const { blockQuote, commentString, lineWidth } = ctx.options;
    // 1. Block can't end in whitespace unless the last line is non-empty.
    // 2. Strings consisting of only whitespace are best rendered explicitly.
    if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
    }
    const indent = ctx.indent ||
        (ctx.forceBlockIndent || containsDocumentMarker(value) ? '  ' : '');
    const literal = blockQuote === 'literal'
        ? true
        : blockQuote === 'folded' || type === Scalar.Scalar.BLOCK_FOLDED
            ? false
            : type === Scalar.Scalar.BLOCK_LITERAL
                ? true
                : !lineLengthOverLimit(value, lineWidth, indent.length);
    if (!value)
        return literal ? '|\n' : '>\n';
    // determine chomping from whitespace at value end
    let chomp;
    let endStart;
    for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== '\n' && ch !== '\t' && ch !== ' ')
            break;
    }
    let end = value.substring(endStart);
    const endNlPos = end.indexOf('\n');
    if (endNlPos === -1) {
        chomp = '-'; // strip
    }
    else if (value === end || endNlPos !== end.length - 1) {
        chomp = '+'; // keep
        if (onChompKeep)
            onChompKeep();
    }
    else {
        chomp = ''; // clip
    }
    if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === '\n')
            end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
    }
    // determine indent indicator from whitespace at value start
    let startWithSpace = false;
    let startEnd;
    let startNlPos = -1;
    for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === ' ')
            startWithSpace = true;
        else if (ch === '\n')
            startNlPos = startEnd;
        else
            break;
    }
    let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
    if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
    }
    const indentSize = indent ? '2' : '1'; // root is at -1
    // Leading | or > is added later
    let header = (startWithSpace ? indentSize : '') + chomp;
    if (comment) {
        header += ' ' + commentString(comment.replace(/ ?[\r\n]+/g, ' '));
        if (onComment)
            onComment();
    }
    if (!literal) {
        const foldedValue = value
            .replace(/\n+/g, '\n$&')
            .replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, '$1$2') // more-indented lines aren't folded
            //                ^ more-ind. ^ empty     ^ capture next empty lines only at end of indent
            .replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== 'folded' && type !== Scalar.Scalar.BLOCK_FOLDED) {
            foldOptions.onOverflow = () => {
                literalFallback = true;
            };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
            return `>${header}\n${indent}${body}`;
    }
    value = value.replace(/\n+/g, `$&${indent}`);
    return `|${header}\n${indent}${start}${value}${end}`;
}
function plainString(item, ctx, onComment, onChompKeep) {
    const { type, value } = item;
    const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
    if ((implicitKey && value.includes('\n')) ||
        (inFlow && /[[\]{},]/.test(value))) {
        return quotedString(value, ctx);
    }
    if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        // not allowed:
        // - '-' or '?'
        // - start with an indicator character (except [?:-]) or /[?-] /
        // - '\n ', ': ' or ' \n' anywhere
        // - '#' not preceded by a non-space char
        // - end with ' ' or ':'
        return implicitKey || inFlow || !value.includes('\n')
            ? quotedString(value, ctx)
            : blockString(item, ctx, onComment, onChompKeep);
    }
    if (!implicitKey &&
        !inFlow &&
        type !== Scalar.Scalar.PLAIN &&
        value.includes('\n')) {
        // Where allowed & type not set explicitly, prefer block style for multiline strings
        return blockString(item, ctx, onComment, onChompKeep);
    }
    if (containsDocumentMarker(value)) {
        if (indent === '') {
            ctx.forceBlockIndent = true;
            return blockString(item, ctx, onComment, onChompKeep);
        }
        else if (implicitKey && indent === indentStep) {
            return quotedString(value, ctx);
        }
    }
    const str = value.replace(/\n+/g, `$&\n${indent}`);
    // Verify that output will be parsed as a string, as e.g. plain numbers and
    // booleans get parsed with those types in v1.2 (e.g. '42', 'true' & '0.9e-3'),
    // and others in v1.1.
    if (actualString) {
        const test = (tag) => tag.default && tag.tag !== 'tag:yaml.org,2002:str' && tag.test?.test(str);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
            return quotedString(value, ctx);
    }
    return implicitKey
        ? str
        : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
}
function stringifyString(item, ctx, onComment, onChompKeep) {
    const { implicitKey, inFlow } = ctx;
    const ss = typeof item.value === 'string'
        ? item
        : Object.assign({}, item, { value: String(item.value) });
    let { type } = item;
    if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        // force double quotes on control characters & unpaired surrogates
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
            type = Scalar.Scalar.QUOTE_DOUBLE;
    }
    const _stringify = (_type) => {
        switch (_type) {
            case Scalar.Scalar.BLOCK_FOLDED:
            case Scalar.Scalar.BLOCK_LITERAL:
                return implicitKey || inFlow
                    ? quotedString(ss.value, ctx) // blocks are not valid inside flow containers
                    : blockString(ss, ctx, onComment, onChompKeep);
            case Scalar.Scalar.QUOTE_DOUBLE:
                return doubleQuotedString(ss.value, ctx);
            case Scalar.Scalar.QUOTE_SINGLE:
                return singleQuotedString(ss.value, ctx);
            case Scalar.Scalar.PLAIN:
                return plainString(ss, ctx, onComment, onChompKeep);
            default:
                return null;
        }
    };
    let res = _stringify(type);
    if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = (implicitKey && defaultKeyType) || defaultStringType;
        res = _stringify(t);
        if (res === null)
            throw new Error(`Unsupported default string type ${t}`);
    }
    return res;
}

exports.stringifyString = stringifyString;

},
function(module,exports,load){
'use strict';

const FOLD_FLOW = 'flow';
const FOLD_BLOCK = 'block';
const FOLD_QUOTED = 'quoted';
/**
 * Tries to keep input at up to `lineWidth` characters, splitting only on spaces
 * not followed by newlines or spaces unless `mode` is `'quoted'`. Lines are
 * terminated with `\n` and started with `indent`.
 */
function foldFlowLines(text, indent, mode = 'flow', { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
    if (!lineWidth || lineWidth < 0)
        return text;
    if (lineWidth < minContentWidth)
        minContentWidth = 0;
    const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
    if (text.length <= endStep)
        return text;
    const folds = [];
    const escapedFolds = {};
    let end = lineWidth - indent.length;
    if (typeof indentAtStart === 'number') {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
            folds.push(0);
        else
            end = lineWidth - indentAtStart;
    }
    let split = undefined;
    let prev = undefined;
    let overflow = false;
    let i = -1;
    let escStart = -1;
    let escEnd = -1;
    if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text, i, indent.length);
        if (i !== -1)
            end = i + endStep;
    }
    for (let ch; (ch = text[(i += 1)]);) {
        if (mode === FOLD_QUOTED && ch === '\\') {
            escStart = i;
            switch (text[i + 1]) {
                case 'x':
                    i += 3;
                    break;
                case 'u':
                    i += 5;
                    break;
                case 'U':
                    i += 9;
                    break;
                default:
                    i += 1;
            }
            escEnd = i;
        }
        if (ch === '\n') {
            if (mode === FOLD_BLOCK)
                i = consumeMoreIndentedLines(text, i, indent.length);
            end = i + indent.length + endStep;
            split = undefined;
        }
        else {
            if (ch === ' ' &&
                prev &&
                prev !== ' ' &&
                prev !== '\n' &&
                prev !== '\t') {
                // space surrounded by non-space can be replaced with newline + indent
                const next = text[i + 1];
                if (next && next !== ' ' && next !== '\n' && next !== '\t')
                    split = i;
            }
            if (i >= end) {
                if (split) {
                    folds.push(split);
                    end = split + endStep;
                    split = undefined;
                }
                else if (mode === FOLD_QUOTED) {
                    // white-space collected at end may stretch past lineWidth
                    while (prev === ' ' || prev === '\t') {
                        prev = ch;
                        ch = text[(i += 1)];
                        overflow = true;
                    }
                    // Account for newline escape, but don't break preceding escape
                    const j = i > escEnd + 1 ? i - 2 : escStart - 1;
                    // Bail out if lineWidth & minContentWidth are shorter than an escape string
                    if (escapedFolds[j])
                        return text;
                    folds.push(j);
                    escapedFolds[j] = true;
                    end = j + endStep;
                    split = undefined;
                }
                else {
                    overflow = true;
                }
            }
        }
        prev = ch;
    }
    if (overflow && onOverflow)
        onOverflow();
    if (folds.length === 0)
        return text;
    if (onFold)
        onFold();
    let res = text.slice(0, folds[0]);
    for (let i = 0; i < folds.length; ++i) {
        const fold = folds[i];
        const end = folds[i + 1] || text.length;
        if (fold === 0)
            res = `\n${indent}${text.slice(0, end)}`;
        else {
            if (mode === FOLD_QUOTED && escapedFolds[fold])
                res += `${text[fold]}\\`;
            res += `\n${indent}${text.slice(fold + 1, end)}`;
        }
    }
    return res;
}
/**
 * Presumes `i + 1` is at the start of a line
 * @returns index of last newline in more-indented block
 */
function consumeMoreIndentedLines(text, i, indent) {
    let end = i;
    let start = i + 1;
    let ch = text[start];
    while (ch === ' ' || ch === '\t') {
        if (i < start + indent) {
            ch = text[++i];
        }
        else {
            do {
                ch = text[++i];
            } while (ch && ch !== '\n');
            end = i;
            start = i + 1;
            ch = text[start];
        }
    }
    return end;
}

exports.FOLD_BLOCK = FOLD_BLOCK;
exports.FOLD_FLOW = FOLD_FLOW;
exports.FOLD_QUOTED = FOLD_QUOTED;
exports.foldFlowLines = foldFlowLines;

},
function(module,exports,load){
'use strict';

var log = load(21);
var merge = load(22);
var stringify = load(16);
var identity = load(3);
var toJS = load(10);

function addPairToJSMap(ctx, map, { key, value }) {
    if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
    // TODO: Should drop this special case for bare << handling
    else if (merge.isMergeKey(ctx, key))
        merge.addMergeToJSMap(ctx, map, value);
    else {
        const jsKey = toJS.toJS(key, '', ctx);
        if (map instanceof Map) {
            map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        }
        else if (map instanceof Set) {
            map.add(jsKey);
        }
        else {
            const stringKey = stringifyKey(key, jsKey, ctx);
            const jsValue = toJS.toJS(value, stringKey, ctx);
            if (stringKey in map)
                Object.defineProperty(map, stringKey, {
                    value: jsValue,
                    writable: true,
                    enumerable: true,
                    configurable: true
                });
            else
                map[stringKey] = jsValue;
        }
    }
    return map;
}
function stringifyKey(key, jsKey, ctx) {
    if (jsKey === null)
        return '';
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    if (typeof jsKey !== 'object')
        return String(jsKey);
    if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify.createStringifyContext(ctx.doc, {});
        strCtx.anchors = new Set();
        for (const node of ctx.anchors.keys())
            strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
            let jsonStr = JSON.stringify(strKey);
            if (jsonStr.length > 40)
                jsonStr = jsonStr.substring(0, 36) + '..."';
            log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
            ctx.mapKeyWarned = true;
        }
        return strKey;
    }
    return JSON.stringify(jsKey);
}

exports.addPairToJSMap = addPairToJSMap;

},
function(module,exports,load){
'use strict';

var node_process = ({env:{}});

function debug(logLevel, ...messages) {
    if (logLevel === 'debug')
        console.log(...messages);
}
function warn(logLevel, warning) {
    if (logLevel === 'debug' || logLevel === 'warn') {
        if (typeof node_process.emitWarning === 'function')
            node_process.emitWarning(warning);
        else
            console.warn(warning);
    }
}

exports.debug = debug;
exports.warn = warn;

},
function(module,exports,load){
'use strict';

var identity = load(3);
var Scalar = load(13);

// If the value associated with a merge key is a single mapping node, each of
// its key/value pairs is inserted into the current mapping, unless the key
// already exists in it. If the value associated with the merge key is a
// sequence, then this sequence is expected to contain mapping nodes and each
// of these nodes is merged in turn according to its order in the sequence.
// Keys in mapping nodes earlier in the sequence override keys specified in
// later mapping nodes. -- http://yaml.org/type/merge.html
const MERGE_KEY = '<<';
const merge = {
    identify: value => value === MERGE_KEY ||
        (typeof value === 'symbol' && value.description === MERGE_KEY),
    default: 'key',
    tag: 'tag:yaml.org,2002:merge',
    test: /^<<$/,
    resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
    }),
    stringify: () => MERGE_KEY
};
const isMergeKey = (ctx, key) => (merge.identify(key) ||
    (identity.isScalar(key) &&
        (!key.type || key.type === Scalar.Scalar.PLAIN) &&
        merge.identify(key.value))) &&
    ctx?.doc.schema.tags.some(tag => tag.tag === merge.tag && tag.default);
function addMergeToJSMap(ctx, map, value) {
    const source = resolveAliasValue(ctx, value);
    if (identity.isSeq(source))
        for (const it of source.items)
            mergeValue(ctx, map, it);
    else if (Array.isArray(source))
        for (const it of source)
            mergeValue(ctx, map, it);
    else
        mergeValue(ctx, map, source);
}
function mergeValue(ctx, map, value) {
    const source = resolveAliasValue(ctx, value);
    if (!identity.isMap(source))
        throw new Error('Merge sources must be maps or map aliases');
    const srcMap = source.toJSON(null, ctx, Map);
    for (const [key, value] of srcMap) {
        if (map instanceof Map) {
            if (!map.has(key))
                map.set(key, value);
        }
        else if (map instanceof Set) {
            map.add(key);
        }
        else if (!Object.prototype.hasOwnProperty.call(map, key)) {
            Object.defineProperty(map, key, {
                value,
                writable: true,
                enumerable: true,
                configurable: true
            });
        }
    }
    return map;
}
function resolveAliasValue(ctx, value) {
    return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
}

exports.addMergeToJSMap = addMergeToJSMap;
exports.isMergeKey = isMergeKey;
exports.merge = merge;

},
function(module,exports,load){
'use strict';

var identity = load(3);
var map = load(24);
var seq = load(27);
var string = load(29);
var tags = load(30);

const sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
class Schema {
    constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat)
            ? tags.getTags(compat, 'compat')
            : compat
                ? tags.getTags(null, compat)
                : null;
        this.name = (typeof schema === 'string' && schema) || 'core';
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        // Used by createMap()
        this.sortMapEntries =
            typeof sortMapEntries === 'function'
                ? sortMapEntries
                : sortMapEntries === true
                    ? sortMapEntriesByKey
                    : null;
    }
    clone() {
        const copy = Object.create(Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
    }
}

exports.Schema = Schema;

},
function(module,exports,load){
'use strict';

var identity = load(3);
var YAMLMap = load(25);

const map = {
    collection: 'map',
    default: true,
    nodeClass: YAMLMap.YAMLMap,
    tag: 'tag:yaml.org,2002:map',
    resolve(map, onError) {
        if (!identity.isMap(map))
            onError('Expected a mapping for this tag');
        return map;
    },
    createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
};

exports.map = map;

},
function(module,exports,load){
'use strict';

var stringifyCollection = load(26);
var addPairToJSMap = load(20);
var Collection = load(11);
var identity = load(3);
var Pair = load(14);
var Scalar = load(13);

function findPair(items, key) {
    const k = identity.isScalar(key) ? key.value : key;
    for (const it of items) {
        if (identity.isPair(it)) {
            if (it.key === key || it.key === k)
                return it;
            if (identity.isScalar(it.key) && it.key.value === k)
                return it;
        }
    }
    return undefined;
}
class YAMLMap extends Collection.Collection {
    static get tagName() {
        return 'tag:yaml.org,2002:map';
    }
    constructor(schema) {
        super(identity.MAP, schema);
        this.items = [];
    }
    /**
     * A generic collection parsing method that can be extended
     * to other node classes that inherit from YAMLMap
     */
    static from(schema, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
            if (typeof replacer === 'function')
                value = replacer.call(obj, key, value);
            else if (Array.isArray(replacer) && !replacer.includes(key))
                return;
            if (value !== undefined || keepUndefined)
                map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj instanceof Map) {
            for (const [key, value] of obj)
                add(key, value);
        }
        else if (obj && typeof obj === 'object') {
            for (const key of Object.keys(obj))
                add(key, obj[key]);
        }
        if (typeof schema.sortMapEntries === 'function') {
            map.items.sort(schema.sortMapEntries);
        }
        return map;
    }
    /**
     * Adds a value to the collection.
     *
     * @param overwrite - If not set `true`, using a key that is already in the
     *   collection will throw. Otherwise, overwrites the previous value.
     */
    add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
            _pair = pair;
        else if (!pair || typeof pair !== 'object' || !('key' in pair)) {
            // In TypeScript, this never happens.
            _pair = new Pair.Pair(pair, pair?.value);
        }
        else
            _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
            if (!overwrite)
                throw new Error(`Key ${_pair.key} already set`);
            // For scalars, keep the old node & its comments and anchors
            if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
                prev.value.value = _pair.value;
            else
                prev.value = _pair.value;
        }
        else if (sortEntries) {
            const i = this.items.findIndex(item => sortEntries(_pair, item) < 0);
            if (i === -1)
                this.items.push(_pair);
            else
                this.items.splice(i, 0, _pair);
        }
        else {
            this.items.push(_pair);
        }
    }
    delete(key) {
        const it = findPair(this.items, key);
        if (!it)
            return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
    }
    get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? undefined;
    }
    has(key) {
        return !!findPair(this.items, key);
    }
    set(key, value) {
        this.add(new Pair.Pair(key, value), true);
    }
    /**
     * @param ctx - Conversion context, originally set in Document#toJS()
     * @param {Class} Type - If set, forces the returned collection type
     * @returns Instance of Type, Map, or Object
     */
    toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? new Map() : {};
        if (ctx?.onCreate)
            ctx.onCreate(map);
        for (const item of this.items)
            addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
    }
    toString(ctx, onComment, onChompKeep) {
        if (!ctx)
            return JSON.stringify(this);
        for (const item of this.items) {
            if (!identity.isPair(item))
                throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
            ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
            blockItemPrefix: '',
            flowChars: { start: '{', end: '}' },
            itemIndent: ctx.indent || '',
            onChompKeep,
            onComment
        });
    }
}

exports.YAMLMap = YAMLMap;
exports.findPair = findPair;

},
function(module,exports,load){
'use strict';

var identity = load(3);
var stringify = load(16);
var stringifyComment = load(17);

function stringifyCollection(collection, ctx, options) {
    const flow = ctx.inFlow ?? collection.flow;
    const stringify = flow ? stringifyFlowCollection : stringifyBlockCollection;
    return stringify(collection, ctx, options);
}
function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
    const { indent, options: { commentString } } = ctx;
    const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
    let chompKeep = false; // flag for the preceding node's status
    const lines = [];
    for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity.isNode(item)) {
            if (!chompKeep && item.spaceBefore)
                lines.push('');
            addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
            if (item.comment)
                comment = item.comment;
        }
        else if (identity.isPair(item)) {
            const ik = identity.isNode(item.key) ? item.key : null;
            if (ik) {
                if (!chompKeep && ik.spaceBefore)
                    lines.push('');
                addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
            }
        }
        chompKeep = false;
        let str = stringify.stringify(item, itemCtx, () => (comment = null), () => (chompKeep = true));
        if (comment)
            str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
        if (chompKeep && comment)
            chompKeep = false;
        lines.push(blockItemPrefix + str);
    }
    let str;
    if (lines.length === 0) {
        str = flowChars.start + flowChars.end;
    }
    else {
        str = lines[0];
        for (let i = 1; i < lines.length; ++i) {
            const line = lines[i];
            str += line ? `\n${indent}${line}` : '\n';
        }
    }
    if (comment) {
        str += '\n' + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
            onComment();
    }
    else if (chompKeep && onChompKeep)
        onChompKeep();
    return str;
}
function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
    const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
    itemIndent += indentStep;
    const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
    });
    let reqNewline = false;
    let linesAtValue = 0;
    const lines = [];
    for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity.isNode(item)) {
            if (item.spaceBefore)
                lines.push('');
            addCommentBefore(ctx, lines, item.commentBefore, false);
            if (item.comment)
                comment = item.comment;
        }
        else if (identity.isPair(item)) {
            const ik = identity.isNode(item.key) ? item.key : null;
            if (ik) {
                if (ik.spaceBefore)
                    lines.push('');
                addCommentBefore(ctx, lines, ik.commentBefore, false);
                if (ik.comment)
                    reqNewline = true;
            }
            const iv = identity.isNode(item.value) ? item.value : null;
            if (iv) {
                if (iv.comment)
                    comment = iv.comment;
                if (iv.commentBefore)
                    reqNewline = true;
            }
            else if (item.value == null && ik?.comment) {
                comment = ik.comment;
            }
        }
        if (comment)
            reqNewline = true;
        let str = stringify.stringify(item, itemCtx, () => (comment = null));
        reqNewline || (reqNewline = lines.length > linesAtValue || str.includes('\n'));
        if (i < items.length - 1) {
            str += ',';
        }
        else if (ctx.options.trailingComma) {
            if (ctx.options.lineWidth > 0) {
                reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) +
                    (str.length + 2) >
                    ctx.options.lineWidth);
            }
            if (reqNewline) {
                str += ',';
            }
        }
        if (comment)
            str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
        lines.push(str);
        linesAtValue = lines.length;
    }
    const { start, end } = flowChars;
    if (lines.length === 0) {
        return start + end;
    }
    else {
        if (!reqNewline) {
            const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
            reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
            let str = start;
            for (const line of lines)
                str += line ? `\n${indentStep}${indent}${line}` : '\n';
            return `${str}\n${indent}${end}`;
        }
        else {
            return `${start}${fcPadding}${lines.join(' ')}${fcPadding}${end}`;
        }
    }
}
function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
    if (comment && chompKeep)
        comment = comment.replace(/^\n+/, '');
    if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic.trimStart()); // Avoid double indent on first line
    }
}

exports.stringifyCollection = stringifyCollection;

},
function(module,exports,load){
'use strict';

var identity = load(3);
var YAMLSeq = load(28);

const seq = {
    collection: 'seq',
    default: true,
    nodeClass: YAMLSeq.YAMLSeq,
    tag: 'tag:yaml.org,2002:seq',
    resolve(seq, onError) {
        if (!identity.isSeq(seq))
            onError('Expected a sequence for this tag');
        return seq;
    },
    createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
};

exports.seq = seq;

},
function(module,exports,load){
'use strict';

var createNode = load(12);
var stringifyCollection = load(26);
var Collection = load(11);
var identity = load(3);
var Scalar = load(13);
var toJS = load(10);

class YAMLSeq extends Collection.Collection {
    static get tagName() {
        return 'tag:yaml.org,2002:seq';
    }
    constructor(schema) {
        super(identity.SEQ, schema);
        this.items = [];
    }
    add(value) {
        this.items.push(value);
    }
    /**
     * Removes a value from the collection.
     *
     * `key` must contain a representation of an integer for this to succeed.
     * It may be wrapped in a `Scalar`.
     *
     * @returns `true` if the item was found and removed.
     */
    delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== 'number')
            return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
    }
    get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== 'number')
            return undefined;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
    }
    /**
     * Checks if the collection includes a value with the key `key`.
     *
     * `key` must contain a representation of an integer for this to succeed.
     * It may be wrapped in a `Scalar`.
     */
    has(key) {
        const idx = asItemIndex(key);
        return typeof idx === 'number' && idx < this.items.length;
    }
    /**
     * Sets a value in this collection. For `!!set`, `value` needs to be a
     * boolean to add/remove the item from the set.
     *
     * If `key` does not contain a representation of an integer, this will throw.
     * It may be wrapped in a `Scalar`.
     */
    set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== 'number')
            throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
            prev.value = value;
        else
            this.items[idx] = value;
    }
    toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
            ctx.onCreate(seq);
        let i = 0;
        for (const item of this.items)
            seq.push(toJS.toJS(item, String(i++), ctx));
        return seq;
    }
    toString(ctx, onComment, onChompKeep) {
        if (!ctx)
            return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
            blockItemPrefix: '- ',
            flowChars: { start: '[', end: ']' },
            itemIndent: (ctx.indent || '') + '  ',
            onChompKeep,
            onComment
        });
    }
    static from(schema, obj, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj && Symbol.iterator in Object(obj)) {
            let i = 0;
            for (let it of obj) {
                if (typeof replacer === 'function') {
                    const key = obj instanceof Set ? it : String(i++);
                    it = replacer.call(obj, key, it);
                }
                seq.items.push(createNode.createNode(it, undefined, ctx));
            }
        }
        return seq;
    }
}
function asItemIndex(key) {
    let idx = identity.isScalar(key) ? key.value : key;
    if (idx && typeof idx === 'string')
        idx = Number(idx);
    return typeof idx === 'number' && Number.isInteger(idx) && idx >= 0
        ? idx
        : null;
}

exports.YAMLSeq = YAMLSeq;

},
function(module,exports,load){
'use strict';

var stringifyString = load(18);

const string = {
    identify: value => typeof value === 'string',
    default: true,
    tag: 'tag:yaml.org,2002:str',
    resolve: str => str,
    stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
    }
};

exports.string = string;

},
function(module,exports,load){
'use strict';

var map = load(24);
var _null = load(31);
var seq = load(27);
var string = load(29);
var bool = load(32);
var float = load(33);
var int = load(35);
var schema = load(36);
var schema$1 = load(37);
var binary = load(38);
var merge = load(22);
var omap = load(39);
var pairs = load(40);
var schema$2 = load(41);
var set = load(45);
var timestamp = load(46);

const schemas = new Map([
    ['core', schema.schema],
    ['failsafe', [map.map, seq.seq, string.string]],
    ['json', schema$1.schema],
    ['yaml11', schema$2.schema],
    ['yaml-1.1', schema$2.schema]
]);
const tagsByName = {
    binary: binary.binary,
    bool: bool.boolTag,
    float: float.float,
    floatExp: float.floatExp,
    floatNaN: float.floatNaN,
    floatTime: timestamp.floatTime,
    int: int.int,
    intHex: int.intHex,
    intOct: int.intOct,
    intTime: timestamp.intTime,
    map: map.map,
    merge: merge.merge,
    null: _null.nullTag,
    omap: omap.omap,
    pairs: pairs.pairs,
    seq: seq.seq,
    set: set.set,
    timestamp: timestamp.timestamp
};
const coreKnownTags = {
    'tag:yaml.org,2002:binary': binary.binary,
    'tag:yaml.org,2002:merge': merge.merge,
    'tag:yaml.org,2002:omap': omap.omap,
    'tag:yaml.org,2002:pairs': pairs.pairs,
    'tag:yaml.org,2002:set': set.set,
    'tag:yaml.org,2002:timestamp': timestamp.timestamp
};
function getTags(customTags, schemaName, addMergeTag) {
    const schemaTags = schemas.get(schemaName);
    if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge.merge)
            ? schemaTags.concat(merge.merge)
            : schemaTags.slice();
    }
    let tags = schemaTags;
    if (!tags) {
        if (Array.isArray(customTags))
            tags = [];
        else {
            const keys = Array.from(schemas.keys())
                .filter(key => key !== 'yaml11')
                .map(key => JSON.stringify(key))
                .join(', ');
            throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
    }
    if (Array.isArray(customTags)) {
        for (const tag of customTags)
            tags = tags.concat(tag);
    }
    else if (typeof customTags === 'function') {
        tags = customTags(tags.slice());
    }
    if (addMergeTag)
        tags = tags.concat(merge.merge);
    return tags.reduce((tags, tag) => {
        const tagObj = typeof tag === 'string' ? tagsByName[tag] : tag;
        if (!tagObj) {
            const tagName = JSON.stringify(tag);
            const keys = Object.keys(tagsByName)
                .map(key => JSON.stringify(key))
                .join(', ');
            throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags.includes(tagObj))
            tags.push(tagObj);
        return tags;
    }, []);
}

exports.coreKnownTags = coreKnownTags;
exports.getTags = getTags;

},
function(module,exports,load){
'use strict';

var Scalar = load(13);

const nullTag = {
    identify: value => value == null,
    createNode: () => new Scalar.Scalar(null),
    default: true,
    tag: 'tag:yaml.org,2002:null',
    test: /^(?:~|[Nn]ull|NULL)?$/,
    resolve: () => new Scalar.Scalar(null),
    stringify: ({ source }, ctx) => typeof source === 'string' && nullTag.test.test(source)
        ? source
        : ctx.options.nullStr
};

exports.nullTag = nullTag;

},
function(module,exports,load){
'use strict';

var Scalar = load(13);

const boolTag = {
    identify: value => typeof value === 'boolean',
    default: true,
    tag: 'tag:yaml.org,2002:bool',
    test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
    resolve: str => new Scalar.Scalar(str[0] === 't' || str[0] === 'T'),
    stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
            const sv = source[0] === 't' || source[0] === 'T';
            if (value === sv)
                return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
};

exports.boolTag = boolTag;

},
function(module,exports,load){
'use strict';

var Scalar = load(13);
var stringifyNumber = load(34);

const floatNaN = {
    identify: value => typeof value === 'number',
    default: true,
    tag: 'tag:yaml.org,2002:float',
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: str => str.slice(-3).toLowerCase() === 'nan'
        ? NaN
        : str[0] === '-'
            ? Number.NEGATIVE_INFINITY
            : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber.stringifyNumber
};
const floatExp = {
    identify: value => typeof value === 'number',
    default: true,
    tag: 'tag:yaml.org,2002:float',
    format: 'EXP',
    test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
    resolve: str => parseFloat(str),
    stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
    }
};
const float = {
    identify: value => typeof value === 'number',
    default: true,
    tag: 'tag:yaml.org,2002:float',
    test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
    resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str));
        const dot = str.indexOf('.');
        if (dot !== -1 && str[str.length - 1] === '0')
            node.minFractionDigits = str.length - dot - 1;
        return node;
    },
    stringify: stringifyNumber.stringifyNumber
};

exports.float = float;
exports.floatExp = floatExp;
exports.floatNaN = floatNaN;

},
function(module,exports,load){
'use strict';

function stringifyNumber({ format, minFractionDigits, tag, value }) {
    if (typeof value === 'bigint')
        return String(value);
    const num = typeof value === 'number' ? value : Number(value);
    if (!isFinite(num))
        return isNaN(num) ? '.nan' : num < 0 ? '-.inf' : '.inf';
    let n = Object.is(value, -0) ? '-0' : JSON.stringify(value);
    if (!format &&
        minFractionDigits &&
        (!tag || tag === 'tag:yaml.org,2002:float') &&
        /^-?\d/.test(n) &&
        !n.includes('e')) {
        let i = n.indexOf('.');
        if (i < 0) {
            i = n.length;
            n += '.';
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
            n += '0';
    }
    return n;
}

exports.stringifyNumber = stringifyNumber;

},
function(module,exports,load){
'use strict';

var stringifyNumber = load(34);

const intIdentify = (value) => typeof value === 'bigint' || Number.isInteger(value);
const intResolve = (str, offset, radix, { intAsBigInt }) => (intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix));
function intStringify(node, radix, prefix) {
    const { value } = node;
    if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
    return stringifyNumber.stringifyNumber(node);
}
const intOct = {
    identify: value => intIdentify(value) && value >= 0,
    default: true,
    tag: 'tag:yaml.org,2002:int',
    format: 'OCT',
    test: /^0o[0-7]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
    stringify: node => intStringify(node, 8, '0o')
};
const int = {
    identify: intIdentify,
    default: true,
    tag: 'tag:yaml.org,2002:int',
    test: /^[-+]?[0-9]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
    stringify: stringifyNumber.stringifyNumber
};
const intHex = {
    identify: value => intIdentify(value) && value >= 0,
    default: true,
    tag: 'tag:yaml.org,2002:int',
    format: 'HEX',
    test: /^0x[0-9a-fA-F]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
    stringify: node => intStringify(node, 16, '0x')
};

exports.int = int;
exports.intHex = intHex;
exports.intOct = intOct;

},
function(module,exports,load){
'use strict';

var map = load(24);
var _null = load(31);
var seq = load(27);
var string = load(29);
var bool = load(32);
var float = load(33);
var int = load(35);

const schema = [
    map.map,
    seq.seq,
    string.string,
    _null.nullTag,
    bool.boolTag,
    int.intOct,
    int.int,
    int.intHex,
    float.floatNaN,
    float.floatExp,
    float.float
];

exports.schema = schema;

},
function(module,exports,load){
'use strict';

var Scalar = load(13);
var map = load(24);
var seq = load(27);

function intIdentify(value) {
    return typeof value === 'bigint' || Number.isInteger(value);
}
const stringifyJSON = ({ value }) => JSON.stringify(value);
const jsonScalars = [
    {
        identify: value => typeof value === 'string',
        default: true,
        tag: 'tag:yaml.org,2002:str',
        resolve: str => str,
        stringify: stringifyJSON
    },
    {
        identify: value => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: 'tag:yaml.org,2002:null',
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
    },
    {
        identify: value => typeof value === 'boolean',
        default: true,
        tag: 'tag:yaml.org,2002:bool',
        test: /^true$|^false$/,
        resolve: str => str === 'true',
        stringify: stringifyJSON
    },
    {
        identify: intIdentify,
        default: true,
        tag: 'tag:yaml.org,2002:int',
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
    },
    {
        identify: value => typeof value === 'number',
        default: true,
        tag: 'tag:yaml.org,2002:float',
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: str => parseFloat(str),
        stringify: stringifyJSON
    }
];
const jsonError = {
    default: true,
    tag: '',
    test: /^/,
    resolve(str, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
        return str;
    }
};
const schema = [map.map, seq.seq].concat(jsonScalars, jsonError);

exports.schema = schema;

},
function(module,exports,load){
'use strict';

var node_buffer = ({});
var Scalar = load(13);
var stringifyString = load(18);

const binary = {
    identify: value => value instanceof Uint8Array, // Buffer inherits from Uint8Array
    default: false,
    tag: 'tag:yaml.org,2002:binary',
    /**
     * Returns a Buffer in node and an Uint8Array in browsers
     *
     * To use the resulting buffer as an image, you'll want to do something like:
     *
     *   const blob = new Blob([buffer], { type: 'image/jpeg' })
     *   document.querySelector('#photo').src = URL.createObjectURL(blob)
     */
    resolve(src, onError) {
        if (typeof node_buffer.Buffer === 'function') {
            return node_buffer.Buffer.from(src, 'base64');
        }
        else if (typeof atob === 'function') {
            // On IE 11, atob() can't handle newlines
            const str = atob(src.replace(/[\n\r]/g, ''));
            const buffer = new Uint8Array(str.length);
            for (let i = 0; i < str.length; ++i)
                buffer[i] = str.charCodeAt(i);
            return buffer;
        }
        else {
            onError('This environment does not support reading binary tags; either Buffer or atob is required');
            return src;
        }
    },
    stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
            return '';
        const buf = value; // checked earlier by binary.identify()
        let str;
        if (typeof node_buffer.Buffer === 'function') {
            str =
                buf instanceof node_buffer.Buffer
                    ? buf.toString('base64')
                    : node_buffer.Buffer.from(buf.buffer).toString('base64');
        }
        else if (typeof btoa === 'function') {
            let s = '';
            for (let i = 0; i < buf.length; ++i)
                s += String.fromCharCode(buf[i]);
            str = btoa(s);
        }
        else {
            throw new Error('This environment does not support writing binary tags; either Buffer or btoa is required');
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
            const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
            const n = Math.ceil(str.length / lineWidth);
            const lines = new Array(n);
            for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
                lines[i] = str.substr(o, lineWidth);
            }
            str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? '\n' : ' ');
        }
        return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
    }
};

exports.binary = binary;

},
function(module,exports,load){
'use strict';

var identity = load(3);
var toJS = load(10);
var YAMLMap = load(25);
var YAMLSeq = load(28);
var pairs = load(40);

class YAMLOMap extends YAMLSeq.YAMLSeq {
    constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = YAMLOMap.tag;
    }
    /**
     * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
     * but TypeScript won't allow widening the signature of a child method.
     */
    toJSON(_, ctx) {
        if (!ctx)
            return super.toJSON(_);
        const map = new Map();
        if (ctx?.onCreate)
            ctx.onCreate(map);
        for (const pair of this.items) {
            let key, value;
            if (identity.isPair(pair)) {
                key = toJS.toJS(pair.key, '', ctx);
                value = toJS.toJS(pair.value, key, ctx);
            }
            else {
                key = toJS.toJS(pair, '', ctx);
            }
            if (map.has(key))
                throw new Error('Ordered maps must not include duplicate keys');
            map.set(key, value);
        }
        return map;
    }
    static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap = new this();
        omap.items = pairs$1.items;
        return omap;
    }
}
YAMLOMap.tag = 'tag:yaml.org,2002:omap';
const omap = {
    collection: 'seq',
    identify: value => value instanceof Map,
    nodeClass: YAMLOMap,
    default: false,
    tag: 'tag:yaml.org,2002:omap',
    resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
            if (identity.isScalar(key)) {
                if (seenKeys.includes(key.value)) {
                    onError(`Ordered maps must not include duplicate keys: ${key.value}`);
                }
                else {
                    seenKeys.push(key.value);
                }
            }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
    },
    createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
};

exports.YAMLOMap = YAMLOMap;
exports.omap = omap;

},
function(module,exports,load){
'use strict';

var identity = load(3);
var Pair = load(14);
var Scalar = load(13);
var YAMLSeq = load(28);

function resolvePairs(seq, onError) {
    if (identity.isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
            let item = seq.items[i];
            if (identity.isPair(item))
                continue;
            else if (identity.isMap(item)) {
                if (item.items.length > 1)
                    onError('Each pair must have its own sequence indicator');
                const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
                if (item.commentBefore)
                    pair.key.commentBefore = pair.key.commentBefore
                        ? `${item.commentBefore}\n${pair.key.commentBefore}`
                        : item.commentBefore;
                if (item.comment) {
                    const cn = pair.value ?? pair.key;
                    cn.comment = cn.comment
                        ? `${item.comment}\n${cn.comment}`
                        : item.comment;
                }
                item = pair;
            }
            seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
    }
    else
        onError('Expected a sequence for this tag');
    return seq;
}
function createPairs(schema, iterable, ctx) {
    const { replacer } = ctx;
    const pairs = new YAMLSeq.YAMLSeq(schema);
    pairs.tag = 'tag:yaml.org,2002:pairs';
    let i = 0;
    if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
            if (typeof replacer === 'function')
                it = replacer.call(iterable, String(i++), it);
            let key, value;
            if (Array.isArray(it)) {
                if (it.length === 2) {
                    key = it[0];
                    value = it[1];
                }
                else
                    throw new TypeError(`Expected [key, value] tuple: ${it}`);
            }
            else if (it && it instanceof Object) {
                const keys = Object.keys(it);
                if (keys.length === 1) {
                    key = keys[0];
                    value = it[key];
                }
                else {
                    throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
                }
            }
            else {
                key = it;
            }
            pairs.items.push(Pair.createPair(key, value, ctx));
        }
    return pairs;
}
const pairs = {
    collection: 'seq',
    default: false,
    tag: 'tag:yaml.org,2002:pairs',
    resolve: resolvePairs,
    createNode: createPairs
};

exports.createPairs = createPairs;
exports.pairs = pairs;
exports.resolvePairs = resolvePairs;

},
function(module,exports,load){
'use strict';

var map = load(24);
var _null = load(31);
var seq = load(27);
var string = load(29);
var binary = load(38);
var bool = load(42);
var float = load(43);
var int = load(44);
var merge = load(22);
var omap = load(39);
var pairs = load(40);
var set = load(45);
var timestamp = load(46);

const schema = [
    map.map,
    seq.seq,
    string.string,
    _null.nullTag,
    bool.trueTag,
    bool.falseTag,
    int.intBin,
    int.intOct,
    int.int,
    int.intHex,
    float.floatNaN,
    float.floatExp,
    float.float,
    binary.binary,
    merge.merge,
    omap.omap,
    pairs.pairs,
    set.set,
    timestamp.intTime,
    timestamp.floatTime,
    timestamp.timestamp
];

exports.schema = schema;

},
function(module,exports,load){
'use strict';

var Scalar = load(13);

function boolStringify({ value, source }, ctx) {
    const boolObj = value ? trueTag : falseTag;
    if (source && boolObj.test.test(source))
        return source;
    return value ? ctx.options.trueStr : ctx.options.falseStr;
}
const trueTag = {
    identify: value => value === true,
    default: true,
    tag: 'tag:yaml.org,2002:bool',
    test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
    resolve: () => new Scalar.Scalar(true),
    stringify: boolStringify
};
const falseTag = {
    identify: value => value === false,
    default: true,
    tag: 'tag:yaml.org,2002:bool',
    test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
    resolve: () => new Scalar.Scalar(false),
    stringify: boolStringify
};

exports.falseTag = falseTag;
exports.trueTag = trueTag;

},
function(module,exports,load){
'use strict';

var Scalar = load(13);
var stringifyNumber = load(34);

const floatNaN = {
    identify: value => typeof value === 'number',
    default: true,
    tag: 'tag:yaml.org,2002:float',
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: (str) => str.slice(-3).toLowerCase() === 'nan'
        ? NaN
        : str[0] === '-'
            ? Number.NEGATIVE_INFINITY
            : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber.stringifyNumber
};
const floatExp = {
    identify: value => typeof value === 'number',
    default: true,
    tag: 'tag:yaml.org,2002:float',
    format: 'EXP',
    test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
    resolve: (str) => parseFloat(str.replace(/_/g, '')),
    stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
    }
};
const float = {
    identify: value => typeof value === 'number',
    default: true,
    tag: 'tag:yaml.org,2002:float',
    test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
    resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, '')));
        const dot = str.indexOf('.');
        if (dot !== -1) {
            const f = str.substring(dot + 1).replace(/_/g, '');
            if (f[f.length - 1] === '0')
                node.minFractionDigits = f.length;
        }
        return node;
    },
    stringify: stringifyNumber.stringifyNumber
};

exports.float = float;
exports.floatExp = floatExp;
exports.floatNaN = floatNaN;

},
function(module,exports,load){
'use strict';

var stringifyNumber = load(34);

const intIdentify = (value) => typeof value === 'bigint' || Number.isInteger(value);
function intResolve(str, offset, radix, { intAsBigInt }) {
    const sign = str[0];
    if (sign === '-' || sign === '+')
        offset += 1;
    str = str.substring(offset).replace(/_/g, '');
    if (intAsBigInt) {
        switch (radix) {
            case 2:
                str = `0b${str}`;
                break;
            case 8:
                str = `0o${str}`;
                break;
            case 16:
                str = `0x${str}`;
                break;
        }
        const n = BigInt(str);
        return sign === '-' ? BigInt(-1) * n : n;
    }
    const n = parseInt(str, radix);
    return sign === '-' ? -1 * n : n;
}
function intStringify(node, radix, prefix) {
    const { value } = node;
    if (intIdentify(value)) {
        const str = value.toString(radix);
        return value < 0 ? '-' + prefix + str.substr(1) : prefix + str;
    }
    return stringifyNumber.stringifyNumber(node);
}
const intBin = {
    identify: intIdentify,
    default: true,
    tag: 'tag:yaml.org,2002:int',
    format: 'BIN',
    test: /^[-+]?0b[0-1_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
    stringify: node => intStringify(node, 2, '0b')
};
const intOct = {
    identify: intIdentify,
    default: true,
    tag: 'tag:yaml.org,2002:int',
    format: 'OCT',
    test: /^[-+]?0[0-7_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
    stringify: node => intStringify(node, 8, '0')
};
const int = {
    identify: intIdentify,
    default: true,
    tag: 'tag:yaml.org,2002:int',
    test: /^[-+]?[0-9][0-9_]*$/,
    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
    stringify: stringifyNumber.stringifyNumber
};
const intHex = {
    identify: intIdentify,
    default: true,
    tag: 'tag:yaml.org,2002:int',
    format: 'HEX',
    test: /^[-+]?0x[0-9a-fA-F_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
    stringify: node => intStringify(node, 16, '0x')
};

exports.int = int;
exports.intBin = intBin;
exports.intHex = intHex;
exports.intOct = intOct;

},
function(module,exports,load){
'use strict';

var identity = load(3);
var Pair = load(14);
var YAMLMap = load(25);

class YAMLSet extends YAMLMap.YAMLMap {
    constructor(schema) {
        super(schema);
        this.tag = YAMLSet.tag;
    }
    add(key) {
        let pair;
        if (identity.isPair(key))
            pair = key;
        else if (key &&
            typeof key === 'object' &&
            'key' in key &&
            'value' in key &&
            key.value === null)
            pair = new Pair.Pair(key.key, null);
        else
            pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
            this.items.push(pair);
    }
    /**
     * If `keepPair` is `true`, returns the Pair matching `key`.
     * Otherwise, returns the value of that Pair's key.
     */
    get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair)
            ? identity.isScalar(pair.key)
                ? pair.key.value
                : pair.key
            : pair;
    }
    set(key, value) {
        if (typeof value !== 'boolean')
            throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
            this.items.splice(this.items.indexOf(prev), 1);
        }
        else if (!prev && value) {
            this.items.push(new Pair.Pair(key));
        }
    }
    toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
    }
    toString(ctx, onComment, onChompKeep) {
        if (!ctx)
            return JSON.stringify(this);
        if (this.hasAllNullValues(true))
            return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
            throw new Error('Set items must all have null values');
    }
    static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
            for (let value of iterable) {
                if (typeof replacer === 'function')
                    value = replacer.call(iterable, value, value);
                set.items.push(Pair.createPair(value, null, ctx));
            }
        return set;
    }
}
YAMLSet.tag = 'tag:yaml.org,2002:set';
const set = {
    collection: 'map',
    identify: value => value instanceof Set,
    nodeClass: YAMLSet,
    default: false,
    tag: 'tag:yaml.org,2002:set',
    createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
    resolve(map, onError) {
        if (identity.isMap(map)) {
            if (map.hasAllNullValues(true))
                return Object.assign(new YAMLSet(), map);
            else
                onError('Set items must all have null values');
        }
        else
            onError('Expected a mapping for this tag');
        return map;
    }
};

exports.YAMLSet = YAMLSet;
exports.set = set;

},
function(module,exports,load){
'use strict';

var stringifyNumber = load(34);

/** Internal types handle bigint as number, because TS can't figure it out. */
function parseSexagesimal(str, asBigInt) {
    const sign = str[0];
    const parts = sign === '-' || sign === '+' ? str.substring(1) : str;
    const num = (n) => asBigInt ? BigInt(n) : Number(n);
    const res = parts
        .replace(/_/g, '')
        .split(':')
        .reduce((res, p) => res * num(60) + num(p), num(0));
    return (sign === '-' ? num(-1) * res : res);
}
/**
 * hhhh:mm:ss.sss
 *
 * Internal types handle bigint as number, because TS can't figure it out.
 */
function stringifySexagesimal(node) {
    let { value } = node;
    let num = (n) => n;
    if (typeof value === 'bigint')
        num = n => BigInt(n);
    else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
    let sign = '';
    if (value < 0) {
        sign = '-';
        value *= num(-1);
    }
    const _60 = num(60);
    const parts = [value % _60]; // seconds, including ms
    if (value < 60) {
        parts.unshift(0); // at least one : is required
    }
    else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60); // minutes
        if (value >= 60) {
            value = (value - parts[0]) / _60;
            parts.unshift(value); // hours
        }
    }
    return (sign +
        parts
            .map(n => String(n).padStart(2, '0'))
            .join(':')
            .replace(/000000\d*$/, '') // % 60 may introduce error
    );
}
const intTime = {
    identify: value => typeof value === 'bigint' || Number.isInteger(value),
    default: true,
    tag: 'tag:yaml.org,2002:int',
    format: 'TIME',
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
    resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
    stringify: stringifySexagesimal
};
const floatTime = {
    identify: value => typeof value === 'number',
    default: true,
    tag: 'tag:yaml.org,2002:float',
    format: 'TIME',
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
    resolve: str => parseSexagesimal(str, false),
    stringify: stringifySexagesimal
};
const timestamp = {
    identify: value => value instanceof Date,
    default: true,
    tag: 'tag:yaml.org,2002:timestamp',
    // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
    // may be omitted altogether, resulting in a date format. In such a case, the time part is
    // assumed to be 00:00:00Z (start of day, UTC).
    test: RegExp('^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})' + // YYYY-Mm-Dd
        '(?:' + // time is optional
        '(?:t|T|[ \\t]+)' + // t | T | whitespace
        '([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)' + // Hh:Mm:Ss(.ss)?
        '(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?' + // Z | +5 | -03:30
        ')?$'),
    resolve(str) {
        const match = str.match(timestamp.test);
        if (!match)
            throw new Error('!!timestamp expects a date, starting with yyyy-mm-dd');
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + '00').substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== 'Z') {
            let d = parseSexagesimal(tz, false);
            if (Math.abs(d) < 30)
                d *= 60;
            date -= 60000 * d;
        }
        return new Date(date);
    },
    stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, '') ?? ''
};

exports.floatTime = floatTime;
exports.intTime = intTime;
exports.timestamp = timestamp;

},
function(module,exports,load){
'use strict';

var identity = load(3);
var stringify = load(16);
var stringifyComment = load(17);

function stringifyDocument(doc, options) {
    const lines = [];
    let hasDirectives = options.directives === true;
    if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
            lines.push(dir);
            hasDirectives = true;
        }
        else if (doc.directives.docStart)
            hasDirectives = true;
    }
    if (hasDirectives)
        lines.push('---');
    const ctx = stringify.createStringifyContext(doc, options);
    const { commentString } = ctx.options;
    if (doc.commentBefore) {
        if (lines.length !== 1)
            lines.unshift('');
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ''));
    }
    let chompKeep = false;
    let contentComment = null;
    if (doc.contents) {
        if (identity.isNode(doc.contents)) {
            if (doc.contents.spaceBefore && hasDirectives)
                lines.push('');
            if (doc.contents.commentBefore) {
                const cs = commentString(doc.contents.commentBefore);
                lines.push(stringifyComment.indentComment(cs, ''));
            }
            // top-level block scalars need to be indented if followed by a comment
            ctx.forceBlockIndent = !!doc.comment;
            contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? undefined : () => (chompKeep = true);
        let body = stringify.stringify(doc.contents, ctx, () => (contentComment = null), onChompKeep);
        if (contentComment)
            body += stringifyComment.lineComment(body, '', commentString(contentComment));
        if ((body[0] === '|' || body[0] === '>') &&
            lines[lines.length - 1] === '---') {
            // Top-level block scalars with a preceding doc marker ought to use the
            // same line for their header.
            lines[lines.length - 1] = `--- ${body}`;
        }
        else
            lines.push(body);
    }
    else {
        lines.push(stringify.stringify(doc.contents, ctx));
    }
    if (doc.directives?.docEnd) {
        if (doc.comment) {
            const cs = commentString(doc.comment);
            if (cs.includes('\n')) {
                lines.push('...');
                lines.push(stringifyComment.indentComment(cs, ''));
            }
            else {
                lines.push(`... ${cs}`);
            }
        }
        else {
            lines.push('...');
        }
    }
    else {
        let dc = doc.comment;
        if (dc && chompKeep)
            dc = dc.replace(/^\n+/, '');
        if (dc) {
            if ((!chompKeep || contentComment) && lines[lines.length - 1] !== '')
                lines.push('');
            lines.push(stringifyComment.indentComment(commentString(dc), ''));
        }
    }
    return lines.join('\n') + '\n';
}

exports.stringifyDocument = stringifyDocument;

},
function(module,exports,load){
'use strict';

class YAMLError extends Error {
    constructor(name, pos, code, message) {
        super();
        this.name = name;
        this.code = code;
        this.message = message;
        this.pos = pos;
    }
}
class YAMLParseError extends YAMLError {
    constructor(pos, code, message) {
        super('YAMLParseError', pos, code, message);
    }
}
class YAMLWarning extends YAMLError {
    constructor(pos, code, message) {
        super('YAMLWarning', pos, code, message);
    }
}
const prettifyError = (src, lc) => (error) => {
    if (error.pos[0] === -1)
        return;
    error.linePos = error.pos.map(pos => lc.linePos(pos));
    const { line, col } = error.linePos[0];
    error.message += ` at line ${line}, column ${col}`;
    let ci = col - 1;
    let lineStr = src
        .substring(lc.lineStarts[line - 1], lc.lineStarts[line])
        .replace(/[\n\r]+$/, '');
    // Trim to max 80 chars, keeping col position near the middle
    if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = '…' + lineStr.substring(trimStart);
        ci -= trimStart - 1;
    }
    if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + '…';
    // Include previous line in context if pointing at line start
    if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        // Regexp won't match if start is trimmed
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
            prev = prev.substring(0, 79) + '…\n';
        lineStr = prev + lineStr;
    }
    if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
            count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = ' '.repeat(ci) + '^'.repeat(count);
        error.message += `:\n\n${lineStr}\n${pointer}\n`;
    }
};

exports.YAMLError = YAMLError;
exports.YAMLParseError = YAMLParseError;
exports.YAMLWarning = YAMLWarning;
exports.prettifyError = prettifyError;

},
function(module,exports,load){
'use strict';

var Document = load(5);
var composeNode = load(50);
var resolveEnd = load(59);
var resolveProps = load(53);

function composeDoc(options, directives, { offset, start, value, end }, onError) {
    const opts = Object.assign({ _directives: directives }, options);
    const doc = new Document.Document(undefined, opts);
    const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
    };
    const props = resolveProps.resolveProps(start, {
        indicator: 'doc-start',
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
    });
    if (props.found) {
        doc.directives.docStart = true;
        if (value &&
            (value.type === 'block-map' || value.type === 'block-seq') &&
            !props.hasNewline)
            onError(props.end, 'MISSING_CHAR', 'Block collection cannot start on same line with directives-end marker');
    }
    // @ts-expect-error If Contents is set, let's trust the user
    doc.contents = value
        ? composeNode.composeNode(ctx, value, props, onError)
        : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
    const contentEnd = doc.contents.range[2];
    const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
    if (re.comment)
        doc.comment = re.comment;
    doc.range = [offset, contentEnd, re.offset];
    return doc;
}

exports.composeDoc = composeDoc;

},
function(module,exports,load){
'use strict';

var Alias = load(6);
var identity = load(3);
var composeCollection = load(51);
var composeScalar = load(60);
var resolveEnd = load(59);
var utilEmptyScalarPosition = load(63);

const CN = { composeNode, composeEmptyNode };
function composeNode(ctx, token, props, onError) {
    const atKey = ctx.atKey;
    const { spaceBefore, comment, anchor, tag } = props;
    let node;
    let isSrcToken = true;
    switch (token.type) {
        case 'alias':
            node = composeAlias(ctx, token, onError);
            if (anchor || tag)
                onError(token, 'ALIAS_PROPS', 'An alias node must not specify any properties');
            break;
        case 'scalar':
        case 'single-quoted-scalar':
        case 'double-quoted-scalar':
        case 'block-scalar':
            node = composeScalar.composeScalar(ctx, token, tag, onError);
            if (anchor)
                node.anchor = anchor.source.substring(1);
            break;
        case 'block-map':
        case 'block-seq':
        case 'flow-collection':
            try {
                node = composeCollection.composeCollection(CN, ctx, token, props, onError);
                if (anchor)
                    node.anchor = anchor.source.substring(1);
            }
            catch (error) {
                // Almost certainly here due to a stack overflow
                const message = error instanceof Error ? error.message : String(error);
                onError(token, 'RESOURCE_EXHAUSTION', message);
            }
            break;
        default: {
            const message = token.type === 'error'
                ? token.message
                : `Unsupported token (type: ${token.type})`;
            onError(token, 'UNEXPECTED_TOKEN', message);
            isSrcToken = false;
        }
    }
    node ?? (node = composeEmptyNode(ctx, token.offset, undefined, null, props, onError));
    if (anchor && node.anchor === '')
        onError(anchor, 'BAD_ALIAS', 'Anchor cannot be an empty string');
    if (atKey &&
        ctx.options.stringKeys &&
        (!identity.isScalar(node) ||
            typeof node.value !== 'string' ||
            (node.tag && node.tag !== 'tag:yaml.org,2002:str'))) {
        const msg = 'With stringKeys, all keys must be strings';
        onError(tag ?? token, 'NON_STRING_KEY', msg);
    }
    if (spaceBefore)
        node.spaceBefore = true;
    if (comment) {
        if (token.type === 'scalar' && token.source === '')
            node.comment = comment;
        else
            node.commentBefore = comment;
    }
    // @ts-expect-error Type checking misses meaning of isSrcToken
    if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
    return node;
}
function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
    const token = {
        type: 'scalar',
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ''
    };
    const node = composeScalar.composeScalar(ctx, token, tag, onError);
    if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === '')
            onError(anchor, 'BAD_ALIAS', 'Anchor cannot be an empty string');
    }
    if (spaceBefore)
        node.spaceBefore = true;
    if (comment) {
        node.comment = comment;
        node.range[2] = end;
    }
    return node;
}
function composeAlias({ options }, { offset, source, end }, onError) {
    const alias = new Alias.Alias(source.substring(1));
    if (alias.source === '')
        onError(offset, 'BAD_ALIAS', 'Alias cannot be an empty string');
    if (alias.source.endsWith(':'))
        onError(offset + source.length - 1, 'BAD_ALIAS', 'Alias ending in : is ambiguous', true);
    const valueEnd = offset + source.length;
    const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
    alias.range = [offset, valueEnd, re.offset];
    if (re.comment)
        alias.comment = re.comment;
    return alias;
}

exports.composeEmptyNode = composeEmptyNode;
exports.composeNode = composeNode;

},
function(module,exports,load){
'use strict';

var identity = load(3);
var Scalar = load(13);
var YAMLMap = load(25);
var YAMLSeq = load(28);
var resolveBlockMap = load(52);
var resolveBlockSeq = load(57);
var resolveFlowCollection = load(58);

function resolveCollection(CN, ctx, token, onError, tagName, tag) {
    const coll = token.type === 'block-map'
        ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag)
        : token.type === 'block-seq'
            ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag)
            : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
    const Coll = coll.constructor;
    // If we got a tagName matching the class, or the tag name is '!',
    // then use the tagName from the node class used to create it.
    if (tagName === '!' || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
    }
    if (tagName)
        coll.tag = tagName;
    return coll;
}
function composeCollection(CN, ctx, token, props, onError) {
    const tagToken = props.tag;
    const tagName = !tagToken
        ? null
        : ctx.directives.tagName(tagToken.source, msg => onError(tagToken, 'TAG_RESOLVE_FAILED', msg));
    if (token.type === 'block-seq') {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken
            ? anchor.offset > tagToken.offset
                ? anchor
                : tagToken
            : (anchor ?? tagToken);
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
            const message = 'Missing newline after block sequence props';
            onError(lastProp, 'MISSING_CHAR', message);
        }
    }
    const expType = token.type === 'block-map'
        ? 'map'
        : token.type === 'block-seq'
            ? 'seq'
            : token.start.source === '{'
                ? 'map'
                : 'seq';
    // shortcut: check if it's a generic YAMLMap or YAMLSeq
    // before jumping into the custom tag logic.
    if (!tagToken ||
        !tagName ||
        tagName === '!' ||
        (tagName === YAMLMap.YAMLMap.tagName && expType === 'map') ||
        (tagName === YAMLSeq.YAMLSeq.tagName && expType === 'seq')) {
        return resolveCollection(CN, ctx, token, onError, tagName);
    }
    let tag = ctx.schema.tags.find(t => t.tag === tagName && t.collection === expType);
    if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
            ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
            tag = kt;
        }
        else {
            if (kt) {
                onError(tagToken, 'BAD_COLLECTION_TYPE', `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? 'scalar'}`, true);
            }
            else {
                onError(tagToken, 'TAG_RESOLVE_FAILED', `Unresolved tag: ${tagName}`, true);
            }
            return resolveCollection(CN, ctx, token, onError, tagName);
        }
    }
    const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
    const res = tag.resolve?.(coll, msg => onError(tagToken, 'TAG_RESOLVE_FAILED', msg), ctx.options) ?? coll;
    const node = identity.isNode(res)
        ? res
        : new Scalar.Scalar(res);
    node.range = coll.range;
    node.tag = tagName;
    if (tag?.format)
        node.format = tag.format;
    return node;
}

exports.composeCollection = composeCollection;

},
function(module,exports,load){
'use strict';

var Pair = load(14);
var YAMLMap = load(25);
var resolveProps = load(53);
var utilContainsNewline = load(54);
var utilFlowIndentCheck = load(55);
var utilMapIncludes = load(56);

const startColMsg = 'All mapping items must start at the same column';
function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
    const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
    const map = new NodeClass(ctx.schema);
    if (ctx.atRoot)
        ctx.atRoot = false;
    let offset = bm.offset;
    let commentEnd = null;
    for (const collItem of bm.items) {
        const { start, key, sep, value } = collItem;
        // key properties
        const keyProps = resolveProps.resolveProps(start, {
            indicator: 'explicit-key-ind',
            next: key ?? sep?.[0],
            offset,
            onError,
            parentIndent: bm.indent,
            startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
            if (key) {
                if (key.type === 'block-seq')
                    onError(offset, 'BLOCK_AS_IMPLICIT_KEY', 'A block sequence may not be used as an implicit map key');
                else if ('indent' in key && key.indent !== bm.indent)
                    onError(offset, 'BAD_INDENT', startColMsg);
            }
            if (!keyProps.anchor && !keyProps.tag && !sep) {
                commentEnd = keyProps.end;
                if (keyProps.comment) {
                    if (map.comment)
                        map.comment += '\n' + keyProps.comment;
                    else
                        map.comment = keyProps.comment;
                }
                continue;
            }
            if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
                onError(key ?? start[start.length - 1], 'MULTILINE_IMPLICIT_KEY', 'Implicit keys need to be on a single line');
            }
        }
        else if (keyProps.found?.indent !== bm.indent) {
            onError(offset, 'BAD_INDENT', startColMsg);
        }
        // key value
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key
            ? composeNode(ctx, key, keyProps, onError)
            : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
            onError(keyStart, 'DUPLICATE_KEY', 'Map keys must be unique');
        // value properties
        const valueProps = resolveProps.resolveProps(sep ?? [], {
            indicator: 'map-value-ind',
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: bm.indent,
            startOnNewline: !key || key.type === 'block-scalar'
        });
        offset = valueProps.end;
        if (valueProps.found) {
            if (implicitKey) {
                if (value?.type === 'block-map' && !valueProps.hasNewline)
                    onError(offset, 'BLOCK_AS_IMPLICIT_KEY', 'Nested mappings are not allowed in compact mappings');
                if (ctx.options.strict &&
                    keyProps.start < valueProps.found.offset - 1024)
                    onError(keyNode.range, 'KEY_OVER_1024_CHARS', 'The : indicator must be at most 1024 chars after the start of an implicit block mapping key');
            }
            // value value
            const valueNode = value
                ? composeNode(ctx, value, valueProps, onError)
                : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
            if (ctx.schema.compat)
                utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
            offset = valueNode.range[2];
            const pair = new Pair.Pair(keyNode, valueNode);
            if (ctx.options.keepSourceTokens)
                pair.srcToken = collItem;
            map.items.push(pair);
        }
        else {
            // key with no value
            if (implicitKey)
                onError(keyNode.range, 'MISSING_CHAR', 'Implicit map keys need to be followed by map values');
            if (valueProps.comment) {
                if (keyNode.comment)
                    keyNode.comment += '\n' + valueProps.comment;
                else
                    keyNode.comment = valueProps.comment;
            }
            const pair = new Pair.Pair(keyNode);
            if (ctx.options.keepSourceTokens)
                pair.srcToken = collItem;
            map.items.push(pair);
        }
    }
    if (commentEnd && commentEnd < offset)
        onError(commentEnd, 'IMPOSSIBLE', 'Map comment with trailing content');
    map.range = [bm.offset, offset, commentEnd ?? offset];
    return map;
}

exports.resolveBlockMap = resolveBlockMap;

},
function(module,exports,load){
'use strict';

function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
    let spaceBefore = false;
    let atNewline = startOnNewline;
    let hasSpace = startOnNewline;
    let comment = '';
    let commentSep = '';
    let hasNewline = false;
    let reqSpace = false;
    let tab = null;
    let anchor = null;
    let tag = null;
    let newlineAfterProp = null;
    let comma = null;
    let found = null;
    let start = null;
    for (const token of tokens) {
        if (reqSpace) {
            if (token.type !== 'space' &&
                token.type !== 'newline' &&
                token.type !== 'comma')
                onError(token.offset, 'MISSING_CHAR', 'Tags and anchors must be separated from the next token by white space');
            reqSpace = false;
        }
        if (tab) {
            if (atNewline && token.type !== 'comment' && token.type !== 'newline') {
                onError(tab, 'TAB_AS_INDENT', 'Tabs are not allowed as indentation');
            }
            tab = null;
        }
        switch (token.type) {
            case 'space':
                // At the doc level, tabs at line start may be parsed
                // as leading white space rather than indentation.
                // In a flow collection, only the parser handles indent.
                if (!flow &&
                    (indicator !== 'doc-start' || next?.type !== 'flow-collection') &&
                    token.source.includes('\t')) {
                    tab = token;
                }
                hasSpace = true;
                break;
            case 'comment': {
                if (!hasSpace)
                    onError(token, 'MISSING_CHAR', 'Comments must be separated from other tokens by white space characters');
                const cb = token.source.substring(1) || ' ';
                if (!comment)
                    comment = cb;
                else
                    comment += commentSep + cb;
                commentSep = '';
                atNewline = false;
                break;
            }
            case 'newline':
                if (atNewline) {
                    if (comment)
                        comment += token.source;
                    else if (!found || indicator !== 'seq-item-ind')
                        spaceBefore = true;
                }
                else
                    commentSep += token.source;
                atNewline = true;
                hasNewline = true;
                if (anchor || tag)
                    newlineAfterProp = token;
                hasSpace = true;
                break;
            case 'anchor':
                if (anchor)
                    onError(token, 'MULTIPLE_ANCHORS', 'A node can have at most one anchor');
                if (token.source.endsWith(':'))
                    onError(token.offset + token.source.length - 1, 'BAD_ALIAS', 'Anchor ending in : is ambiguous', true);
                anchor = token;
                start ?? (start = token.offset);
                atNewline = false;
                hasSpace = false;
                reqSpace = true;
                break;
            case 'tag': {
                if (tag)
                    onError(token, 'MULTIPLE_TAGS', 'A node can have at most one tag');
                tag = token;
                start ?? (start = token.offset);
                atNewline = false;
                hasSpace = false;
                reqSpace = true;
                break;
            }
            case indicator:
                // Could here handle preceding comments differently
                if (anchor || tag)
                    onError(token, 'BAD_PROP_ORDER', `Anchors and tags must be after the ${token.source} indicator`);
                if (found)
                    onError(token, 'UNEXPECTED_TOKEN', `Unexpected ${token.source} in ${flow ?? 'collection'}`);
                found = token;
                atNewline =
                    indicator === 'seq-item-ind' || indicator === 'explicit-key-ind';
                hasSpace = false;
                break;
            case 'comma':
                if (flow) {
                    if (comma)
                        onError(token, 'UNEXPECTED_TOKEN', `Unexpected , in ${flow}`);
                    comma = token;
                    atNewline = false;
                    hasSpace = false;
                    break;
                }
            // else fallthrough
            default:
                onError(token, 'UNEXPECTED_TOKEN', `Unexpected ${token.type} token`);
                atNewline = false;
                hasSpace = false;
        }
    }
    const last = tokens[tokens.length - 1];
    const end = last ? last.offset + last.source.length : offset;
    if (reqSpace &&
        next &&
        next.type !== 'space' &&
        next.type !== 'newline' &&
        next.type !== 'comma' &&
        (next.type !== 'scalar' || next.source !== '')) {
        onError(next.offset, 'MISSING_CHAR', 'Tags and anchors must be separated from the next token by white space');
    }
    if (tab &&
        ((atNewline && tab.indent <= parentIndent) ||
            next?.type === 'block-map' ||
            next?.type === 'block-seq'))
        onError(tab, 'TAB_AS_INDENT', 'Tabs are not allowed as indentation');
    return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
    };
}

exports.resolveProps = resolveProps;

},
function(module,exports,load){
'use strict';

function containsNewline(key) {
    if (!key)
        return null;
    switch (key.type) {
        case 'alias':
        case 'scalar':
        case 'double-quoted-scalar':
        case 'single-quoted-scalar':
            if (key.source.includes('\n'))
                return true;
            if (key.end)
                for (const st of key.end)
                    if (st.type === 'newline')
                        return true;
            return false;
        case 'flow-collection':
            for (const it of key.items) {
                for (const st of it.start)
                    if (st.type === 'newline')
                        return true;
                if (it.sep)
                    for (const st of it.sep)
                        if (st.type === 'newline')
                            return true;
                if (containsNewline(it.key) || containsNewline(it.value))
                    return true;
            }
            return false;
        default:
            return true;
    }
}

exports.containsNewline = containsNewline;

},
function(module,exports,load){
'use strict';

var utilContainsNewline = load(54);

function flowIndentCheck(indent, fc, onError) {
    if (fc?.type === 'flow-collection') {
        const end = fc.end[0];
        if (end.indent === indent &&
            (end.source === ']' || end.source === '}') &&
            utilContainsNewline.containsNewline(fc)) {
            const msg = 'Flow end indicator should be more indented than parent';
            onError(end, 'BAD_INDENT', msg, true);
        }
    }
}

exports.flowIndentCheck = flowIndentCheck;

},
function(module,exports,load){
'use strict';

var identity = load(3);

function mapIncludes(ctx, items, search) {
    const { uniqueKeys } = ctx.options;
    if (uniqueKeys === false)
        return false;
    const isEqual = typeof uniqueKeys === 'function'
        ? uniqueKeys
        : (a, b) => a === b || (identity.isScalar(a) && identity.isScalar(b) && a.value === b.value);
    return items.some(pair => isEqual(pair.key, search));
}

exports.mapIncludes = mapIncludes;

},
function(module,exports,load){
'use strict';

var YAMLSeq = load(28);
var resolveProps = load(53);
var utilFlowIndentCheck = load(55);

function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
    const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
    const seq = new NodeClass(ctx.schema);
    if (ctx.atRoot)
        ctx.atRoot = false;
    if (ctx.atKey)
        ctx.atKey = false;
    let offset = bs.offset;
    let commentEnd = null;
    for (const { start, value } of bs.items) {
        const props = resolveProps.resolveProps(start, {
            indicator: 'seq-item-ind',
            next: value,
            offset,
            onError,
            parentIndent: bs.indent,
            startOnNewline: true
        });
        if (!props.found) {
            if (props.anchor || props.tag || value) {
                if (value?.type === 'block-seq')
                    onError(props.end, 'BAD_INDENT', 'All sequence items must start at the same column');
                else
                    onError(offset, 'MISSING_CHAR', 'Sequence item without - indicator');
            }
            else {
                commentEnd = props.end;
                if (props.comment)
                    seq.comment = props.comment;
                continue;
            }
        }
        const node = value
            ? composeNode(ctx, value, props, onError)
            : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
    }
    seq.range = [bs.offset, offset, commentEnd ?? offset];
    return seq;
}

exports.resolveBlockSeq = resolveBlockSeq;

},
function(module,exports,load){
'use strict';

var identity = load(3);
var Pair = load(14);
var YAMLMap = load(25);
var YAMLSeq = load(28);
var resolveEnd = load(59);
var resolveProps = load(53);
var utilContainsNewline = load(54);
var utilMapIncludes = load(56);

const blockMsg = 'Block collections are not allowed within flow collections';
const isBlock = (token) => token && (token.type === 'block-map' || token.type === 'block-seq');
function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
    const isMap = fc.start.source === '{';
    const fcName = isMap ? 'flow map' : 'flow sequence';
    const NodeClass = (tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq));
    const coll = new NodeClass(ctx.schema);
    coll.flow = true;
    const atRoot = ctx.atRoot;
    if (atRoot)
        ctx.atRoot = false;
    if (ctx.atKey)
        ctx.atKey = false;
    let offset = fc.offset + fc.start.source.length;
    for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key, sep, value } = collItem;
        const props = resolveProps.resolveProps(start, {
            flow: fcName,
            indicator: 'explicit-key-ind',
            next: key ?? sep?.[0],
            offset,
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
        });
        if (!props.found) {
            if (!props.anchor && !props.tag && !sep && !value) {
                if (i === 0 && props.comma)
                    onError(props.comma, 'UNEXPECTED_TOKEN', `Unexpected , in ${fcName}`);
                else if (i < fc.items.length - 1)
                    onError(props.start, 'UNEXPECTED_TOKEN', `Unexpected empty item in ${fcName}`);
                if (props.comment) {
                    if (coll.comment)
                        coll.comment += '\n' + props.comment;
                    else
                        coll.comment = props.comment;
                }
                offset = props.end;
                continue;
            }
            if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
                onError(key, // checked by containsNewline()
                'MULTILINE_IMPLICIT_KEY', 'Implicit keys of flow sequence pairs need to be on a single line');
        }
        if (i === 0) {
            if (props.comma)
                onError(props.comma, 'UNEXPECTED_TOKEN', `Unexpected , in ${fcName}`);
        }
        else {
            if (!props.comma)
                onError(props.start, 'MISSING_CHAR', `Missing , between ${fcName} items`);
            if (props.comment) {
                let prevItemComment = '';
                loop: for (const st of start) {
                    switch (st.type) {
                        case 'comma':
                        case 'space':
                            break;
                        case 'comment':
                            prevItemComment = st.source.substring(1);
                            break loop;
                        default:
                            break loop;
                    }
                }
                if (prevItemComment) {
                    let prev = coll.items[coll.items.length - 1];
                    if (identity.isPair(prev))
                        prev = prev.value ?? prev.key;
                    if (prev.comment)
                        prev.comment += '\n' + prevItemComment;
                    else
                        prev.comment = prevItemComment;
                    props.comment = props.comment.substring(prevItemComment.length + 1);
                }
            }
        }
        if (!isMap && !sep && !props.found) {
            // item is a value in a seq
            // → key & sep are empty, start does not include ? or :
            const valueNode = value
                ? composeNode(ctx, value, props, onError)
                : composeEmptyNode(ctx, props.end, sep, null, props, onError);
            coll.items.push(valueNode);
            offset = valueNode.range[2];
            if (isBlock(value))
                onError(valueNode.range, 'BLOCK_IN_FLOW', blockMsg);
        }
        else {
            // item is a key+value pair
            // key value
            ctx.atKey = true;
            const keyStart = props.end;
            const keyNode = key
                ? composeNode(ctx, key, props, onError)
                : composeEmptyNode(ctx, keyStart, start, null, props, onError);
            if (isBlock(key))
                onError(keyNode.range, 'BLOCK_IN_FLOW', blockMsg);
            ctx.atKey = false;
            // value properties
            const valueProps = resolveProps.resolveProps(sep ?? [], {
                flow: fcName,
                indicator: 'map-value-ind',
                next: value,
                offset: keyNode.range[2],
                onError,
                parentIndent: fc.indent,
                startOnNewline: false
            });
            if (valueProps.found) {
                if (!isMap && !props.found && ctx.options.strict) {
                    if (sep)
                        for (const st of sep) {
                            if (st === valueProps.found)
                                break;
                            if (st.type === 'newline') {
                                onError(st, 'MULTILINE_IMPLICIT_KEY', 'Implicit keys of flow sequence pairs need to be on a single line');
                                break;
                            }
                        }
                    if (props.start < valueProps.found.offset - 1024)
                        onError(valueProps.found, 'KEY_OVER_1024_CHARS', 'The : indicator must be at most 1024 chars after the start of an implicit flow sequence key');
                }
            }
            else if (value) {
                if ('source' in value && value.source?.[0] === ':')
                    onError(value, 'MISSING_CHAR', `Missing space after : in ${fcName}`);
                else
                    onError(valueProps.start, 'MISSING_CHAR', `Missing , or : between ${fcName} items`);
            }
            // value value
            const valueNode = value
                ? composeNode(ctx, value, valueProps, onError)
                : valueProps.found
                    ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError)
                    : null;
            if (valueNode) {
                if (isBlock(value))
                    onError(valueNode.range, 'BLOCK_IN_FLOW', blockMsg);
            }
            else if (valueProps.comment) {
                if (keyNode.comment)
                    keyNode.comment += '\n' + valueProps.comment;
                else
                    keyNode.comment = valueProps.comment;
            }
            const pair = new Pair.Pair(keyNode, valueNode);
            if (ctx.options.keepSourceTokens)
                pair.srcToken = collItem;
            if (isMap) {
                const map = coll;
                if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
                    onError(keyStart, 'DUPLICATE_KEY', 'Map keys must be unique');
                map.items.push(pair);
            }
            else {
                const map = new YAMLMap.YAMLMap(ctx.schema);
                map.flow = true;
                map.items.push(pair);
                const endRange = (valueNode ?? keyNode).range;
                map.range = [keyNode.range[0], endRange[1], endRange[2]];
                coll.items.push(map);
            }
            offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
    }
    const expectedEnd = isMap ? '}' : ']';
    const [ce, ...ee] = fc.end;
    let cePos = offset;
    if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
    else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot
            ? `${name} must end with a ${expectedEnd}`
            : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? 'MISSING_CHAR' : 'BAD_INDENT', msg);
        if (ce && ce.source.length !== 1)
            ee.unshift(ce);
    }
    if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
            if (coll.comment)
                coll.comment += '\n' + end.comment;
            else
                coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
    }
    else {
        coll.range = [fc.offset, cePos, cePos];
    }
    return coll;
}

exports.resolveFlowCollection = resolveFlowCollection;

},
function(module,exports,load){
'use strict';

function resolveEnd(end, offset, reqSpace, onError) {
    let comment = '';
    if (end) {
        let hasSpace = false;
        let sep = '';
        for (const token of end) {
            const { source, type } = token;
            switch (type) {
                case 'space':
                    hasSpace = true;
                    break;
                case 'comment': {
                    if (reqSpace && !hasSpace)
                        onError(token, 'MISSING_CHAR', 'Comments must be separated from other tokens by white space characters');
                    const cb = source.substring(1) || ' ';
                    if (!comment)
                        comment = cb;
                    else
                        comment += sep + cb;
                    sep = '';
                    break;
                }
                case 'newline':
                    if (comment)
                        sep += source;
                    hasSpace = true;
                    break;
                default:
                    onError(token, 'UNEXPECTED_TOKEN', `Unexpected ${type} at node end`);
            }
            offset += source.length;
        }
    }
    return { comment, offset };
}

exports.resolveEnd = resolveEnd;

},
function(module,exports,load){
'use strict';

var identity = load(3);
var Scalar = load(13);
var resolveBlockScalar = load(61);
var resolveFlowScalar = load(62);

function composeScalar(ctx, token, tagToken, onError) {
    const { value, type, comment, range } = token.type === 'block-scalar'
        ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError)
        : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
    const tagName = tagToken
        ? ctx.directives.tagName(tagToken.source, msg => onError(tagToken, 'TAG_RESOLVE_FAILED', msg))
        : null;
    let tag;
    if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
    }
    else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
    else if (token.type === 'scalar')
        tag = findScalarTagByTest(ctx, value, token, onError);
    else
        tag = ctx.schema[identity.SCALAR];
    let scalar;
    try {
        const res = tag.resolve(value, msg => onError(tagToken ?? token, 'TAG_RESOLVE_FAILED', msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, 'TAG_RESOLVE_FAILED', msg);
        scalar = new Scalar.Scalar(value);
    }
    scalar.range = range;
    scalar.source = value;
    if (type)
        scalar.type = type;
    if (tagName)
        scalar.tag = tagName;
    if (tag.format)
        scalar.format = tag.format;
    if (comment)
        scalar.comment = comment;
    return scalar;
}
function findScalarTagByName(schema, value, tagName, tagToken, onError) {
    if (tagName === '!')
        return schema[identity.SCALAR]; // non-specific tag
    const matchWithTest = [];
    for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
            if (tag.default && tag.test)
                matchWithTest.push(tag);
            else
                return tag;
        }
    }
    for (const tag of matchWithTest)
        if (tag.test?.test(value))
            return tag;
    const kt = schema.knownTags[tagName];
    if (kt && !kt.collection) {
        // Ensure that the known tag is available for stringifying,
        // but does not get used by default.
        schema.tags.push(Object.assign({}, kt, { default: false, test: undefined }));
        return kt;
    }
    onError(tagToken, 'TAG_RESOLVE_FAILED', `Unresolved tag: ${tagName}`, tagName !== 'tag:yaml.org,2002:str');
    return schema[identity.SCALAR];
}
function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
    const tag = schema.tags.find(tag => (tag.default === true || (atKey && tag.default === 'key')) &&
        tag.test?.test(value)) || schema[identity.SCALAR];
    if (schema.compat) {
        const compat = schema.compat.find(tag => tag.default && tag.test?.test(value)) ??
            schema[identity.SCALAR];
        if (tag.tag !== compat.tag) {
            const ts = directives.tagString(tag.tag);
            const cs = directives.tagString(compat.tag);
            const msg = `Value may be parsed as either ${ts} or ${cs}`;
            onError(token, 'TAG_RESOLVE_FAILED', msg, true);
        }
    }
    return tag;
}

exports.composeScalar = composeScalar;

},
function(module,exports,load){
'use strict';

var Scalar = load(13);

function resolveBlockScalar(ctx, scalar, onError) {
    const start = scalar.offset;
    const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
    if (!header)
        return { value: '', type: null, comment: '', range: [start, start, start] };
    const type = header.mode === '>' ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
    const lines = scalar.source ? splitLines(scalar.source) : [];
    // determine the end of content & start of chomping
    let chompStart = lines.length;
    for (let i = lines.length - 1; i >= 0; --i) {
        const content = lines[i][1];
        if (content === '' || content === '\r')
            chompStart = i;
        else
            break;
    }
    // shortcut for empty contents
    if (chompStart === 0) {
        const value = header.chomp === '+' && lines.length > 0
            ? '\n'.repeat(Math.max(1, lines.length - 1))
            : '';
        let end = start + header.length;
        if (scalar.source)
            end += scalar.source.length;
        return { value, type, comment: header.comment, range: [start, end, end] };
    }
    // find the indentation level to trim from start
    let trimIndent = scalar.indent + header.indent;
    let offset = scalar.offset + header.length;
    let contentStart = 0;
    for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === '' || content === '\r') {
            if (header.indent === 0 && indent.length > trimIndent)
                trimIndent = indent.length;
        }
        else {
            if (indent.length < trimIndent) {
                const message = 'Block scalars with more-indented leading empty lines must use an explicit indentation indicator';
                onError(offset + indent.length, 'MISSING_CHAR', message);
            }
            if (header.indent === 0)
                trimIndent = indent.length;
            contentStart = i;
            if (trimIndent === 0 && !ctx.atRoot) {
                const message = 'Block scalar values in collections must be indented';
                onError(offset, 'BAD_INDENT', message);
            }
            break;
        }
        offset += indent.length + content.length + 1;
    }
    // include trailing more-indented empty lines in content
    for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
            chompStart = i + 1;
    }
    let value = '';
    let sep = '';
    let prevMoreIndented = false;
    // leading whitespace is kept intact
    for (let i = 0; i < contentStart; ++i)
        value += lines[i][0].slice(trimIndent) + '\n';
    for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines[i];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === '\r';
        if (crlf)
            content = content.slice(0, -1);
        /* istanbul ignore if already caught in lexer */
        if (content && indent.length < trimIndent) {
            const src = header.indent
                ? 'explicit indentation indicator'
                : 'first line';
            const message = `Block scalar lines must not be less indented than their ${src}`;
            onError(offset - content.length - (crlf ? 2 : 1), 'BAD_INDENT', message);
            indent = '';
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
            value += sep + indent.slice(trimIndent) + content;
            sep = '\n';
        }
        else if (indent.length > trimIndent || content[0] === '\t') {
            // more-indented content within a folded block
            if (sep === ' ')
                sep = '\n';
            else if (!prevMoreIndented && sep === '\n')
                sep = '\n\n';
            value += sep + indent.slice(trimIndent) + content;
            sep = '\n';
            prevMoreIndented = true;
        }
        else if (content === '') {
            // empty line
            if (sep === '\n')
                value += '\n';
            else
                sep = '\n';
        }
        else {
            value += sep + content;
            sep = ' ';
            prevMoreIndented = false;
        }
    }
    switch (header.chomp) {
        case '-':
            break;
        case '+':
            for (let i = chompStart; i < lines.length; ++i)
                value += '\n' + lines[i][0].slice(trimIndent);
            if (value[value.length - 1] !== '\n')
                value += '\n';
            break;
        default:
            value += '\n';
    }
    const end = start + header.length + scalar.source.length;
    return { value, type, comment: header.comment, range: [start, end, end] };
}
function parseBlockScalarHeader({ offset, props }, strict, onError) {
    /* istanbul ignore if should not happen */
    if (props[0].type !== 'block-scalar-header') {
        onError(props[0], 'IMPOSSIBLE', 'Block scalar header not found');
        return null;
    }
    const { source } = props[0];
    const mode = source[0];
    let indent = 0;
    let chomp = '';
    let error = -1;
    for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === '-' || ch === '+'))
            chomp = ch;
        else {
            const n = Number(ch);
            if (!indent && n)
                indent = n;
            else if (error === -1)
                error = offset + i;
        }
    }
    if (error !== -1)
        onError(error, 'UNEXPECTED_TOKEN', `Block scalar header includes extra characters: ${source}`);
    let hasSpace = false;
    let comment = '';
    let length = source.length;
    for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
            case 'space':
                hasSpace = true;
            // fallthrough
            case 'newline':
                length += token.source.length;
                break;
            case 'comment':
                if (strict && !hasSpace) {
                    const message = 'Comments must be separated from other tokens by white space characters';
                    onError(token, 'MISSING_CHAR', message);
                }
                length += token.source.length;
                comment = token.source.substring(1);
                break;
            case 'error':
                onError(token, 'UNEXPECTED_TOKEN', token.message);
                length += token.source.length;
                break;
            /* istanbul ignore next should not happen */
            default: {
                const message = `Unexpected token in block scalar header: ${token.type}`;
                onError(token, 'UNEXPECTED_TOKEN', message);
                const ts = token.source;
                if (ts && typeof ts === 'string')
                    length += ts.length;
            }
        }
    }
    return { mode, indent, chomp, comment, length };
}
/** @returns Array of lines split up as `[indent, content]` */
function splitLines(source) {
    const split = source.split(/\n( *)/);
    const first = split[0];
    const m = first.match(/^( *)/);
    const line0 = m?.[1]
        ? [m[1], first.slice(m[1].length)]
        : ['', first];
    const lines = [line0];
    for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
    return lines;
}

exports.resolveBlockScalar = resolveBlockScalar;

},
function(module,exports,load){
'use strict';

var Scalar = load(13);
var resolveEnd = load(59);

function resolveFlowScalar(scalar, strict, onError) {
    const { offset, type, source, end } = scalar;
    let _type;
    let value;
    const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
    switch (type) {
        case 'scalar':
            _type = Scalar.Scalar.PLAIN;
            value = plainValue(source, _onError);
            break;
        case 'single-quoted-scalar':
            _type = Scalar.Scalar.QUOTE_SINGLE;
            value = singleQuotedValue(source, _onError);
            break;
        case 'double-quoted-scalar':
            _type = Scalar.Scalar.QUOTE_DOUBLE;
            value = doubleQuotedValue(source, _onError);
            break;
        /* istanbul ignore next should not happen */
        default:
            onError(scalar, 'UNEXPECTED_TOKEN', `Expected a flow scalar value, but found: ${type}`);
            return {
                value: '',
                type: null,
                comment: '',
                range: [offset, offset + source.length, offset + source.length]
            };
    }
    const valueEnd = offset + source.length;
    const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
    return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
    };
}
function plainValue(source, onError) {
    let badChar = '';
    switch (source[0]) {
        /* istanbul ignore next should not happen */
        case '\t':
            badChar = 'a tab character';
            break;
        case ',':
            badChar = 'flow indicator character ,';
            break;
        case '%':
            badChar = 'directive indicator character %';
            break;
        case '|':
        case '>': {
            badChar = `block scalar indicator ${source[0]}`;
            break;
        }
        case '@':
        case '`': {
            badChar = `reserved character ${source[0]}`;
            break;
        }
    }
    if (badChar)
        onError(0, 'BAD_SCALAR_START', `Plain value cannot start with ${badChar}`);
    return unfoldLines(source);
}
function singleQuotedValue(source, onError) {
    if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, 'MISSING_CHAR', "Missing closing 'quote");
    return unfoldLines(source.slice(1, -1)).replace(/''/g, "'");
}
function unfoldLines(source) {
    const line = /(.*?)\r?\n/sy;
    let match = line.exec(source);
    if (!match)
        return source;
    /**
     * The negative lookbehinds in these RegExps are to
     * prevent causing a polynomial search time in certain cases.
     *
     * The try-catch is for Safari < 16.4 and other old browsers:
     * https://caniuse.com/js-regexp-lookbehind
     */
    let trimEnd, trimBoth;
    try {
        trimEnd = new RegExp('(?<![ \t])[ \t]+$');
        trimBoth = new RegExp('^[ \t]+|(?<![ \t])[ \t]+$', 'g');
    }
    catch {
        trimEnd = /[ \t]+$/;
        trimBoth = /^[ \t]+|[ \t]+$/g;
    }
    let res = match[1].replace(trimEnd, '');
    let sep = ' ';
    let pos = line.lastIndex;
    while ((match = line.exec(source))) {
        const lm = match[1].replace(trimBoth, '');
        if (lm === '') {
            if (sep === '\n')
                res += sep;
            else
                sep = '\n';
        }
        else {
            res += sep + lm;
            sep = ' ';
        }
        pos = line.lastIndex;
    }
    const last = /[ \t]*(.*)/sy;
    last.lastIndex = pos;
    match = last.exec(source);
    return res + sep + (match?.[1] ?? '');
}
function doubleQuotedValue(source, onError) {
    let res = '';
    for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === '\r' && source[i + 1] === '\n')
            continue;
        if (ch === '\n') {
            const { fold, offset } = foldNewline(source, i);
            res += fold;
            i = offset;
        }
        else if (ch === '\\') {
            let next = source[++i];
            const cc = escapeCodes[next];
            if (cc)
                res += cc;
            else if (next === '\n') {
                // skip escaped newlines, but still trim the following line
                next = source[i + 1];
                while (next === ' ' || next === '\t')
                    next = source[++i + 1];
            }
            else if (next === '\r' && source[i + 1] === '\n') {
                // skip escaped CRLF newlines, but still trim the following line
                next = source[++i + 1];
                while (next === ' ' || next === '\t')
                    next = source[++i + 1];
            }
            else if (next === 'x' || next === 'u' || next === 'U') {
                const length = next === 'x' ? 2 : next === 'u' ? 4 : 8;
                res += parseCharCode(source, i + 1, length, onError);
                i += length;
            }
            else {
                const raw = source.substr(i - 1, 2);
                onError(i - 1, 'BAD_DQ_ESCAPE', `Invalid escape sequence ${raw}`);
                res += raw;
            }
        }
        else if (ch === ' ' || ch === '\t') {
            // trim trailing whitespace
            const wsStart = i;
            let next = source[i + 1];
            while (next === ' ' || next === '\t')
                next = source[++i + 1];
            if (next !== '\n' && !(next === '\r' && source[i + 2] === '\n'))
                res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        }
        else {
            res += ch;
        }
    }
    if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, 'MISSING_CHAR', 'Missing closing "quote');
    return res;
}
/**
 * Fold a single newline into a space, multiple newlines to N - 1 newlines.
 * Presumes `source[offset] === '\n'`
 */
function foldNewline(source, offset) {
    let fold = '';
    let ch = source[offset + 1];
    while (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        if (ch === '\r' && source[offset + 2] !== '\n')
            break;
        if (ch === '\n')
            fold += '\n';
        offset += 1;
        ch = source[offset + 1];
    }
    if (!fold)
        fold = ' ';
    return { fold, offset };
}
const escapeCodes = {
    '0': '\0', // null character
    a: '\x07', // bell character
    b: '\b', // backspace
    e: '\x1b', // escape character
    f: '\f', // form feed
    n: '\n', // line feed
    r: '\r', // carriage return
    t: '\t', // horizontal tab
    v: '\v', // vertical tab
    N: '\u0085', // Unicode next line
    _: '\u00a0', // Unicode non-breaking space
    L: '\u2028', // Unicode line separator
    P: '\u2029', // Unicode paragraph separator
    ' ': ' ',
    '"': '"',
    '/': '/',
    '\\': '\\',
    '\t': '\t'
};
function parseCharCode(source, offset, length, onError) {
    const cc = source.substr(offset, length);
    const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
    const code = ok ? parseInt(cc, 16) : NaN;
    try {
        return String.fromCodePoint(code);
    }
    catch {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, 'BAD_DQ_ESCAPE', `Invalid escape sequence ${raw}`);
        return raw;
    }
}

exports.resolveFlowScalar = resolveFlowScalar;

},
function(module,exports,load){
'use strict';

function emptyScalarPosition(offset, before, pos) {
    if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
            let st = before[i];
            switch (st.type) {
                case 'space':
                case 'comment':
                case 'newline':
                    offset -= st.source.length;
                    continue;
            }
            // Technically, an empty scalar is immediately after the last non-empty
            // node, but it's more useful to place it after any whitespace.
            st = before[++i];
            while (st?.type === 'space') {
                offset += st.source.length;
                st = before[++i];
            }
            break;
        }
    }
    return offset;
}

exports.emptyScalarPosition = emptyScalarPosition;

},
function(module,exports,load){
'use strict';

var cstScalar = load(65);
var cstStringify = load(66);
var cstVisit = load(67);

/** The byte order mark */
const BOM = '\u{FEFF}';
/** Start of doc-mode */
const DOCUMENT = '\x02'; // C0: Start of Text
/** Unexpected end of flow-mode */
const FLOW_END = '\x18'; // C0: Cancel
/** Next token is a scalar value */
const SCALAR = '\x1f'; // C0: Unit Separator
/** @returns `true` if `token` is a flow or block collection */
const isCollection = (token) => !!token && 'items' in token;
/** @returns `true` if `token` is a flow or block scalar; not an alias */
const isScalar = (token) => !!token &&
    (token.type === 'scalar' ||
        token.type === 'single-quoted-scalar' ||
        token.type === 'double-quoted-scalar' ||
        token.type === 'block-scalar');
/* istanbul ignore next */
/** Get a printable representation of a lexer token */
function prettyToken(token) {
    switch (token) {
        case BOM:
            return '<BOM>';
        case DOCUMENT:
            return '<DOC>';
        case FLOW_END:
            return '<FLOW_END>';
        case SCALAR:
            return '<SCALAR>';
        default:
            return JSON.stringify(token);
    }
}
/** Identify the type of a lexer token. May return `null` for unknown tokens. */
function tokenType(source) {
    switch (source) {
        case BOM:
            return 'byte-order-mark';
        case DOCUMENT:
            return 'doc-mode';
        case FLOW_END:
            return 'flow-error-end';
        case SCALAR:
            return 'scalar';
        case '---':
            return 'doc-start';
        case '...':
            return 'doc-end';
        case '':
        case '\n':
        case '\r\n':
            return 'newline';
        case '-':
            return 'seq-item-ind';
        case '?':
            return 'explicit-key-ind';
        case ':':
            return 'map-value-ind';
        case '{':
            return 'flow-map-start';
        case '}':
            return 'flow-map-end';
        case '[':
            return 'flow-seq-start';
        case ']':
            return 'flow-seq-end';
        case ',':
            return 'comma';
    }
    switch (source[0]) {
        case ' ':
        case '\t':
            return 'space';
        case '#':
            return 'comment';
        case '%':
            return 'directive-line';
        case '*':
            return 'alias';
        case '&':
            return 'anchor';
        case '!':
            return 'tag';
        case "'":
            return 'single-quoted-scalar';
        case '"':
            return 'double-quoted-scalar';
        case '|':
        case '>':
            return 'block-scalar-header';
    }
    return null;
}

exports.createScalarToken = cstScalar.createScalarToken;
exports.resolveAsScalar = cstScalar.resolveAsScalar;
exports.setScalarValue = cstScalar.setScalarValue;
exports.stringify = cstStringify.stringify;
exports.visit = cstVisit.visit;
exports.BOM = BOM;
exports.DOCUMENT = DOCUMENT;
exports.FLOW_END = FLOW_END;
exports.SCALAR = SCALAR;
exports.isCollection = isCollection;
exports.isScalar = isScalar;
exports.prettyToken = prettyToken;
exports.tokenType = tokenType;

},
function(module,exports,load){
'use strict';

var resolveBlockScalar = load(61);
var resolveFlowScalar = load(62);
var errors = load(48);
var stringifyString = load(18);

function resolveAsScalar(token, strict = true, onError) {
    if (token) {
        const _onError = (pos, code, message) => {
            const offset = typeof pos === 'number' ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
            if (onError)
                onError(offset, code, message);
            else
                throw new errors.YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
            case 'scalar':
            case 'single-quoted-scalar':
            case 'double-quoted-scalar':
                return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
            case 'block-scalar':
                return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
    }
    return null;
}
/**
 * Create a new scalar token with `value`
 *
 * Values that represent an actual string but may be parsed as a different type should use a `type` other than `'PLAIN'`,
 * as this function does not support any schema operations and won't check for such conflicts.
 *
 * @param value The string representation of the value, which will have its content properly indented.
 * @param context.end Comments and whitespace after the end of the value, or after the block scalar header. If undefined, a newline will be added.
 * @param context.implicitKey Being within an implicit key may affect the resolved type of the token's value.
 * @param context.indent The indent level of the token.
 * @param context.inFlow Is this scalar within a flow collection? This may affect the resolved type of the token's value.
 * @param context.offset The offset position of the token.
 * @param context.type The preferred type of the scalar token. If undefined, the previous type of the `token` will be used, defaulting to `'PLAIN'`.
 */
function createScalarToken(value, context) {
    const { implicitKey = false, indent, inFlow = false, offset = -1, type = 'PLAIN' } = context;
    const source = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? ' '.repeat(indent) : '',
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
    });
    const end = context.end ?? [
        { type: 'newline', offset: -1, indent, source: '\n' }
    ];
    switch (source[0]) {
        case '|':
        case '>': {
            const he = source.indexOf('\n');
            const head = source.substring(0, he);
            const body = source.substring(he + 1) + '\n';
            const props = [
                { type: 'block-scalar-header', offset, indent, source: head }
            ];
            if (!addEndtoBlockProps(props, end))
                props.push({ type: 'newline', offset: -1, indent, source: '\n' });
            return { type: 'block-scalar', offset, indent, props, source: body };
        }
        case '"':
            return { type: 'double-quoted-scalar', offset, indent, source, end };
        case "'":
            return { type: 'single-quoted-scalar', offset, indent, source, end };
        default:
            return { type: 'scalar', offset, indent, source, end };
    }
}
/**
 * Set the value of `token` to the given string `value`, overwriting any previous contents and type that it may have.
 *
 * Best efforts are made to retain any comments previously associated with the `token`,
 * though all contents within a collection's `items` will be overwritten.
 *
 * Values that represent an actual string but may be parsed as a different type should use a `type` other than `'PLAIN'`,
 * as this function does not support any schema operations and won't check for such conflicts.
 *
 * @param token Any token. If it does not include an `indent` value, the value will be stringified as if it were an implicit key.
 * @param value The string representation of the value, which will have its content properly indented.
 * @param context.afterKey In most cases, values after a key should have an additional level of indentation.
 * @param context.implicitKey Being within an implicit key may affect the resolved type of the token's value.
 * @param context.inFlow Being within a flow collection may affect the resolved type of the token's value.
 * @param context.type The preferred type of the scalar token. If undefined, the previous type of the `token` will be used, defaulting to `'PLAIN'`.
 */
function setScalarValue(token, value, context = {}) {
    let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
    let indent = 'indent' in token ? token.indent : null;
    if (afterKey && typeof indent === 'number')
        indent += 2;
    if (!type)
        switch (token.type) {
            case 'single-quoted-scalar':
                type = 'QUOTE_SINGLE';
                break;
            case 'double-quoted-scalar':
                type = 'QUOTE_DOUBLE';
                break;
            case 'block-scalar': {
                const header = token.props[0];
                if (header.type !== 'block-scalar-header')
                    throw new Error('Invalid block scalar header');
                type = header.source[0] === '>' ? 'BLOCK_FOLDED' : 'BLOCK_LITERAL';
                break;
            }
            default:
                type = 'PLAIN';
        }
    const source = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? ' '.repeat(indent) : '',
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
    });
    switch (source[0]) {
        case '|':
        case '>':
            setBlockScalarValue(token, source);
            break;
        case '"':
            setFlowScalarValue(token, source, 'double-quoted-scalar');
            break;
        case "'":
            setFlowScalarValue(token, source, 'single-quoted-scalar');
            break;
        default:
            setFlowScalarValue(token, source, 'scalar');
    }
}
function setBlockScalarValue(token, source) {
    const he = source.indexOf('\n');
    const head = source.substring(0, he);
    const body = source.substring(he + 1) + '\n';
    if (token.type === 'block-scalar') {
        const header = token.props[0];
        if (header.type !== 'block-scalar-header')
            throw new Error('Invalid block scalar header');
        header.source = head;
        token.source = body;
    }
    else {
        const { offset } = token;
        const indent = 'indent' in token ? token.indent : -1;
        const props = [
            { type: 'block-scalar-header', offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, 'end' in token ? token.end : undefined))
            props.push({ type: 'newline', offset: -1, indent, source: '\n' });
        for (const key of Object.keys(token))
            if (key !== 'type' && key !== 'offset')
                delete token[key];
        Object.assign(token, { type: 'block-scalar', indent, props, source: body });
    }
}
/** @returns `true` if last token is a newline */
function addEndtoBlockProps(props, end) {
    if (end)
        for (const st of end)
            switch (st.type) {
                case 'space':
                case 'comment':
                    props.push(st);
                    break;
                case 'newline':
                    props.push(st);
                    return true;
            }
    return false;
}
function setFlowScalarValue(token, source, type) {
    switch (token.type) {
        case 'scalar':
        case 'double-quoted-scalar':
        case 'single-quoted-scalar':
            token.type = type;
            token.source = source;
            break;
        case 'block-scalar': {
            const end = token.props.slice(1);
            let oa = source.length;
            if (token.props[0].type === 'block-scalar-header')
                oa -= token.props[0].source.length;
            for (const tok of end)
                tok.offset += oa;
            delete token.props;
            Object.assign(token, { type, source, end });
            break;
        }
        case 'block-map':
        case 'block-seq': {
            const offset = token.offset + source.length;
            const nl = { type: 'newline', offset, indent: token.indent, source: '\n' };
            delete token.items;
            Object.assign(token, { type, source, end: [nl] });
            break;
        }
        default: {
            const indent = 'indent' in token ? token.indent : -1;
            const end = 'end' in token && Array.isArray(token.end)
                ? token.end.filter(st => st.type === 'space' ||
                    st.type === 'comment' ||
                    st.type === 'newline')
                : [];
            for (const key of Object.keys(token))
                if (key !== 'type' && key !== 'offset')
                    delete token[key];
            Object.assign(token, { type, indent, source, end });
        }
    }
}

exports.createScalarToken = createScalarToken;
exports.resolveAsScalar = resolveAsScalar;
exports.setScalarValue = setScalarValue;

},
function(module,exports,load){
'use strict';

/**
 * Stringify a CST document, token, or collection item
 *
 * Fair warning: This applies no validation whatsoever, and
 * simply concatenates the sources in their logical order.
 */
const stringify = (cst) => 'type' in cst ? stringifyToken(cst) : stringifyItem(cst);
function stringifyToken(token) {
    switch (token.type) {
        case 'block-scalar': {
            let res = '';
            for (const tok of token.props)
                res += stringifyToken(tok);
            return res + token.source;
        }
        case 'block-map':
        case 'block-seq': {
            let res = '';
            for (const item of token.items)
                res += stringifyItem(item);
            return res;
        }
        case 'flow-collection': {
            let res = token.start.source;
            for (const item of token.items)
                res += stringifyItem(item);
            for (const st of token.end)
                res += st.source;
            return res;
        }
        case 'document': {
            let res = stringifyItem(token);
            if (token.end)
                for (const st of token.end)
                    res += st.source;
            return res;
        }
        default: {
            let res = token.source;
            if ('end' in token && token.end)
                for (const st of token.end)
                    res += st.source;
            return res;
        }
    }
}
function stringifyItem({ start, key, sep, value }) {
    let res = '';
    for (const st of start)
        res += st.source;
    if (key)
        res += stringifyToken(key);
    if (sep)
        for (const st of sep)
            res += st.source;
    if (value)
        res += stringifyToken(value);
    return res;
}

exports.stringify = stringify;

},
function(module,exports,load){
'use strict';

const BREAK = Symbol('break visit');
const SKIP = Symbol('skip children');
const REMOVE = Symbol('remove item');
/**
 * Apply a visitor to a CST document or item.
 *
 * Walks through the tree (depth-first) starting from the root, calling a
 * `visitor` function with two arguments when entering each item:
 *   - `item`: The current item, which included the following members:
 *     - `start: SourceToken[]` – Source tokens before the key or value,
 *       possibly including its anchor or tag.
 *     - `key?: Token | null` – Set for pair values. May then be `null`, if
 *       the key before the `:` separator is empty.
 *     - `sep?: SourceToken[]` – Source tokens between the key and the value,
 *       which should include the `:` map value indicator if `value` is set.
 *     - `value?: Token` – The value of a sequence item, or of a map pair.
 *   - `path`: The steps from the root to the current node, as an array of
 *     `['key' | 'value', number]` tuples.
 *
 * The return value of the visitor may be used to control the traversal:
 *   - `undefined` (default): Do nothing and continue
 *   - `visit.SKIP`: Do not visit the children of this token, continue with
 *      next sibling
 *   - `visit.BREAK`: Terminate traversal completely
 *   - `visit.REMOVE`: Remove the current item, then continue with the next one
 *   - `number`: Set the index of the next step. This is useful especially if
 *     the index of the current token has changed.
 *   - `function`: Define the next visitor for this item. After the original
 *     visitor is called on item entry, next visitors are called after handling
 *     a non-empty `key` and when exiting the item.
 */
function visit(cst, visitor) {
    if ('type' in cst && cst.type === 'document')
        cst = { start: cst.start, value: cst.value };
    _visit(Object.freeze([]), cst, visitor);
}
// Without the `as symbol` casts, TS declares these in the `visit`
// namespace using `var`, but then complains about that because
// `unique symbol` must be `const`.
/** Terminate visit traversal completely */
visit.BREAK = BREAK;
/** Do not visit the children of the current item */
visit.SKIP = SKIP;
/** Remove the current item */
visit.REMOVE = REMOVE;
/** Find the item at `path` from `cst` as the root */
visit.itemAtPath = (cst, path) => {
    let item = cst;
    for (const [field, index] of path) {
        const tok = item?.[field];
        if (tok && 'items' in tok) {
            item = tok.items[index];
        }
        else
            return undefined;
    }
    return item;
};
/**
 * Get the immediate parent collection of the item at `path` from `cst` as the root.
 *
 * Throws an error if the collection is not found, which should never happen if the item itself exists.
 */
visit.parentCollection = (cst, path) => {
    const parent = visit.itemAtPath(cst, path.slice(0, -1));
    const field = path[path.length - 1][0];
    const coll = parent?.[field];
    if (coll && 'items' in coll)
        return coll;
    throw new Error('Parent collection not found');
};
function _visit(path, item, visitor) {
    let ctrl = visitor(item, path);
    if (typeof ctrl === 'symbol')
        return ctrl;
    for (const field of ['key', 'value']) {
        const token = item[field];
        if (token && 'items' in token) {
            for (let i = 0; i < token.items.length; ++i) {
                const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
                if (typeof ci === 'number')
                    i = ci - 1;
                else if (ci === BREAK)
                    return BREAK;
                else if (ci === REMOVE) {
                    token.items.splice(i, 1);
                    i -= 1;
                }
            }
            if (typeof ctrl === 'function' && field === 'key')
                ctrl = ctrl(item, path);
        }
    }
    return typeof ctrl === 'function' ? ctrl(item, path) : ctrl;
}

exports.visit = visit;

},
function(module,exports,load){
'use strict';

var cst = load(64);

/*
START -> stream

stream
  directive -> line-end -> stream
  indent + line-end -> stream
  [else] -> line-start

line-end
  comment -> line-end
  newline -> .
  input-end -> END

line-start
  doc-start -> doc
  doc-end -> stream
  [else] -> indent -> block-start

block-start
  seq-item-start -> block-start
  explicit-key-start -> block-start
  map-value-start -> block-start
  [else] -> doc

doc
  line-end -> line-start
  spaces -> doc
  anchor -> doc
  tag -> doc
  flow-start -> flow -> doc
  flow-end -> error -> doc
  seq-item-start -> error -> doc
  explicit-key-start -> error -> doc
  map-value-start -> doc
  alias -> doc
  quote-start -> quoted-scalar -> doc
  block-scalar-header -> line-end -> block-scalar(min) -> line-start
  [else] -> plain-scalar(false, min) -> doc

flow
  line-end -> flow
  spaces -> flow
  anchor -> flow
  tag -> flow
  flow-start -> flow -> flow
  flow-end -> .
  seq-item-start -> error -> flow
  explicit-key-start -> flow
  map-value-start -> flow
  alias -> flow
  quote-start -> quoted-scalar -> flow
  comma -> flow
  [else] -> plain-scalar(true, 0) -> flow

quoted-scalar
  quote-end -> .
  [else] -> quoted-scalar

block-scalar(min)
  newline + peek(indent < min) -> .
  [else] -> block-scalar(min)

plain-scalar(is-flow, min)
  scalar-end(is-flow) -> .
  peek(newline + (indent < min)) -> .
  [else] -> plain-scalar(min)
*/
function isEmpty(ch) {
    switch (ch) {
        case undefined:
        case ' ':
        case '\n':
        case '\r':
        case '\t':
            return true;
        default:
            return false;
    }
}
const hexDigits = new Set('0123456789ABCDEFabcdef');
const tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
const flowIndicatorChars = new Set(',[]{}');
const invalidAnchorChars = new Set(' ,[]{}\n\r\t');
const isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
/**
 * Splits an input string into lexical tokens, i.e. smaller strings that are
 * easily identifiable by `tokens.tokenType()`.
 *
 * Lexing starts always in a "stream" context. Incomplete input may be buffered
 * until a complete token can be emitted.
 *
 * In addition to slices of the original input, the following control characters
 * may also be emitted:
 *
 * - `\x02` (Start of Text): A document starts with the next token
 * - `\x18` (Cancel): Unexpected end of flow-mode (indicates an error)
 * - `\x1f` (Unit Separator): Next token is a scalar value
 * - `\u{FEFF}` (Byte order mark): Emitted separately outside documents
 */
class Lexer {
    constructor() {
        /**
         * Flag indicating whether the end of the current buffer marks the end of
         * all input
         */
        this.atEnd = false;
        /**
         * Explicit indent set in block scalar header, as an offset from the current
         * minimum indent, so e.g. set to 1 from a header `|2+`. Set to -1 if not
         * explicitly set.
         */
        this.blockScalarIndent = -1;
        /**
         * Block scalars that include a + (keep) chomping indicator in their header
         * include trailing empty lines, which are otherwise excluded from the
         * scalar's contents.
         */
        this.blockScalarKeep = false;
        /** Current input */
        this.buffer = '';
        /**
         * Flag noting whether the map value indicator : can immediately follow this
         * node within a flow context.
         */
        this.flowKey = false;
        /** Count of surrounding flow collection levels. */
        this.flowLevel = 0;
        /**
         * Minimum level of indentation required for next lines to be parsed as a
         * part of the current scalar value.
         */
        this.indentNext = 0;
        /** Indentation level of the current line. */
        this.indentValue = 0;
        /** Position of the next \n character. */
        this.lineEndPos = null;
        /** Stores the state of the lexer if reaching the end of incpomplete input */
        this.next = null;
        /** A pointer to `buffer`; the current position of the lexer. */
        this.pos = 0;
    }
    /**
     * Generate YAML tokens from the `source` string. If `incomplete`,
     * a part of the last line may be left as a buffer for the next call.
     *
     * @returns A generator of lexical tokens
     */
    *lex(source, incomplete = false) {
        if (source) {
            if (typeof source !== 'string')
                throw TypeError('source is not a string');
            this.buffer = this.buffer ? this.buffer + source : source;
            this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? 'stream';
        while (next && (incomplete || this.hasChars(1)))
            next = yield* this.parseNext(next);
    }
    atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === ' ' || ch === '\t')
            ch = this.buffer[++i];
        if (!ch || ch === '#' || ch === '\n')
            return true;
        if (ch === '\r')
            return this.buffer[i + 1] === '\n';
        return false;
    }
    charAt(n) {
        return this.buffer[this.pos + n];
    }
    continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
            let indent = 0;
            while (ch === ' ')
                ch = this.buffer[++indent + offset];
            if (ch === '\r') {
                const next = this.buffer[indent + offset + 1];
                if (next === '\n' || (!next && !this.atEnd))
                    return offset + indent + 1;
            }
            return ch === '\n' || indent >= this.indentNext || (!ch && !this.atEnd)
                ? offset + indent
                : -1;
        }
        if (ch === '-' || ch === '.') {
            const dt = this.buffer.substr(offset, 3);
            if ((dt === '---' || dt === '...') && isEmpty(this.buffer[offset + 3]))
                return -1;
        }
        return offset;
    }
    getLine() {
        let end = this.lineEndPos;
        if (typeof end !== 'number' || (end !== -1 && end < this.pos)) {
            end = this.buffer.indexOf('\n', this.pos);
            this.lineEndPos = end;
        }
        if (end === -1)
            return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === '\r')
            end -= 1;
        return this.buffer.substring(this.pos, end);
    }
    hasChars(n) {
        return this.pos + n <= this.buffer.length;
    }
    setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
    }
    peek(n) {
        return this.buffer.substr(this.pos, n);
    }
    *parseNext(next) {
        switch (next) {
            case 'stream':
                return yield* this.parseStream();
            case 'line-start':
                return yield* this.parseLineStart();
            case 'block-start':
                return yield* this.parseBlockStart();
            case 'doc':
                return yield* this.parseDocument();
            case 'flow':
                return yield* this.parseFlowCollection();
            case 'quoted-scalar':
                return yield* this.parseQuotedScalar();
            case 'block-scalar':
                return yield* this.parseBlockScalar();
            case 'plain-scalar':
                return yield* this.parsePlainScalar();
        }
    }
    *parseStream() {
        let line = this.getLine();
        if (line === null)
            return this.setNext('stream');
        if (line[0] === cst.BOM) {
            yield* this.pushCount(1);
            line = line.substring(1);
        }
        if (line[0] === '%') {
            let dirEnd = line.length;
            let cs = line.indexOf('#');
            while (cs !== -1) {
                const ch = line[cs - 1];
                if (ch === ' ' || ch === '\t') {
                    dirEnd = cs - 1;
                    break;
                }
                else {
                    cs = line.indexOf('#', cs + 1);
                }
            }
            while (true) {
                const ch = line[dirEnd - 1];
                if (ch === ' ' || ch === '\t')
                    dirEnd -= 1;
                else
                    break;
            }
            const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
            yield* this.pushCount(line.length - n); // possible comment
            this.pushNewline();
            return 'stream';
        }
        if (this.atLineEnd()) {
            const sp = yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - sp);
            yield* this.pushNewline();
            return 'stream';
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
    }
    *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
            return this.setNext('line-start');
        if (ch === '-' || ch === '.') {
            if (!this.atEnd && !this.hasChars(4))
                return this.setNext('line-start');
            const s = this.peek(3);
            if ((s === '---' || s === '...') && isEmpty(this.charAt(3))) {
                yield* this.pushCount(3);
                this.indentValue = 0;
                this.indentNext = 0;
                return s === '---' ? 'doc' : 'stream';
            }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
            this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
    }
    *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
            return this.setNext('block-start');
        if ((ch0 === '-' || ch0 === '?' || ch0 === ':') && isEmpty(ch1)) {
            const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
            this.indentNext = this.indentValue + 1;
            this.indentValue += n;
            return 'block-start';
        }
        return 'doc';
    }
    *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
            return this.setNext('doc');
        let n = yield* this.pushIndicators();
        switch (line[n]) {
            case '#':
                yield* this.pushCount(line.length - n);
            // fallthrough
            case undefined:
                yield* this.pushNewline();
                return yield* this.parseLineStart();
            case '{':
            case '[':
                yield* this.pushCount(1);
                this.flowKey = false;
                this.flowLevel = 1;
                return 'flow';
            case '}':
            case ']':
                // this is an error
                yield* this.pushCount(1);
                return 'doc';
            case '*':
                yield* this.pushUntil(isNotAnchorChar);
                return 'doc';
            case '"':
            case "'":
                return yield* this.parseQuotedScalar();
            case '|':
            case '>':
                n += yield* this.parseBlockScalarHeader();
                n += yield* this.pushSpaces(true);
                yield* this.pushCount(line.length - n);
                yield* this.pushNewline();
                return yield* this.parseBlockScalar();
            default:
                return yield* this.parsePlainScalar();
        }
    }
    *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
            nl = yield* this.pushNewline();
            if (nl > 0) {
                sp = yield* this.pushSpaces(false);
                this.indentValue = indent = sp;
            }
            else {
                sp = 0;
            }
            sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
            return this.setNext('flow');
        if ((indent !== -1 && indent < this.indentNext && line[0] !== '#') ||
            (indent === 0 &&
                (line.startsWith('---') || line.startsWith('...')) &&
                isEmpty(line[3]))) {
            // Allowing for the terminal ] or } at the same (rather than greater)
            // indent level as the initial [ or { is technically invalid, but
            // failing here would be surprising to users.
            const atFlowEndMarker = indent === this.indentNext - 1 &&
                this.flowLevel === 1 &&
                (line[0] === ']' || line[0] === '}');
            if (!atFlowEndMarker) {
                // this is an error
                this.flowLevel = 0;
                yield cst.FLOW_END;
                return yield* this.parseLineStart();
            }
        }
        let n = 0;
        while (line[n] === ',') {
            n += yield* this.pushCount(1);
            n += yield* this.pushSpaces(true);
            this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
            case undefined:
                return 'flow';
            case '#':
                yield* this.pushCount(line.length - n);
                return 'flow';
            case '{':
            case '[':
                yield* this.pushCount(1);
                this.flowKey = false;
                this.flowLevel += 1;
                return 'flow';
            case '}':
            case ']':
                yield* this.pushCount(1);
                this.flowKey = true;
                this.flowLevel -= 1;
                return this.flowLevel ? 'flow' : 'doc';
            case '*':
                yield* this.pushUntil(isNotAnchorChar);
                return 'flow';
            case '"':
            case "'":
                this.flowKey = true;
                return yield* this.parseQuotedScalar();
            case ':': {
                const next = this.charAt(1);
                if (this.flowKey || isEmpty(next) || next === ',') {
                    this.flowKey = false;
                    yield* this.pushCount(1);
                    yield* this.pushSpaces(true);
                    return 'flow';
                }
            }
            // fallthrough
            default:
                this.flowKey = false;
                return yield* this.parsePlainScalar();
        }
    }
    *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
            while (end !== -1 && this.buffer[end + 1] === "'")
                end = this.buffer.indexOf("'", end + 2);
        }
        else {
            // double-quote
            while (end !== -1) {
                let n = 0;
                while (this.buffer[end - 1 - n] === '\\')
                    n += 1;
                if (n % 2 === 0)
                    break;
                end = this.buffer.indexOf('"', end + 1);
            }
        }
        // Only looking for newlines within the quotes
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf('\n', this.pos);
        if (nl !== -1) {
            while (nl !== -1) {
                const cs = this.continueScalar(nl + 1);
                if (cs === -1)
                    break;
                nl = qb.indexOf('\n', cs);
            }
            if (nl !== -1) {
                // this is an error caused by an unexpected unindent
                end = nl - (qb[nl - 1] === '\r' ? 2 : 1);
            }
        }
        if (end === -1) {
            if (!this.atEnd)
                return this.setNext('quoted-scalar');
            end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? 'flow' : 'doc';
    }
    *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
            const ch = this.buffer[++i];
            if (ch === '+')
                this.blockScalarKeep = true;
            else if (ch > '0' && ch <= '9')
                this.blockScalarIndent = Number(ch) - 1;
            else if (ch !== '-')
                break;
        }
        return yield* this.pushUntil(ch => isEmpty(ch) || ch === '#');
    }
    *parseBlockScalar() {
        let nl = this.pos - 1; // may be -1 if this.pos === 0
        let indent = 0;
        let ch;
        loop: for (let i = this.pos; (ch = this.buffer[i]); ++i) {
            switch (ch) {
                case ' ':
                    indent += 1;
                    break;
                case '\n':
                    nl = i;
                    indent = 0;
                    break;
                case '\r': {
                    const next = this.buffer[i + 1];
                    if (!next && !this.atEnd)
                        return this.setNext('block-scalar');
                    if (next === '\n')
                        break;
                } // fallthrough
                default:
                    break loop;
            }
        }
        if (!ch && !this.atEnd)
            return this.setNext('block-scalar');
        if (indent >= this.indentNext) {
            if (this.blockScalarIndent === -1)
                this.indentNext = indent;
            else {
                this.indentNext =
                    this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
            }
            do {
                const cs = this.continueScalar(nl + 1);
                if (cs === -1)
                    break;
                nl = this.buffer.indexOf('\n', cs);
            } while (nl !== -1);
            if (nl === -1) {
                if (!this.atEnd)
                    return this.setNext('block-scalar');
                nl = this.buffer.length;
            }
        }
        // Trailing insufficiently indented tabs are invalid.
        // To catch that during parsing, we include them in the block scalar value.
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === ' ')
            ch = this.buffer[++i];
        if (ch === '\t') {
            while (ch === '\t' || ch === ' ' || ch === '\r' || ch === '\n')
                ch = this.buffer[++i];
            nl = i - 1;
        }
        else if (!this.blockScalarKeep) {
            do {
                let i = nl - 1;
                let ch = this.buffer[i];
                if (ch === '\r')
                    ch = this.buffer[--i];
                const lastChar = i; // Drop the line if last char not more indented
                while (ch === ' ')
                    ch = this.buffer[--i];
                if (ch === '\n' && i >= this.pos && i + 1 + indent > lastChar)
                    nl = i;
                else
                    break;
            } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
    }
    *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while ((ch = this.buffer[++i])) {
            if (ch === ':') {
                const next = this.buffer[i + 1];
                if (isEmpty(next) || (inFlow && flowIndicatorChars.has(next)))
                    break;
                end = i;
            }
            else if (isEmpty(ch)) {
                let next = this.buffer[i + 1];
                if (ch === '\r') {
                    if (next === '\n') {
                        i += 1;
                        ch = '\n';
                        next = this.buffer[i + 1];
                    }
                    else
                        end = i;
                }
                if (next === '#' || (inFlow && flowIndicatorChars.has(next)))
                    break;
                if (ch === '\n') {
                    const cs = this.continueScalar(i + 1);
                    if (cs === -1)
                        break;
                    i = Math.max(i, cs - 2); // to advance, but still account for ' #'
                }
            }
            else {
                if (inFlow && flowIndicatorChars.has(ch))
                    break;
                end = i;
            }
        }
        if (!ch && !this.atEnd)
            return this.setNext('plain-scalar');
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? 'flow' : 'doc';
    }
    *pushCount(n) {
        if (n > 0) {
            yield this.buffer.substr(this.pos, n);
            this.pos += n;
            return n;
        }
        return 0;
    }
    *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
            yield s;
            this.pos += s.length;
            return s.length;
        }
        else if (allowEmpty)
            yield '';
        return 0;
    }
    *pushIndicators() {
        let n = 0;
        loop: while (true) {
            switch (this.charAt(0)) {
                case '!':
                    n += yield* this.pushTag();
                    n += yield* this.pushSpaces(true);
                    continue loop;
                case '&':
                    n += yield* this.pushUntil(isNotAnchorChar);
                    n += yield* this.pushSpaces(true);
                    continue loop;
                case '-': // this is an error
                case '?': // this is an error outside flow collections
                case ':': {
                    const inFlow = this.flowLevel > 0;
                    const ch1 = this.charAt(1);
                    if (isEmpty(ch1) || (inFlow && flowIndicatorChars.has(ch1))) {
                        if (!inFlow)
                            this.indentNext = this.indentValue + 1;
                        else if (this.flowKey)
                            this.flowKey = false;
                        n += yield* this.pushCount(1);
                        n += yield* this.pushSpaces(true);
                        continue loop;
                    }
                }
            }
            break loop;
        }
        return n;
    }
    *pushTag() {
        if (this.charAt(1) === '<') {
            let i = this.pos + 2;
            let ch = this.buffer[i];
            while (!isEmpty(ch) && ch !== '>')
                ch = this.buffer[++i];
            return yield* this.pushToIndex(ch === '>' ? i + 1 : i, false);
        }
        else {
            let i = this.pos + 1;
            let ch = this.buffer[i];
            while (ch) {
                if (tagChars.has(ch))
                    ch = this.buffer[++i];
                else if (ch === '%' &&
                    hexDigits.has(this.buffer[i + 1]) &&
                    hexDigits.has(this.buffer[i + 2])) {
                    ch = this.buffer[(i += 3)];
                }
                else
                    break;
            }
            return yield* this.pushToIndex(i, false);
        }
    }
    *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === '\n')
            return yield* this.pushCount(1);
        else if (ch === '\r' && this.charAt(1) === '\n')
            return yield* this.pushCount(2);
        else
            return 0;
    }
    *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
            ch = this.buffer[++i];
        } while (ch === ' ' || (allowTabs && ch === '\t'));
        const n = i - this.pos;
        if (n > 0) {
            yield this.buffer.substr(this.pos, n);
            this.pos = i;
        }
        return n;
    }
    *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
            ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
    }
}

exports.Lexer = Lexer;

},
function(module,exports,load){
'use strict';

/**
 * Tracks newlines during parsing in order to provide an efficient API for
 * determining the one-indexed `{ line, col }` position for any offset
 * within the input.
 */
class LineCounter {
    constructor() {
        this.lineStarts = [];
        /**
         * Should be called in ascending order. Otherwise, call
         * `lineCounter.lineStarts.sort()` before calling `linePos()`.
         */
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        /**
         * Performs a binary search and returns the 1-indexed { line, col }
         * position of `offset`. If `line === 0`, `addNewLine` has never been
         * called or `offset` is before the first known newline.
         */
        this.linePos = (offset) => {
            let low = 0;
            let high = this.lineStarts.length;
            while (low < high) {
                const mid = (low + high) >> 1; // Math.floor((low + high) / 2)
                if (this.lineStarts[mid] < offset)
                    low = mid + 1;
                else
                    high = mid;
            }
            if (this.lineStarts[low] === offset)
                return { line: low + 1, col: 1 };
            if (low === 0)
                return { line: 0, col: offset };
            const start = this.lineStarts[low - 1];
            return { line: low, col: offset - start + 1 };
        };
    }
}

exports.LineCounter = LineCounter;

},
function(module,exports,load){
'use strict';

var node_process = ({env:{}});
var cst = load(64);
var lexer = load(68);

function includesToken(list, type) {
    for (let i = 0; i < list.length; ++i)
        if (list[i].type === type)
            return true;
    return false;
}
function findNonEmptyIndex(list) {
    for (let i = 0; i < list.length; ++i) {
        switch (list[i].type) {
            case 'space':
            case 'comment':
            case 'newline':
                break;
            default:
                return i;
        }
    }
    return -1;
}
function isFlowToken(token) {
    switch (token?.type) {
        case 'alias':
        case 'scalar':
        case 'single-quoted-scalar':
        case 'double-quoted-scalar':
        case 'flow-collection':
            return true;
        default:
            return false;
    }
}
function getPrevProps(parent) {
    switch (parent.type) {
        case 'document':
            return parent.start;
        case 'block-map': {
            const it = parent.items[parent.items.length - 1];
            return it.sep ?? it.start;
        }
        case 'block-seq':
            return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
            return [];
    }
}
/** Note: May modify input array */
function getFirstKeyStartProps(prev) {
    if (prev.length === 0)
        return [];
    let i = prev.length;
    loop: while (--i >= 0) {
        switch (prev[i].type) {
            case 'doc-start':
            case 'explicit-key-ind':
            case 'map-value-ind':
            case 'seq-item-ind':
            case 'newline':
                break loop;
        }
    }
    while (prev[++i]?.type === 'space') {
        /* loop */
    }
    return prev.splice(i, prev.length);
}
function arrayPushArray(target, source) {
    // May exhaust call stack with large `source` array
    if (source.length < 1e5)
        Array.prototype.push.apply(target, source);
    else
        for (let i = 0; i < source.length; ++i)
            target.push(source[i]);
}
function fixFlowSeqItems(fc) {
    if (fc.start.type === 'flow-seq-start') {
        for (const it of fc.items) {
            if (it.sep &&
                !it.value &&
                !includesToken(it.start, 'explicit-key-ind') &&
                !includesToken(it.sep, 'map-value-ind')) {
                if (it.key)
                    it.value = it.key;
                delete it.key;
                if (isFlowToken(it.value)) {
                    if (it.value.end)
                        arrayPushArray(it.value.end, it.sep);
                    else
                        it.value.end = it.sep;
                }
                else
                    arrayPushArray(it.start, it.sep);
                delete it.sep;
            }
        }
    }
}
/**
 * A YAML concrete syntax tree (CST) parser
 *
 * ```ts
 * const src: string = ...
 * for (const token of new Parser().parse(src)) {
 *   // token: Token
 * }
 * ```
 *
 * To use the parser with a user-provided lexer:
 *
 * ```ts
 * function* parse(source: string, lexer: Lexer) {
 *   const parser = new Parser()
 *   for (const lexeme of lexer.lex(source))
 *     yield* parser.next(lexeme)
 *   yield* parser.end()
 * }
 *
 * const src: string = ...
 * const lexer = new Lexer()
 * for (const token of parse(src, lexer)) {
 *   // token: Token
 * }
 * ```
 */
class Parser {
    /**
     * @param onNewLine - If defined, called separately with the start position of
     *   each new line (in `parse()`, including the start of input).
     */
    constructor(onNewLine) {
        /** If true, space and sequence indicators count as indentation */
        this.atNewLine = true;
        /** If true, next token is a scalar value */
        this.atScalar = false;
        /** Current indentation level */
        this.indent = 0;
        /** Current offset since the start of parsing */
        this.offset = 0;
        /** On the same line with a block map key */
        this.onKeyLine = false;
        /** Top indicates the node that's currently being built */
        this.stack = [];
        /** The source of the current token, set in parse() */
        this.source = '';
        /** The type of the current token, set in parse() */
        this.type = '';
        // Must be defined after `next()`
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
    }
    /**
     * Parse `source` as a YAML stream.
     * If `incomplete`, a part of the last line may be left as a buffer for the next call.
     *
     * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
     *
     * @returns A generator of tokens representing each directive, document, and other structure.
     */
    *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
            this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
            yield* this.next(lexeme);
        if (!incomplete)
            yield* this.end();
    }
    /**
     * Advance the parser by the `source` of one lexical token.
     */
    *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
            console.log('|', cst.prettyToken(source));
        if (this.atScalar) {
            this.atScalar = false;
            yield* this.step();
            this.offset += source.length;
            return;
        }
        const type = cst.tokenType(source);
        if (!type) {
            const message = `Not a YAML token: ${source}`;
            yield* this.pop({ type: 'error', offset: this.offset, message, source });
            this.offset += source.length;
        }
        else if (type === 'scalar') {
            this.atNewLine = false;
            this.atScalar = true;
            this.type = 'scalar';
        }
        else {
            this.type = type;
            yield* this.step();
            switch (type) {
                case 'newline':
                    this.atNewLine = true;
                    this.indent = 0;
                    if (this.onNewLine)
                        this.onNewLine(this.offset + source.length);
                    break;
                case 'space':
                    if (this.atNewLine && source[0] === ' ')
                        this.indent += source.length;
                    break;
                case 'explicit-key-ind':
                case 'map-value-ind':
                case 'seq-item-ind':
                    if (this.atNewLine)
                        this.indent += source.length;
                    break;
                case 'doc-mode':
                case 'flow-error-end':
                    return;
                default:
                    this.atNewLine = false;
            }
            this.offset += source.length;
        }
    }
    /** Call at end of input to push out any remaining constructions */
    *end() {
        while (this.stack.length > 0)
            yield* this.pop();
    }
    get sourceToken() {
        const st = {
            type: this.type,
            offset: this.offset,
            indent: this.indent,
            source: this.source
        };
        return st;
    }
    *step() {
        const top = this.peek(1);
        if (this.type === 'doc-end' && top?.type !== 'doc-end') {
            while (this.stack.length > 0)
                yield* this.pop();
            this.stack.push({
                type: 'doc-end',
                offset: this.offset,
                source: this.source
            });
            return;
        }
        if (!top)
            return yield* this.stream();
        switch (top.type) {
            case 'document':
                return yield* this.document(top);
            case 'alias':
            case 'scalar':
            case 'single-quoted-scalar':
            case 'double-quoted-scalar':
                return yield* this.scalar(top);
            case 'block-scalar':
                return yield* this.blockScalar(top);
            case 'block-map':
                return yield* this.blockMap(top);
            case 'block-seq':
                return yield* this.blockSequence(top);
            case 'flow-collection':
                return yield* this.flowCollection(top);
            case 'doc-end':
                return yield* this.documentEnd(top);
        }
        /* istanbul ignore next should not happen */
        yield* this.pop();
    }
    peek(n) {
        return this.stack[this.stack.length - n];
    }
    *pop(error) {
        const token = error ?? this.stack.pop();
        /* istanbul ignore if should not happen */
        if (!token) {
            const message = 'Tried to pop an empty stack';
            yield { type: 'error', offset: this.offset, source: '', message };
        }
        else if (this.stack.length === 0) {
            yield token;
        }
        else {
            const top = this.peek(1);
            if (token.type === 'block-scalar') {
                // Block scalars use their parent rather than header indent
                token.indent = 'indent' in top ? top.indent : 0;
            }
            else if (token.type === 'flow-collection' && top.type === 'document') {
                // Ignore all indent for top-level flow collections
                token.indent = 0;
            }
            if (token.type === 'flow-collection')
                fixFlowSeqItems(token);
            switch (top.type) {
                case 'document':
                    top.value = token;
                    break;
                case 'block-scalar':
                    top.props.push(token); // error
                    break;
                case 'block-map': {
                    const it = top.items[top.items.length - 1];
                    if (it.value) {
                        top.items.push({ start: [], key: token, sep: [] });
                        this.onKeyLine = true;
                        return;
                    }
                    else if (it.sep) {
                        it.value = token;
                    }
                    else {
                        Object.assign(it, { key: token, sep: [] });
                        this.onKeyLine = !it.explicitKey;
                        return;
                    }
                    break;
                }
                case 'block-seq': {
                    const it = top.items[top.items.length - 1];
                    if (it.value)
                        top.items.push({ start: [], value: token });
                    else
                        it.value = token;
                    break;
                }
                case 'flow-collection': {
                    const it = top.items[top.items.length - 1];
                    if (!it || it.value)
                        top.items.push({ start: [], key: token, sep: [] });
                    else if (it.sep)
                        it.value = token;
                    else
                        Object.assign(it, { key: token, sep: [] });
                    return;
                }
                /* istanbul ignore next should not happen */
                default:
                    yield* this.pop();
                    yield* this.pop(token);
            }
            if ((top.type === 'document' ||
                top.type === 'block-map' ||
                top.type === 'block-seq') &&
                (token.type === 'block-map' || token.type === 'block-seq')) {
                const last = token.items[token.items.length - 1];
                if (last &&
                    !last.sep &&
                    !last.value &&
                    last.start.length > 0 &&
                    findNonEmptyIndex(last.start) === -1 &&
                    (token.indent === 0 ||
                        last.start.every(st => st.type !== 'comment' || st.indent < token.indent))) {
                    if (top.type === 'document')
                        top.end = last.start;
                    else
                        top.items.push({ start: last.start });
                    token.items.splice(-1, 1);
                }
            }
        }
    }
    *stream() {
        switch (this.type) {
            case 'directive-line':
                yield { type: 'directive', offset: this.offset, source: this.source };
                return;
            case 'byte-order-mark':
            case 'space':
            case 'comment':
            case 'newline':
                yield this.sourceToken;
                return;
            case 'doc-mode':
            case 'doc-start': {
                const doc = {
                    type: 'document',
                    offset: this.offset,
                    start: []
                };
                if (this.type === 'doc-start')
                    doc.start.push(this.sourceToken);
                this.stack.push(doc);
                return;
            }
        }
        yield {
            type: 'error',
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML stream`,
            source: this.source
        };
    }
    *document(doc) {
        if (doc.value)
            return yield* this.lineEnd(doc);
        switch (this.type) {
            case 'doc-start': {
                if (findNonEmptyIndex(doc.start) !== -1) {
                    yield* this.pop();
                    yield* this.step();
                }
                else
                    doc.start.push(this.sourceToken);
                return;
            }
            case 'anchor':
            case 'tag':
            case 'space':
            case 'comment':
            case 'newline':
                doc.start.push(this.sourceToken);
                return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
            this.stack.push(bv);
        else {
            yield {
                type: 'error',
                offset: this.offset,
                message: `Unexpected ${this.type} token in YAML document`,
                source: this.source
            };
        }
    }
    *scalar(scalar) {
        if (this.type === 'map-value-ind') {
            const prev = getPrevProps(this.peek(2));
            const start = getFirstKeyStartProps(prev);
            let sep;
            if (scalar.end) {
                sep = scalar.end;
                sep.push(this.sourceToken);
                delete scalar.end;
            }
            else
                sep = [this.sourceToken];
            const map = {
                type: 'block-map',
                offset: scalar.offset,
                indent: scalar.indent,
                items: [{ start, key: scalar, sep }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
        }
        else
            yield* this.lineEnd(scalar);
    }
    *blockScalar(scalar) {
        switch (this.type) {
            case 'space':
            case 'comment':
            case 'newline':
                scalar.props.push(this.sourceToken);
                return;
            case 'scalar':
                scalar.source = this.source;
                // block-scalar source includes trailing newline
                this.atNewLine = true;
                this.indent = 0;
                if (this.onNewLine) {
                    let nl = this.source.indexOf('\n') + 1;
                    while (nl !== 0) {
                        this.onNewLine(this.offset + nl);
                        nl = this.source.indexOf('\n', nl) + 1;
                    }
                }
                yield* this.pop();
                break;
            /* istanbul ignore next should not happen */
            default:
                yield* this.pop();
                yield* this.step();
        }
    }
    *blockMap(map) {
        const it = map.items[map.items.length - 1];
        // it.sep is true-ish if pair already has key or : separator
        switch (this.type) {
            case 'newline':
                this.onKeyLine = false;
                if (it.value) {
                    const end = 'end' in it.value ? it.value.end : undefined;
                    const last = Array.isArray(end) ? end[end.length - 1] : undefined;
                    if (last?.type === 'comment')
                        end?.push(this.sourceToken);
                    else
                        map.items.push({ start: [this.sourceToken] });
                }
                else if (it.sep) {
                    it.sep.push(this.sourceToken);
                }
                else {
                    it.start.push(this.sourceToken);
                }
                return;
            case 'space':
            case 'comment':
                if (it.value) {
                    map.items.push({ start: [this.sourceToken] });
                }
                else if (it.sep) {
                    it.sep.push(this.sourceToken);
                }
                else {
                    if (this.atIndentedComment(it.start, map.indent)) {
                        const prev = map.items[map.items.length - 2];
                        const end = prev?.value?.end;
                        if (Array.isArray(end)) {
                            arrayPushArray(end, it.start);
                            end.push(this.sourceToken);
                            map.items.pop();
                            return;
                        }
                    }
                    it.start.push(this.sourceToken);
                }
                return;
        }
        if (this.indent >= map.indent) {
            const atMapIndent = !this.onKeyLine && this.indent === map.indent;
            const atNextItem = atMapIndent &&
                (it.sep || it.explicitKey) &&
                this.type !== 'seq-item-ind';
            // For empty nodes, assign newline-separated not indented empty tokens to following node
            let start = [];
            if (atNextItem && it.sep && !it.value) {
                const nl = [];
                for (let i = 0; i < it.sep.length; ++i) {
                    const st = it.sep[i];
                    switch (st.type) {
                        case 'newline':
                            nl.push(i);
                            break;
                        case 'space':
                            break;
                        case 'comment':
                            if (st.indent > map.indent)
                                nl.length = 0;
                            break;
                        default:
                            nl.length = 0;
                    }
                }
                if (nl.length >= 2)
                    start = it.sep.splice(nl[1]);
            }
            switch (this.type) {
                case 'anchor':
                case 'tag':
                    if (atNextItem || it.value) {
                        start.push(this.sourceToken);
                        map.items.push({ start });
                        this.onKeyLine = true;
                    }
                    else if (it.sep) {
                        it.sep.push(this.sourceToken);
                    }
                    else {
                        it.start.push(this.sourceToken);
                    }
                    return;
                case 'explicit-key-ind':
                    if (!it.sep && !it.explicitKey) {
                        it.start.push(this.sourceToken);
                        it.explicitKey = true;
                    }
                    else if (atNextItem || it.value) {
                        start.push(this.sourceToken);
                        map.items.push({ start, explicitKey: true });
                    }
                    else {
                        this.stack.push({
                            type: 'block-map',
                            offset: this.offset,
                            indent: this.indent,
                            items: [{ start: [this.sourceToken], explicitKey: true }]
                        });
                    }
                    this.onKeyLine = true;
                    return;
                case 'map-value-ind':
                    if (it.explicitKey) {
                        if (!it.sep) {
                            if (includesToken(it.start, 'newline')) {
                                Object.assign(it, { key: null, sep: [this.sourceToken] });
                            }
                            else {
                                const start = getFirstKeyStartProps(it.start);
                                this.stack.push({
                                    type: 'block-map',
                                    offset: this.offset,
                                    indent: this.indent,
                                    items: [{ start, key: null, sep: [this.sourceToken] }]
                                });
                            }
                        }
                        else if (it.value) {
                            map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                        }
                        else if (includesToken(it.sep, 'map-value-ind')) {
                            this.stack.push({
                                type: 'block-map',
                                offset: this.offset,
                                indent: this.indent,
                                items: [{ start, key: null, sep: [this.sourceToken] }]
                            });
                        }
                        else if (isFlowToken(it.key) &&
                            !includesToken(it.sep, 'newline')) {
                            const start = getFirstKeyStartProps(it.start);
                            const key = it.key;
                            const sep = it.sep;
                            sep.push(this.sourceToken);
                            // @ts-expect-error type guard is wrong here
                            delete it.key;
                            // @ts-expect-error type guard is wrong here
                            delete it.sep;
                            this.stack.push({
                                type: 'block-map',
                                offset: this.offset,
                                indent: this.indent,
                                items: [{ start, key, sep }]
                            });
                        }
                        else if (start.length > 0) {
                            // Not actually at next item
                            it.sep = it.sep.concat(start, this.sourceToken);
                        }
                        else {
                            it.sep.push(this.sourceToken);
                        }
                    }
                    else {
                        if (!it.sep) {
                            Object.assign(it, { key: null, sep: [this.sourceToken] });
                        }
                        else if (it.value || atNextItem) {
                            map.items.push({ start, key: null, sep: [this.sourceToken] });
                        }
                        else if (includesToken(it.sep, 'map-value-ind')) {
                            this.stack.push({
                                type: 'block-map',
                                offset: this.offset,
                                indent: this.indent,
                                items: [{ start: [], key: null, sep: [this.sourceToken] }]
                            });
                        }
                        else {
                            it.sep.push(this.sourceToken);
                        }
                    }
                    this.onKeyLine = true;
                    return;
                case 'alias':
                case 'scalar':
                case 'single-quoted-scalar':
                case 'double-quoted-scalar': {
                    const fs = this.flowScalar(this.type);
                    if (atNextItem || it.value) {
                        map.items.push({ start, key: fs, sep: [] });
                        this.onKeyLine = true;
                    }
                    else if (it.sep) {
                        this.stack.push(fs);
                    }
                    else {
                        Object.assign(it, { key: fs, sep: [] });
                        this.onKeyLine = true;
                    }
                    return;
                }
                default: {
                    const bv = this.startBlockValue(map);
                    if (bv) {
                        if (bv.type === 'block-seq') {
                            if (!it.explicitKey &&
                                it.sep &&
                                !includesToken(it.sep, 'newline')) {
                                yield* this.pop({
                                    type: 'error',
                                    offset: this.offset,
                                    message: 'Unexpected block-seq-ind on same line with key',
                                    source: this.source
                                });
                                return;
                            }
                        }
                        else if (atMapIndent) {
                            map.items.push({ start });
                        }
                        this.stack.push(bv);
                        return;
                    }
                }
            }
        }
        yield* this.pop();
        yield* this.step();
    }
    *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
            case 'newline':
                if (it.value) {
                    const end = 'end' in it.value ? it.value.end : undefined;
                    const last = Array.isArray(end) ? end[end.length - 1] : undefined;
                    if (last?.type === 'comment')
                        end?.push(this.sourceToken);
                    else
                        seq.items.push({ start: [this.sourceToken] });
                }
                else
                    it.start.push(this.sourceToken);
                return;
            case 'space':
            case 'comment':
                if (it.value)
                    seq.items.push({ start: [this.sourceToken] });
                else {
                    if (this.atIndentedComment(it.start, seq.indent)) {
                        const prev = seq.items[seq.items.length - 2];
                        const end = prev?.value?.end;
                        if (Array.isArray(end)) {
                            arrayPushArray(end, it.start);
                            end.push(this.sourceToken);
                            seq.items.pop();
                            return;
                        }
                    }
                    it.start.push(this.sourceToken);
                }
                return;
            case 'anchor':
            case 'tag':
                if (it.value || this.indent <= seq.indent)
                    break;
                it.start.push(this.sourceToken);
                return;
            case 'seq-item-ind':
                if (this.indent !== seq.indent)
                    break;
                if (it.value || includesToken(it.start, 'seq-item-ind'))
                    seq.items.push({ start: [this.sourceToken] });
                else
                    it.start.push(this.sourceToken);
                return;
        }
        if (this.indent > seq.indent) {
            const bv = this.startBlockValue(seq);
            if (bv) {
                this.stack.push(bv);
                return;
            }
        }
        yield* this.pop();
        yield* this.step();
    }
    *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === 'flow-error-end') {
            let top;
            do {
                yield* this.pop();
                top = this.peek(1);
            } while (top?.type === 'flow-collection');
        }
        else if (fc.end.length === 0) {
            switch (this.type) {
                case 'comma':
                case 'explicit-key-ind':
                    if (!it || it.sep)
                        fc.items.push({ start: [this.sourceToken] });
                    else
                        it.start.push(this.sourceToken);
                    return;
                case 'map-value-ind':
                    if (!it || it.value)
                        fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
                    else if (it.sep)
                        it.sep.push(this.sourceToken);
                    else
                        Object.assign(it, { key: null, sep: [this.sourceToken] });
                    return;
                case 'space':
                case 'comment':
                case 'newline':
                case 'anchor':
                case 'tag':
                    if (!it || it.value)
                        fc.items.push({ start: [this.sourceToken] });
                    else if (it.sep)
                        it.sep.push(this.sourceToken);
                    else
                        it.start.push(this.sourceToken);
                    return;
                case 'alias':
                case 'scalar':
                case 'single-quoted-scalar':
                case 'double-quoted-scalar': {
                    const fs = this.flowScalar(this.type);
                    if (!it || it.value)
                        fc.items.push({ start: [], key: fs, sep: [] });
                    else if (it.sep)
                        this.stack.push(fs);
                    else
                        Object.assign(it, { key: fs, sep: [] });
                    return;
                }
                case 'flow-map-end':
                case 'flow-seq-end':
                    fc.end.push(this.sourceToken);
                    return;
            }
            const bv = this.startBlockValue(fc);
            /* istanbul ignore else should not happen */
            if (bv)
                this.stack.push(bv);
            else {
                yield* this.pop();
                yield* this.step();
            }
        }
        else {
            const parent = this.peek(2);
            if (parent.type === 'block-map' &&
                ((this.type === 'map-value-ind' && parent.indent === fc.indent) ||
                    (this.type === 'newline' &&
                        !parent.items[parent.items.length - 1].sep))) {
                yield* this.pop();
                yield* this.step();
            }
            else if (this.type === 'map-value-ind' &&
                parent.type !== 'flow-collection') {
                const prev = getPrevProps(parent);
                const start = getFirstKeyStartProps(prev);
                fixFlowSeqItems(fc);
                const sep = fc.end.splice(1, fc.end.length);
                sep.push(this.sourceToken);
                const map = {
                    type: 'block-map',
                    offset: fc.offset,
                    indent: fc.indent,
                    items: [{ start, key: fc, sep }]
                };
                this.onKeyLine = true;
                this.stack[this.stack.length - 1] = map;
            }
            else {
                yield* this.lineEnd(fc);
            }
        }
    }
    flowScalar(type) {
        if (this.onNewLine) {
            let nl = this.source.indexOf('\n') + 1;
            while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf('\n', nl) + 1;
            }
        }
        return {
            type,
            offset: this.offset,
            indent: this.indent,
            source: this.source
        };
    }
    startBlockValue(parent) {
        switch (this.type) {
            case 'alias':
            case 'scalar':
            case 'single-quoted-scalar':
            case 'double-quoted-scalar':
                return this.flowScalar(this.type);
            case 'block-scalar-header':
                return {
                    type: 'block-scalar',
                    offset: this.offset,
                    indent: this.indent,
                    props: [this.sourceToken],
                    source: ''
                };
            case 'flow-map-start':
            case 'flow-seq-start':
                return {
                    type: 'flow-collection',
                    offset: this.offset,
                    indent: this.indent,
                    start: this.sourceToken,
                    items: [],
                    end: []
                };
            case 'seq-item-ind':
                return {
                    type: 'block-seq',
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [this.sourceToken] }]
                };
            case 'explicit-key-ind': {
                this.onKeyLine = true;
                const prev = getPrevProps(parent);
                const start = getFirstKeyStartProps(prev);
                start.push(this.sourceToken);
                return {
                    type: 'block-map',
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, explicitKey: true }]
                };
            }
            case 'map-value-ind': {
                this.onKeyLine = true;
                const prev = getPrevProps(parent);
                const start = getFirstKeyStartProps(prev);
                return {
                    type: 'block-map',
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                };
            }
        }
        return null;
    }
    atIndentedComment(start, indent) {
        if (this.type !== 'comment')
            return false;
        if (this.indent <= indent)
            return false;
        return start.every(st => st.type === 'newline' || st.type === 'space');
    }
    *documentEnd(docEnd) {
        if (this.type !== 'doc-mode') {
            if (docEnd.end)
                docEnd.end.push(this.sourceToken);
            else
                docEnd.end = [this.sourceToken];
            if (this.type === 'newline')
                yield* this.pop();
        }
    }
    *lineEnd(token) {
        switch (this.type) {
            case 'comma':
            case 'doc-start':
            case 'doc-end':
            case 'flow-seq-end':
            case 'flow-map-end':
            case 'map-value-ind':
                yield* this.pop();
                yield* this.step();
                break;
            case 'newline':
                this.onKeyLine = false;
            // fallthrough
            case 'space':
            case 'comment':
            default:
                // all other values are errors
                if (token.end)
                    token.end.push(this.sourceToken);
                else
                    token.end = [this.sourceToken];
                if (this.type === 'newline')
                    yield* this.pop();
        }
    }
}

exports.Parser = Parser;

},
function(module,exports,load){
'use strict';

var composer = load(1);
var Document = load(5);
var errors = load(48);
var log = load(21);
var identity = load(3);
var lineCounter = load(69);
var parser = load(70);

function parseOptions(options) {
    const prettyErrors = options.prettyErrors !== false;
    const lineCounter$1 = options.lineCounter || (prettyErrors && new lineCounter.LineCounter()) || null;
    return { lineCounter: lineCounter$1, prettyErrors };
}
/**
 * Parse the input as a stream of YAML documents.
 *
 * Documents should be separated from each other by `...` or `---` marker lines.
 *
 * @returns If an empty `docs` array is returned, it will be of type
 *   EmptyStream and contain additional stream information. In
 *   TypeScript, you should use `'empty' in docs` as a type guard for it.
 */
function parseAllDocuments(source, options = {}) {
    const { lineCounter, prettyErrors } = parseOptions(options);
    const parser$1 = new parser.Parser(lineCounter?.addNewLine);
    const composer$1 = new composer.Composer(options);
    const docs = Array.from(composer$1.compose(parser$1.parse(source)));
    if (prettyErrors && lineCounter)
        for (const doc of docs) {
            doc.errors.forEach(errors.prettifyError(source, lineCounter));
            doc.warnings.forEach(errors.prettifyError(source, lineCounter));
        }
    if (docs.length > 0)
        return docs;
    return Object.assign([], { empty: true }, composer$1.streamInfo());
}
/** Parse an input string into a single YAML.Document */
function parseDocument(source, options = {}) {
    const { lineCounter, prettyErrors } = parseOptions(options);
    const parser$1 = new parser.Parser(lineCounter?.addNewLine);
    const composer$1 = new composer.Composer(options);
    // `doc` is always set by compose.end(true) at the very latest
    let doc = null;
    for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
            doc = _doc;
        else if (doc.options.logLevel !== 'silent') {
            doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), 'MULTIPLE_DOCS', 'Source contains multiple documents; please use YAML.parseAllDocuments()'));
            break;
        }
    }
    if (prettyErrors && lineCounter) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter));
    }
    return doc;
}
function parse(src, reviver, options) {
    let _reviver = undefined;
    if (typeof reviver === 'function') {
        _reviver = reviver;
    }
    else if (options === undefined && reviver && typeof reviver === 'object') {
        options = reviver;
    }
    const doc = parseDocument(src, options);
    if (!doc)
        return null;
    doc.warnings.forEach(warning => log.warn(doc.options.logLevel, warning));
    if (doc.errors.length > 0) {
        if (doc.options.logLevel !== 'silent')
            throw doc.errors[0];
        else
            doc.errors = [];
    }
    return doc.toJS(Object.assign({ reviver: _reviver }, options));
}
function stringify(value, replacer, options) {
    let _replacer = null;
    if (typeof replacer === 'function' || Array.isArray(replacer)) {
        _replacer = replacer;
    }
    else if (options === undefined && replacer) {
        options = replacer;
    }
    if (typeof options === 'string')
        options = options.length;
    if (typeof options === 'number') {
        const indent = Math.round(options);
        options = indent < 1 ? undefined : indent > 8 ? { indent: 8 } : { indent };
    }
    if (value === undefined) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
            return undefined;
    }
    if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
    return new Document.Document(value, _replacer, options).toString(options);
}

exports.parse = parse;
exports.parseAllDocuments = parseAllDocuments;
exports.parseDocument = parseDocument;
exports.stringify = stringify;

}];
const cache = [];
function load(id) {if(cache[id]) return cache[id].exports; const module = cache[id] = {exports:{}}; modules[id](module,module.exports,load); return module.exports;}
return load(0);
})();
// END BUNDLED YAML
// BEGIN BUNDLED PROPERTY HAG RESOURCES
const bundledHagResources = {"logo":"data:image/png;base64,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","help":{"starter":"# Property Hag\n\nChoose a tool:\n\n- **List properties** — browse names, types, and how many notes use them.\n- **Batch actions** — choose a change, filter your notes, then review and confirm Apply.\n- **Find inconsistencies** — review possible mistakes or formatting differences.\n- **Batch history / Undo** — review saved changes and restore eligible notes.\n\nBrowsing and previews do not change notes. Apply and Undo each ask for confirmation.\n\nIn Batch actions, use **+ Add filter** to combine property conditions. Choose **All conditions (AND)** or **Any condition (OR)**. Filter value types are inferred where possible.\n\n## Getting around\n\nUse **Back** to return. Click **?** for help, then close help to continue. The Back/Help row stays visible while you scroll.\n\nOn desktop, drag a window's title to move it or its bottom-right corner to resize it. Click table headings to sort; drag column dividers to adjust widths. Desktop windows keep their size while you search.\n\nOn mobile, windows fit the screen and adjust for the keyboard and rotation. Forms stack vertically; tables retain compact rows and columns with horizontal scrolling when needed. Tap a heading to sort and scroll to see more notes or controls. Window and column dragging remain desktop-only controls.\n\nSearches and table settings are remembered while the plugin is running. Desktop and mobile are supported; physical Android/iPhone validation of the mobile is still pending.\n\n## Search terms and operators\n\nSearch is case-insensitive and matches parts of words. Use:\n\n- `study; research` or `study OR research` for either term.\n- `study AND notes` or `study notes` for both terms, in any order.\n- `study -archived` or `study NOT archived` to exclude archived matches.\n- `\"study notes\"` for that exact phrase, with the words together.\n\nNOT/minus applies first, then AND, then OR/semicolon. For example, `study OR research AND notes` matches study, or matches both research and notes. To exclude archived results from both alternatives, use `study NOT archived OR research NOT archived`. Operators also accept lowercase. Quote literal operator words or semicolons, such as `\"AND\"` or `\"a;b\"`.\n\nAn unfinished or invalid query shows an error and matches nothing. In Batch actions, selections that no longer match are cleared. These operators apply to search bars; property/value suggestion dropdowns and the typed **Match value** filter continue to use literal values. Search still uses each screen's existing fields; it does not search all note content.\n","properties":"# List properties\n\nEach row shows a property used in your notes:\n\n- **Property** — its name.\n- **Uses** — the number of notes containing it, including empty values.\n- **Empty** — the number of notes where it is blank, null, or an empty list. Missing properties, zero, and unchecked checkboxes do not count as empty.\n- **Type** — the values found in those notes, such as Text, Number, Checkbox, or List. **Mixed** means more than one type is used.\n\nA list with several items still counts once per note. Type reflects the saved values, which may differ from Obsidian's property settings.\n\nSearch by part of a name. Click a property to see its notes and values. Click headings to sort, or, on desktop, drag dividers to resize columns.\n\nOnly properties in the note's main properties section are included. If Obsidian is still indexing, reopen the list when it finishes.\n\nUse **Back** for the main menu. Searching keeps the window size steady; resize it manually if needed.\n\n## Search terms and operators\n\nSearch is case-insensitive and matches parts of words. Use:\n\n- `study; research` or `study OR research` for either term.\n- `study AND notes` or `study notes` for both terms, in any order.\n- `study -archived` or `study NOT archived` to exclude archived matches.\n- `\"study notes\"` for that exact phrase, with the words together.\n\nNOT/minus applies first, then AND, then OR/semicolon. For example, `study OR research AND notes` matches study, or matches both research and notes. To exclude archived results from both alternatives, use `study NOT archived OR research NOT archived`. Operators also accept lowercase. Quote literal operator words or semicolons, such as `\"AND\"` or `\"a;b\"`.\n\nAn unfinished or invalid query shows an error and matches nothing. In Batch actions, selections that no longer match are cleared. These operators apply to search bars; property/value suggestion dropdowns and the typed **Match value** filter continue to use literal values. Search still uses each screen's existing fields; it does not search all note content.\n","property-details":"# Property details\n\nEach row shows a note and the chosen property's value.\n\nSearch by note title or value. Click a note link to open it. Hover over a shortened title to see the full path. Lists appear as comma-separated values; **(empty)** means no value.\n\nClick a heading to sort or drag the column divider to adjust widths.\n\nChoose **Batch actions for this property** to start a batch edit with the property name filled in. You still choose the operation and notes, then review a preview before saving.\n\nUse **Back** to return to the property list. Viewing or searching does not change notes or resize the window.\n\n## Search terms and operators\n\nSearch is case-insensitive and matches parts of words. Use:\n\n- `study; research` or `study OR research` for either term.\n- `study AND notes` or `study notes` for both terms, in any order.\n- `study -archived` or `study NOT archived` to exclude archived matches.\n- `\"study notes\"` for that exact phrase, with the words together.\n\nNOT/minus applies first, then AND, then OR/semicolon. For example, `study OR research AND notes` matches study, or matches both research and notes. To exclude archived results from both alternatives, use `study NOT archived OR research NOT archived`. Operators also accept lowercase. Quote literal operator words or semicolons, such as `\"AND\"` or `\"a;b\"`.\n\nAn unfinished or invalid query shows an error and matches nothing. In Batch actions, selections that no longer match are cleared. These operators apply to search bars; property/value suggestion dropdowns and the typed **Match value** filter continue to use literal values. Search still uses each screen's existing fields; it does not search all note content.\n","batch-actions":"# Batch actions\n\nPrepare a change in three steps: choose a change, choose notes, then review and apply. Browsing and Preview do not save notes.\n\n## 1. Choose a change\n\nChoose an **Operation** and click **Property name** for suggestions, or type a name. This property is independent of the properties used in your filters.\n\n- **Create property** — add it where missing; skip notes that already have it.\n- **Set property value** — change it where present; skip notes where missing.\n- **Rename property** — change its name. Notes already using the new name are conflicts.\n- **Replace value** — replace the exact existing value you enter.\n- **Add list item** — add an item without duplicating it. A missing property can become a list.\n- **Remove list item** — remove every matching item, keeping the property.\n- **Replace list item** — replace matching items, keeping the others in order.\n- **Delete property** — remove the property, keeping the note.\n- **Delete empty properties** — remove it where its value is empty.\n\nOnly relevant fields appear. Entered values are kept when switching operations. Use the property condition cards in step 2 to narrow your notes. Each operation also keeps its own eligibility rules, such as creating a property only where it is missing.\n\nFor replacement operations, **Match value** is the original value or list item you want to replace. To replace archived with active, enter **archived** as Match value and **active** as New value.\n\nChoose Text, Number, Checkbox, List, or Empty (null) when entering a new value. Click or focus text/number fields for existing-value suggestions. Choose with the mouse or arrow keys and Enter, or type something new.\n\nFor lists, use **+ Add item** for each item and **×** to remove a row. No rows means an empty list. List-item operations change individual items, preserving other items. Dates use Text for now.\n\nReview warnings about incompatible types or values being cleared.\n\n## 2. Choose notes\n\n**Scope** shows the vault or folder you are working with. For a folder, **Include subfolders** includes notes inside its subfolders. To start from a folder, right-click it in Obsidian and choose **Batch Edit Properties**.\n\nChoose **+ Add filter** for each property condition. Each card offers a **Filter property**, **Filter condition**, and a typed **Filter value** when needed. Property and value fields suggest existing names and values. Choose **Remove** on a card to delete that condition.\n\nValue types are inferred from the property and condition. Text properties show text suggestions, numbers use a number input, and checkbox properties offer Checked/Unchecked. Contains on a list uses its item types and suggestions. A type selector appears only for mixed or unknown types. Exists, Is missing, and Is empty need no value.\n\n- **All conditions (AND)** — a note must satisfy every condition.\n- **Any condition (OR)** — a note can satisfy any one condition.\n- No conditions — include all notes in scope that qualify for the chosen operation and search.\n\n**Equals** requires the same value and type: text **1** and number **1** are different. For whole lists, order matters. **Contains** ignores capitalization in text, or matches an exact typed list item. Numeric comparisons require a number.\n\n**Exists**, **Is missing**, and **Is empty** do not need a value. Empty means blank text, an empty list, or no value. Zero and an unchecked checkbox are not empty. A missing property is different from an empty property.\n\nSearch narrows the matching notes further. It checks note titles and the current value of the property you choose to edit in step 1, not all properties or full note content. Scope, search, and operation requirements always apply, including when Any condition is selected.\n\nFor example, to add a status only to peer-perspective notes:\n\n1. In step 1, choose **Create property**, enter **status**, and enter the desired value.\n2. In step 2, add a condition: **subcategory**, **Equals (same type)**, and **peer-perspective**.\n3. In step 3, review the matching notes, select them, and preview.\n\nCreate already protects notes that have a status. To make that requirement visible as a condition too, add **status → Is missing** and choose **All conditions**.\n\nChanging conditions clears selections that no longer qualify. Newly matching notes are not selected automatically. An unfinished or invalid condition matches no notes, including in Any mode.\n\n## 3. Review and apply\n\nRead the plain-language description of the proposed batch. Check individual notes or choose **Select all filtered**. **Clear selection** unchecks them. Counts show matching notes, selected notes, proposed changes, skips, and conflicts.\n\nClick **Select**, **Note**, or **Current value** to sort. Sorting does not change your selection. The action toolbar stays available while scrolling through the review section.\n\nChoose **Preview changes**. If unavailable, check your selection, property name, and any invalid inputs. Preview shows proposed changes and conflicts and retains the filter summary. Use **Back** to adjust your choices; filter cards, values, and eligible selections are retained.\n\nApply requires a separate confirmation. Preview and Apply recheck the property conditions. A note that no longer qualifies is not changed. Undo reverses the saved change without requiring the note to still match those conditions.\n\n## If notes change while you work\n\nSave unsaved notes, then choose **Refresh** to reload current values. Inputs and matching selections are kept. Changed notes may remain conflicts until refreshed. Removed selections are explained beside the counts.\n\n## Search terms and operators\n\nSearch is case-insensitive and matches parts of words. Use:\n\n- `study; research` or `study OR research` for either term.\n- `study AND notes` or `study notes` for both terms, in any order.\n- `study -archived` or `study NOT archived` to exclude archived matches.\n- `\"study notes\"` for that exact phrase, with the words together.\n\nNOT/minus applies first, then AND, then OR/semicolon. For example, `study OR research AND notes` matches study, or matches both research and notes. To exclude archived results from both alternatives, use `study NOT archived OR research NOT archived`. Operators also accept lowercase. Quote literal operator words or semicolons, such as `\"AND\"` or `\"a;b\"`.\n\nAn unfinished or invalid query shows an error and matches nothing. In Batch actions, selections that no longer match are cleared. These operators apply to search bars; property/value suggestion dropdowns and the typed **Match value** filter continue to use literal values. Search still uses each screen's existing fields; it does not search all note content.\n","preview":"# Preview changes\n\nReview the selected notes before saving. The blue heading shows the planned operation. If you added property conditions, their summary appears below it.\n\n- **Before** — the current value.\n- **After** — the proposed value.\n- **Changed** — a change is proposed.\n- **Skipped** — the note will stay as it is; read the reason.\n- **Conflict** — the note cannot be changed safely as configured.\n\nMissing, empty, and removed properties are different. Removing a property does not delete the note. For lists, **+** marks added items and crossed-out items are removed.\n\nSearch, sort, or open note links to review results. Use **Back** to adjust the batch editor. If notes have changed, go Back and **Refresh** before previewing again.\n\n## Apply\n\nChoose **Apply changes…**, check the operation and note count, then confirm **Apply**. Nothing is saved before confirmation.\n\nNotes and property conditions are rechecked before saving. Original content is backed up, then the saved result is verified. Skipped and conflicting notes are left alone. Review the results for failures or notes needing attention.\n\nOnly affected property entries are edited; surrounding properties and note text are preserved. The changed entry's formatting may be adjusted. Complex layouts that cannot be edited safely become conflicts.\n\nAfter applying a batch, use **Batch history / Undo** to review and undo saved changes.\n\n## Search terms and operators\n\nSearch is case-insensitive and matches parts of words. Use:\n\n- `study; research` or `study OR research` for either term.\n- `study AND notes` or `study notes` for both terms, in any order.\n- `study -archived` or `study NOT archived` to exclude archived matches.\n- `\"study notes\"` for that exact phrase, with the words together.\n\nNOT/minus applies first, then AND, then OR/semicolon. For example, `study OR research AND notes` matches study, or matches both research and notes. To exclude archived results from both alternatives, use `study NOT archived OR research NOT archived`. Operators also accept lowercase. Quote literal operator words or semicolons, such as `\"AND\"` or `\"a;b\"`.\n\nAn unfinished or invalid query shows an error and matches nothing. In Batch actions, selections that no longer match are cleared. These operators apply to search bars; property/value suggestion dropdowns and the typed **Match value** filter continue to use literal values. Search still uses each screen's existing fields; it does not search all note content.\n","inconsistencies":"# Find inconsistencies\n\nLook for properties that may need tidying. This screen reports suggestions only; it does not change notes.\n\nChoose a category in **Show**:\n\n- **Mixed value types** — for example, status is text in one note and a list in another.\n- **Similar property names** — for example, Status and status, or due-date and due_date.\n- **Value spelling / formatting variants** — for example, In Progress and in-progress.\n- **Possible typo in property name** — for example, status and stauts.\n- **Possible typo in value** — for example, archived and achived.\n\nTypo checks compare nearby spellings, including text items in lists. They run locally without AI. Similar spelling does not prove an error or tell you which spelling is correct. Some short words, IDs, dates, links, and long text are excluded to reduce noise. A warning appears if a scan reaches its limit.\n\nSearch the findings or click headings to sort. Counts show how many notes use a spelling. Empty values do not count as mixed types.\n\nIf you decide a correction is needed, open **Batch actions** separately, choose the property and operation, select notes, and review the preview.\n\nUse **Back** for the main menu. If indexing is incomplete, reopen this screen after Obsidian finishes.\n\n## Search terms and operators\n\nSearch is case-insensitive and matches parts of words. Use:\n\n- `study; research` or `study OR research` for either term.\n- `study AND notes` or `study notes` for both terms, in any order.\n- `study -archived` or `study NOT archived` to exclude archived matches.\n- `\"study notes\"` for that exact phrase, with the words together.\n\nNOT/minus applies first, then AND, then OR/semicolon. For example, `study OR research AND notes` matches study, or matches both research and notes. To exclude archived results from both alternatives, use `study NOT archived OR research NOT archived`. Operators also accept lowercase. Quote literal operator words or semicolons, such as `\"AND\"` or `\"a;b\"`.\n\nAn unfinished or invalid query shows an error and matches nothing. In Batch actions, selections that no longer match are cleared. These operators apply to search bars; property/value suggestion dropdowns and the typed **Match value** filter continue to use literal values. Search still uses each screen's existing fields; it does not search all note content.\n","history":"# Batch history / Undo\n\nReview saved batches and undo eligible changes. Previews do not create history entries.\n\nTimes use your local timezone: **MM-DD-YYYY HH:MM**, with a 24-hour clock.\n\n## Undo a batch\n\n1. Open the batch.\n2. Review its Undo preview and any conflicts.\n3. Choose **Undo ready notes**, then confirm.\n4. Check the results.\n\nOnly changes that were saved and verified can be undone. Failed, uncertain, conflicting, or already undone records are left alone.\n\nLater edits to the affected property can prevent Undo. Other property edits and note text are preserved. Save unsaved notes before retrying. Missing or moved notes may require manual review.\n\n**Original backup** lets you inspect or copy the original note for manual recovery. Opening it does not restore anything.\n\n## Keep your history\n\nHistory and backups stay locally in the plugin folder. Backups contain full note content. Keep **data.json**, **history-backup.json**, and **backups/** together to retain Undo after restarting. Do not share them with a plugin release.\n\nIf a run is interrupted, reopening the plugin checks what was saved without changing notes. Damaged or missing history may block editing; do not delete individual backup files to bypass a warning.\n\nSearch or sort to find a batch. Choose **Refresh history** to reload, or **Back** for the main menu.\n\n## Search terms and operators\n\nSearch is case-insensitive and matches parts of words. Use:\n\n- `study; research` or `study OR research` for either term.\n- `study AND notes` or `study notes` for both terms, in any order.\n- `study -archived` or `study NOT archived` to exclude archived matches.\n- `\"study notes\"` for that exact phrase, with the words together.\n\nNOT/minus applies first, then AND, then OR/semicolon. For example, `study OR research AND notes` matches study, or matches both research and notes. To exclude archived results from both alternatives, use `study NOT archived OR research NOT archived`. Operators also accept lowercase. Quote literal operator words or semicolons, such as `\"AND\"` or `\"a;b\"`.\n\nAn unfinished or invalid query shows an error and matches nothing. In Batch actions, selections that no longer match are cleared. These operators apply to search bars; property/value suggestion dropdowns and the typed **Match value** filter continue to use literal values. Search still uses each screen's existing fields; it does not search all note content.\n","undo-preview":"# Undo preview\n\n## For a saved batch\n\n- **Current** shows the affected properties now.\n- **Undo restores** shows their original names and values.\n- **Result** tells you whether a note is ready, skipped, or in conflict.\n\nA property that was originally missing will be removed. An originally empty property stays present.\n\nLater changes to affected properties, unsaved edits, and missing or replaced notes can prevent Undo. Unrelated properties and note text are preserved. Already undone changes are skipped.\n\nChoose **Refresh Undo preview** to reread notes. Choose **Undo ready notes**, review the count, and confirm to restore ready notes. Check the results afterward.\n\n**Original backup** opens the original note for inspection or copying. It does not restore it.\n\nSearch or sort to review notes. Use **Back** to return to the previous screen.\n\n## Search terms and operators\n\nSearch is case-insensitive and matches parts of words. Use:\n\n- `study; research` or `study OR research` for either term.\n- `study AND notes` or `study notes` for both terms, in any order.\n- `study -archived` or `study NOT archived` to exclude archived matches.\n- `\"study notes\"` for that exact phrase, with the words together.\n\nNOT/minus applies first, then AND, then OR/semicolon. For example, `study OR research AND notes` matches study, or matches both research and notes. To exclude archived results from both alternatives, use `study NOT archived OR research NOT archived`. Operators also accept lowercase. Quote literal operator words or semicolons, such as `\"AND\"` or `\"a;b\"`.\n\nAn unfinished or invalid query shows an error and matches nothing. In Batch actions, selections that no longer match are cleared. These operators apply to search bars; property/value suggestion dropdowns and the typed **Match value** filter continue to use literal values. Search still uses each screen's existing fields; it does not search all note content.\n"},"yamlLicense":"Copyright Eemeli Aro <eemeli@gmail.com>\n\nPermission to use, copy, modify, and/or distribute this software for any purpose\nwith or without fee is hereby granted, provided that the above copyright notice\nand this permission notice appear in all copies.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH\nREGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND\nFITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,\nINDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS\nOF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER\nTORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF\nTHIS SOFTWARE.\n","pluginLicense":"MIT License\n\nCopyright (c) 2026 Kempf\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the \"Software\"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n"};
// END BUNDLED PROPERTY HAG RESOURCES
let helpDirectory;
function historyTime(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown time";
  const two = number => String(number).padStart(2, "0");
  return `${two(date.getMonth() + 1)}-${two(date.getDate())}-${date.getFullYear()} ${two(date.getHours())}:${two(date.getMinutes())}`;
}
let initializeWrites;
let smokeCore;
const writeServices = new WeakMap();
const writeServiceKey = Symbol.for("property-hag.write-service");
const uiSessions = new WeakMap();
const mobileViewportCleanups = new WeakMap();
function modalUiState(app, key) {
  if (!uiSessions.has(app)) uiSessions.set(app, new Map());
  const screens = uiSessions.get(app);
  if (!screens.has(key)) screens.set(key, {});
  return screens.get(key);
}
function tableUiState(header) {
  return header.closest(".modal-content")?._hagUiState || {};
}
function debounceSearch(contentEl, callback) {
  const timers = contentEl.ownerDocument?.defaultView || globalThis;
  let timer;
  const cancel = () => { if (timer !== undefined) { timers.clearTimeout(timer); timer = undefined; } };
  const update = {
    schedule() { cancel(); timer = timers.setTimeout(() => { timer = undefined; callback(); }, 150); },
    cancel,
    flush() { if (timer !== undefined) { cancel(); callback(); } },
    get pending() { return timer !== undefined; },
  };
  (contentEl._hagDebouncers ||= []).push(update);
  return update;
}
function isInFolder(filePath, folderPath, includeSubfolders = true) {
  const folder = folderPath === "/" ? "" : folderPath;
  if (includeSubfolders) return !folder || filePath.startsWith(`${folder}/`);
  const slash = filePath.lastIndexOf("/");
  return (slash < 0 ? "" : filePath.slice(0, slash)) === folder;
}
const helpTopics = {
  "Property Hag": "starter",
  "List properties": "properties",
  "Batch actions": "batch-actions",
  "Preview changes": "preview",
  "Find inconsistencies": "inconsistencies",
  "Batch history / Undo": "history",
  "Undo preview": "undo-preview",
};

function collectProperties(app) {
  const counts = new Map();
  const emptyCounts = new Map();
  const types = new Map();
  let uncachedNotes = 0;
  const files = app.vault.getMarkdownFiles();

  for (const file of files) {
    const cache = app.metadataCache.getFileCache(file);
    if (!cache) {
      uncachedNotes++;
      continue;
    }
    if (!cache.frontmatter) continue;

    for (const name of Object.keys(cache.frontmatter)) {
      counts.set(name, (counts.get(name) || 0) + 1);
      if (!types.has(name)) types.set(name, new Set());
      const value = cache.frontmatter[name];
      if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) {
        emptyCounts.set(name, (emptyCounts.get(name) || 0) + 1);
      }
      types.get(name).add(value == null ? "Empty" : Array.isArray(value) ? "List" :
        ({string: "Text", number: "Number", boolean: "Checkbox"})[typeof value] || "Other");
    }
  }

  return {
    properties: [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)),
    noteCount: files.length,
    emptyCounts,
    uncachedNotes,
    types: new Map([...types].map(([name, kinds]) => {
      if (kinds.size > 1) kinds.delete("Empty");
      const labels = [...kinds].sort();
      return [name, labels.length > 1 ? `Mixed: ${labels.join(", ")}` : labels[0]];
    })),
  };
}

function propertyValueText(value) {
  if (value == null || value === "") return "(empty)";
  if (Array.isArray(value)) return value.length ? value.map(propertyValueText).join(", ") : "(empty)";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function makeSortable(header, body, rows, labels) {
  const state = tableUiState(header);
  let column = state.sort?.column < labels.length ? state.sort.column : 0;
  let direction = state.sort?.direction === -1 ? -1 : 1;
  const headings = labels.map((label, index) => {
    const heading = header.createEl("th", {
      cls: "property-hag-sortable",
      attr: { scope: "col", tabindex: "0", title: `Sort by ${label}` },
    });
    heading.createEl("span", { text: label, cls: "property-hag-heading-label" });
    const sort = () => {
      direction = column === index ? -direction : 1;
      column = index;
      render();
    };
    heading.addEventListener("click", sort);
    heading.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        sort();
      }
    });
    return heading;
  });
  function render() {
    state.sort = { column, direction };
    headings.forEach((heading, index) => {
      heading.setAttribute("aria-sort", index === column ? (direction === 1 ? "ascending" : "descending") : "none");
      heading.querySelector(".property-hag-heading-label").textContent = labels[index] + (index === column ? (direction === 1 ? " ↑" : " ↓") : "");
    });
    const compare = (a, b) => typeof a === "number" && typeof b === "number"
      ? a - b : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
    rows.sort((a, b) => direction * compare(a.keys[column], b.keys[column]) || compare(a.keys[0], b.keys[0]));
    for (const { element } of rows) {
      if (header.closest(".modal-content")?._hagMobile) Array.from(element.children).forEach((cell, index) => cell.setAttribute("data-hag-label", labels[index] || ""));
      body.appendChild(element);
    }
  }
  render();
  makeColumnsResizable(header);
  return render;
}

function makeColumnsResizable(header) {
  if (header.closest(".modal-content")?._hagMobile) return;
  const state = tableUiState(header);
  const table = header.closest("table");
  table.addClass("property-hag-resizable-table");
  const headings = Array.from(header.children);
  const cols = table.ownerDocument.createElement("colgroup");
  headings.forEach(() => cols.appendChild(table.ownerDocument.createElement("col")));
  table.insertBefore(cols, table.firstChild);
  const setWidths = widths => {
    Array.from(cols.children).forEach((col, i) => { col.style.width = widths[i] + "px"; });
    table.style.width = widths.reduce((a, b) => a + b, 0) + "px";
    table.style.tableLayout = "fixed";
    headings.forEach(th => { th.style.width = "auto"; });
  };
  const previewTable = table.classList.contains?.("property-hag-preview-table") || table.matches(".property-hag-preview-table");
  const minimumWidths = previewTable ? [220, 160, 160, 200] : headings.map(() => 48);
  if (state.columnWidths?.length === headings.length) {
    setWidths(state.columnWidths.map((width, index) => Math.max(minimumWidths[index], width)));
  } else if (previewTable) {
    setWidths([300, 220, 220, 240]);
  }
  headings.slice(0, -1).forEach(heading => heading.createEl("span", {
    cls: "property-hag-column-resize",
    attr: { title: "Drag to resize columns", "aria-hidden": "true" },
  }));
  let drag;
  let suppressClick = false;
  let hovered;
  const boundary = event => {
    const cell = event.target.closest("td, th");
    if (!cell || cell.closest("table") !== table || cell.cellIndex >= headings.length - 1) return null;
    const edge = cell.getBoundingClientRect().right;
    return Math.abs(event.clientX - edge) <= 7 ? cell : null;
  };
  const hover = cell => {
    if (hovered === cell) return;
    hovered?.classList.remove("property-hag-divider-hover");
    hovered = cell;
    hovered?.classList.add("property-hag-divider-hover");
    table.style.cursor = cell ? "col-resize" : "";
  };
  table.addEventListener("pointerdown", event => {
    const cell = boundary(event);
    if (event.button !== 0 || !cell) return;
    event.preventDefault(); event.stopPropagation();
    suppressClick = true;
    const widths = headings.map(th => th.getBoundingClientRect().width);
    setWidths(widths);
    state.columnWidths = widths;
    drag = { x: event.clientX, index: cell.cellIndex, left: widths[cell.cellIndex], right: widths[cell.cellIndex + 1] };
    table.setPointerCapture(event.pointerId);
  }, true);
  table.addEventListener("pointermove", event => {
    if (!drag) { hover(boundary(event)); return; }
    const delta = Math.max(minimumWidths[drag.index] - drag.left,
      Math.min(drag.right - minimumWidths[drag.index + 1], event.clientX - drag.x));
    cols.children[drag.index].style.width = drag.left + delta + "px";
    cols.children[drag.index + 1].style.width = drag.right - delta + "px";
    state.columnWidths = Array.from(cols.children).map(col => parseFloat(col.style.width));
  });
  table.addEventListener("click", event => {
    if (suppressClick || boundary(event)) {
      event.preventDefault(); event.stopPropagation(); suppressClick = false;
    }
  }, true);
  const finish = () => { drag = null; hover(null); };
  table.addEventListener("pointerup", finish);
  for (const event of ["pointercancel", "lostpointercapture"]) table.addEventListener(event, () => { finish(); suppressClick = false; });
  table.addEventListener("pointerleave", () => { if (!drag) hover(null); });
}

class HagModal extends Modal {
  isMobileLayout() { return Boolean(Platform?.isMobile || this.app.isMobile); }

  lockOpeningSize() {
    if (this.isMobileLayout()) return;
    const rect = this.modalEl.getBoundingClientRect();
    this.modalEl.style.width = `${rect.width}px`;
    this.modalEl.style.height = `${rect.height}px`;
  }

  setupMobileViewport() {
    const view = this.modalEl.ownerDocument.defaultView;
    const viewport = view.visualViewport;
    const update = () => {
      const width = viewport?.width ?? view.innerWidth;
      const height = viewport?.height ?? view.innerHeight;
      this.modalEl.style.setProperty("--property-hag-mobile-width", `${width}px`);
      this.modalEl.style.setProperty("--property-hag-mobile-height", `${height}px`);
      this.modalEl.style.setProperty("--property-hag-mobile-left", `${viewport?.offsetLeft || 0}px`);
      this.modalEl.style.setProperty("--property-hag-mobile-top", `${viewport?.offsetTop || 0}px`);
    };
    update();
    view.addEventListener("resize", update);
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    if (!mobileViewportCleanups.has(this.app)) mobileViewportCleanups.set(this.app, new Set());
    const cleanups = mobileViewportCleanups.get(this.app);
    this.cleanupMobileViewport = () => {
      view.removeEventListener("resize", update);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      cleanups.delete(this.cleanupMobileViewport);
    };
    cleanups.add(this.cleanupMobileViewport);
  }
  open() {
    super.open();
    const state = this.uiState;
    if (!state) return;
    const view = this.modalEl.ownerDocument.defaultView;
    if (!this.isMobileLayout()) {
    if (state.bounds && this.restoreGeometry !== false) {
      const b = state.bounds;
      const width = Math.min(Math.max(320, b.width), Math.max(0, view.innerWidth - 32));
      const height = Math.min(Math.max(200, b.height), Math.max(0, view.innerHeight - 32));
      const left = Math.max(0, Math.min(b.left, view.innerWidth - width));
      const top = Math.max(0, Math.min(b.top, view.innerHeight - height));
      Object.assign(this.modalEl.style, { position: "fixed", margin: "0", transform: "none", width: `${width}px`, height: `${height}px`, left: `${left}px`, top: `${top}px` });
    }
    // Every screen keeps its opening size as rows, warnings or help content change.
    this.lockOpeningSize();
    }
    // Wait for layout before restoring scroll positions.
    this.restoreFrame = view.requestAnimationFrame(() => {
      this.contentEl.scrollTop = state.scrollTop || 0;
      const table = this.contentEl.querySelector(".property-hag-table-container");
      if (table) { table.scrollTop = state.tableScrollTop || 0; table.scrollLeft = state.tableScrollLeft || 0; }
    });
  }

  setupHeader(title, back, helpTopic = helpTopics[title] || "property-details", stateKey) {
    const key = this instanceof HelpModal ? `help:${this.topic}` : this.propertyName !== undefined
      ? `property:${this.propertyName}` : `${stateKey || helpTopic || title}:${this.state?.folderPath ?? "vault"}`;
    const mobile = this.isMobileLayout();
    this.uiState = modalUiState(this.app, mobile ? `mobile:${key}` : key);
    this.contentEl._hagMobile = mobile;
    this.contentEl._hagUiState = this.uiState;
    const blockOutsideDismiss = (event) => {
      if (!this.modalEl.contains(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    const outsideEvents = ["pointerdown", "mousedown", "touchstart", "click"];
    for (const event of outsideEvents) {
      this.containerEl.addEventListener(event, blockOutsideDismiss, { capture: true, passive: false });
    }
    this.cleanupOutsideDismiss = () => {
      for (const event of outsideEvents) this.containerEl.removeEventListener(event, blockOutsideDismiss, true);
    };
    this.titleEl.textContent = title;
    if (!mobile) this.titleEl.addClass("property-hag-drag-handle");
    if (mobile) this.modalEl.addClass("property-hag-mobile");
    this.modalEl.addClass("property-hag-window");
    if (back && this.useWideLayout !== false) this.modalEl.addClass("property-hag-window-wide");
    if (!mobile) {
    const resize = this.modalEl.createEl("div", {
      cls: "property-hag-modal-resize",
      attr: { title: "Drag to resize modal", "aria-hidden": "true" },
    });
    let sizing;
    resize.addEventListener("pointerdown", event => {
      if (event.button !== 0) return;
      event.preventDefault(); event.stopPropagation();
      const rect = this.modalEl.getBoundingClientRect();
      sizing = { x: event.clientX, y: event.clientY, width: rect.width, height: rect.height, left: rect.left, top: rect.top };
      Object.assign(this.modalEl.style, { position: "fixed", margin: "0", transform: "none", left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
      resize.setPointerCapture(event.pointerId);
    });
    resize.addEventListener("pointermove", event => {
      if (!sizing) return;
      const view = this.modalEl.ownerDocument.defaultView;
      const maxWidth = Math.max(0, view.innerWidth - sizing.left - 8);
      const maxHeight = Math.max(0, view.innerHeight - sizing.top - 8);
      this.modalEl.style.width = `${Math.min(maxWidth, Math.max(320, sizing.width + event.clientX - sizing.x))}px`;
      this.modalEl.style.height = `${Math.min(maxHeight, Math.max(200, sizing.height + event.clientY - sizing.y))}px`;
      this.uiState.bounds = { left: sizing.left, top: sizing.top, width: parseFloat(this.modalEl.style.width), height: parseFloat(this.modalEl.style.height) };
    });
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) resize.addEventListener(event, () => { sizing = null; });
    this.cleanupResize = () => { sizing = null; resize.remove(); };
    }
    const navigation = this.contentEl.createDiv({ cls: "property-hag-navigation" });
    if (back) {
      const button = navigation.createEl("a", {
        text: "← Back", cls: "property-hag-back", attr: { href: "#", "aria-label": "Back to previous modal" },
      });
      button.addEventListener("click", (event) => { event.preventDefault(); this.close(); back(); });
    }
    if (helpTopic) {
      const help = navigation.createEl("button", {
        cls: "clickable-icon property-hag-help-button",
        attr: { type: "button", title: `Help: ${title}`, "aria-label": `Help for ${title}` },
      });
      setIcon(help, "circle-help");
      help.addEventListener("click", () => new HelpModal(this.app, title, helpTopic).open());
    }
    // Keep other sticky controls below navigation, including with larger theme
    // fonts, mobile controls, or a resized window. CSS supplies the fallback.
    const NavigationObserver = this.modalEl.ownerDocument.defaultView.ResizeObserver;
    if (typeof NavigationObserver === "function") {
      const observer = new NavigationObserver(() => {
        const height = navigation.getBoundingClientRect().height;
        if (height > 0) this.contentEl.style.setProperty("--property-hag-navigation-height", `${height}px`);
      });
      observer.observe(navigation);
      this.cleanupNavigation = () => observer.disconnect();
    }
    if (mobile) { this.setupMobileViewport(); return; }
    let drag;
    const finish = () => { drag = null; };
    const down = (event) => {
      if (event.button !== 0 || event.target.closest("button, a, input")) return;
      const rect = this.modalEl.getBoundingClientRect();
      drag = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
      this.titleEl.setPointerCapture(event.pointerId);
      event.preventDefault();
    };
    const move = (event) => {
      if (!drag) return;
      const view = this.modalEl.ownerDocument.defaultView;
      const rect = this.modalEl.getBoundingClientRect();
      const left = Math.max(0, Math.min(view.innerWidth - rect.width, drag.left + event.clientX - drag.x));
      const top = Math.max(0, Math.min(view.innerHeight - Math.min(rect.height, 48), drag.top + event.clientY - drag.y));
      Object.assign(this.modalEl.style, { position: "fixed", margin: "0", transform: "none", left: `${left}px`, top: `${top}px` });
      this.uiState.bounds = { left, top, width: rect.width, height: rect.height };
    };
    const handlers = { pointerdown: down, pointermove: move, pointerup: finish, pointercancel: finish, lostpointercapture: finish };
    for (const [event, handler] of Object.entries(handlers)) this.titleEl.addEventListener(event, handler);
    this.cleanupDrag = () => {
      finish();
      for (const [event, handler] of Object.entries(handlers)) this.titleEl.removeEventListener(event, handler);
    };
  }

  onClose() {
    this.cleanupNavigation?.();
    this.cleanupLive?.();
    for (const update of this.contentEl._hagDebouncers || []) update.cancel();
    this.contentEl._hagDebouncers = [];
    if (this.restoreFrame !== undefined) this.modalEl.ownerDocument.defaultView.cancelAnimationFrame(this.restoreFrame);
    if (this.uiState) {
      this.uiState.scrollTop = this.contentEl.scrollTop;
      const table = this.contentEl.querySelector(".property-hag-table-container");
      if (table) { this.uiState.tableScrollTop = table.scrollTop; this.uiState.tableScrollLeft = table.scrollLeft; }
    }
    this.cleanupMobileViewport?.();
    this.cleanupOutsideDismiss?.();
    this.cleanupDrag?.();
    this.cleanupResize?.();
    this.contentEl.empty();
  }
}

class HelpModal extends HagModal {
  constructor(app, title, topic) {
    super(app);
    this.helpTitle = title;
    this.topic = topic;
  }

  async onOpen() {
    this.setupHeader(`Help: ${this.helpTitle}`, () => {}, false);
    const view = this.modalEl.ownerDocument.defaultView;
    this.modalEl.style.height = `${Math.min(640, Math.max(0, view.innerHeight - 48))}px`;
    this.renderer = new Component();
    this.renderer.load();
    this.closed = false;
    const body = this.contentEl.createDiv({ cls: "property-hag-help-content" });
    body.createEl("p", { text: "Loading help…" });
    try {
      let markdown;
      try { markdown = await this.app.vault.adapter.read(`${helpDirectory}/help/${this.topic}.md`); }
      catch (error) {
        markdown = bundledHagResources.help[this.topic];
        if (typeof markdown !== "string") throw error;
      }
      if (this.closed) return;
      body.empty();
      await MarkdownRenderer.render(this.app, markdown, body, "", this.renderer);
    } catch (error) {
      if (this.closed) return;
      body.empty();
      body.createEl("p", { text: "Could not load this help file. Check that the plugin's help folder is present.", cls: "property-hag-error" });
    }
  }

  onClose() {
    this.closed = true;
    this.renderer?.unload();
    super.onClose();
  }
}

// Shared search grammar: NOT/- binds first, then AND/whitespace, then OR/semicolon.
function compileSearch(query) {
  try {
    if (query.length > 4096) throw new Error("Search is too long (maximum 4096 characters).");
    const tokens = [];
    let i = 0;
    while (i < query.length) {
      if (/\s/.test(query[i])) { i++; continue; }
      if (tokens.length >= 256) throw new Error("Search has too many terms.");
      const c = query[i++];
      if (c === ";") { tokens.push({op: "OR"}); continue; }
      if (c === "-") { tokens.push({op: "NOT"}); continue; }
      let value = "";
      if (c === '"') {
        let closed = false;
        while (i < query.length) {
          const ch = query[i++];
          if (ch === '"') { closed = true; break; }
          if (ch === "\\" && (query[i] === '"' || query[i] === "\\")) value += query[i++];
          else value += ch;
        }
        if (!closed) throw new Error("Close the quoted phrase with a double quote.");
        if (!value.length) throw new Error("Enter text inside the quotes.");
        tokens.push({value});
      } else {
        value = c;
        while (i < query.length && !/\s/.test(query[i]) && query[i] !== ";") value += query[i++];
        const upper = value.toUpperCase();
        tokens.push(["AND", "OR", "NOT"].includes(upper) ? {op: upper} : {value});
      }
    }
    if (!tokens.length) return {matches: () => true, error: ""};
    const groups = [[]];
    let expecting = true, negative = false;
    for (const token of tokens) {
      if (token.op === "OR" || token.op === "AND") {
        if (expecting) throw new Error("Enter a search term before " + token.op + ".");
        if (token.op === "OR") groups.push([]);
        expecting = true;
      } else if (token.op === "NOT") {
        expecting = true; negative = !negative;
      } else {
        groups[groups.length - 1].push({value: token.value.toLocaleLowerCase(), negative});
        negative = false; expecting = false;
      }
    }
    if (expecting) throw new Error("Enter a search term after the operator.");
    return {error: "", matches(value) {
      const text = String(value).toLocaleLowerCase();
      return groups.some(group => group.every(term => text.includes(term.value) !== term.negative));
    }};
  } catch (error) {
    // An unfinished/invalid query must never widen a destructive batch selection.
    return {matches: () => false, error: error.message};
  }
}

function createTableSearch(contentEl, placeholder, showCount = true) {
  const state = contentEl._hagUiState || {};
  const input = contentEl.createEl("input", {
    cls: "property-hag-search",
    attr: { type: "search", placeholder, "aria-label": placeholder, title: 'Search: ; / OR = either, AND / spaces = both, - / NOT = exclude, "phrase" = exact phrase.' },
  });
  input.value = state.search || "";
  const summary = contentEl.createEl("p", {
    cls: "property-hag-summary",
    attr: { role: "status", "aria-live": "polite" },
  });
  summary.hidden = !showCount;
  return (container, rows, getText, label, matchesCategory = () => true) => {
    let searchUpdate;
    const filter = () => {
      searchUpdate?.cancel();
      const query = compileSearch(input.value);
      let matches = 0;
      for (const row of rows) {
        row.element.hidden = !matchesCategory(row) || !query.matches(getText(row));
        if (!row.element.hidden) matches++;
      }
      summary.textContent = query.error ? `Search: ${query.error}` : matches ? (showCount ? `${matches} of ${rows.length} ${label}` : "") : `No matching ${label}.`;
      summary.hidden = !query.error && matches > 0 && !showCount;
      container.hidden = matches === 0;
    };
    searchUpdate = debounceSearch(contentEl, filter);
    input._hagDebounce = searchUpdate;
    input.addEventListener("input", () => {
      if (input.value === "KEMPFTEST" && contentEl._hagSmokeTrigger) {
        input.value = ""; state.search = ""; searchUpdate.cancel(); contentEl._hagSmokeTrigger(); return;
      }
      state.search = input.value; searchUpdate.schedule();
    });
    filter();
    if (!contentEl._hagMobile) input.focus();
    return filter;
  };
}

class PropertyDetailsModal extends HagModal {
  constructor(app, propertyName) {
    super(app);
    this.propertyName = propertyName;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("property-hag-modal");
    this.setupHeader(this.propertyName, () => new PropertyHagModal(this.app).open(), "property-details");
    const actions = contentEl.createDiv({ cls: "property-hag-actions" });
    const batch = actions.createEl("button", { text: "Batch actions for this property", attr: { type: "button" } });
    batch.addEventListener("click", (event) => {
      event.preventDefault(); this.close(); new workflows.BatchModal(this.app, { property: this.propertyName }, () => new PropertyDetailsModal(this.app, this.propertyName).open()).open();
    });
    const bindSearch = createTableSearch(contentEl, "Search notes or values…", false);

    const notes = [];
    for (const file of this.app.vault.getMarkdownFiles()) {
      const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
      if (frontmatter && Object.prototype.hasOwnProperty.call(frontmatter, this.propertyName)) {
        notes.push({ file, value: frontmatter[this.propertyName] });
      }
    }
    notes.sort((a, b) => a.file.basename.localeCompare(b.file.basename) || a.file.path.localeCompare(b.file.path));

    if (!notes.length) {
      bindSearch(contentEl.createDiv(), [], () => "", "notes");
      contentEl.createEl("p", { text: "No notes currently use this property." });
      return;
    }

    const container = contentEl.createDiv({ cls: "property-hag-table-container" });
    const table = container.createEl("table", { cls: "property-hag-table property-hag-details-table" });
    const header = table.createEl("thead").createEl("tr");
    const body = table.createEl("tbody");
    const rows = [];
    for (const { file, value } of notes) {
      const row = body.createEl("tr");
      const cell = row.createEl("td", { cls: "property-hag-note-title" });
      const link = cell.createEl("a", {
        text: file.basename,
        cls: "internal-link",
        attr: { href: file.path, "data-href": file.path, title: file.path },
      });
      link.addEventListener("click", (event) => {
        event.preventDefault();
        this.app.workspace.openLinkText(file.path, "", event.ctrlKey || event.metaKey);
      });
      row.createEl("td", { text: propertyValueText(value), cls: "property-hag-property-text" });
      rows.push({ element: row, keys: [file.basename, propertyValueText(value)] });
    }
    makeSortable(header, body, rows, ["Note", "Property text"]);
    bindSearch(container, rows, (row) => row.keys.join("\n"), "notes");
  }

  onClose() {
    super.onClose();
  }
}

class PropertyHagModal extends HagModal {
  onOpen() {
    this.restoreGeometry = false;
    const { contentEl } = this;
    contentEl.addClass("property-hag-modal");
    this.setupHeader("List properties", () => new PropertyHagMenuModal(this.app).open());
    contentEl._hagSmokeTrigger = () => {this.close(); propertyHagSmoke.open(this.app);};
    const bindSearch = createTableSearch(contentEl, "Search property names…", false);
    const { properties, noteCount, uncachedNotes, types, emptyCounts } = collectProperties(this.app);

    contentEl.createEl("p", {
      text: `${properties.length} properties across ${noteCount} notes. Each use is one note containing the property, even if its value is empty.`,
      cls: "property-hag-summary",
    });

    if (uncachedNotes > 0) {
      contentEl.createEl("p", {
        text: `${uncachedNotes} notes are still being indexed. Reopen this modal after indexing finishes to see complete counts.`,
        cls: "property-hag-warning",
      });
    }

    if (properties.length === 0) {
      bindSearch(contentEl.createDiv(), [], () => "", "properties");
      contentEl.createEl("p", { text: "No properties found in the vault's YAML frontmatter." });
      return;
    }

    const container = contentEl.createDiv({ cls: "property-hag-table-container" });
    const table = container.createEl("table", { cls: "property-hag-table property-hag-properties-table" });
    const header = table.createEl("thead").createEl("tr");
    const body = table.createEl("tbody");
    const rows = [];

    for (const [name, count] of properties) {
      const row = body.createEl("tr");
      const cell = row.createEl("td");
      const link = cell.createEl("a", {
        text: name,
        cls: "internal-link",
        attr: { href: "#", "aria-label": `Show notes using ${name}` },
      });
      link.addEventListener("click", (event) => {
        event.preventDefault();
        this.close();
        new PropertyDetailsModal(this.app, name).open();
      });
      const type = types.get(name);
      row.createEl("td", { text: type });
      row.createEl("td", { text: String(count) });
      const emptyCount = emptyCounts.get(name) || 0;
      row.createEl("td", { text: String(emptyCount), attr: { title: "Notes with a blank value, null, or an empty list" } });
      rows.push({ element: row, keys: [name, type, count, emptyCount] });
    }
    makeSortable(header, body, rows, ["Property", "Type", "Uses", "Empty"]);
    // A remembered search may hide most/all rows. Lock the full-list opening
    // size first so clearing that search cannot leave a short, cramped window.
    this.lockOpeningSize();
    bindSearch(container, rows, (row) => row.keys[0], "properties");
  }

  onClose() {
    super.onClose();
  }
}

class PropertyHagMenuModal extends HagModal {
  onOpen() {
    this.setupHeader("Property Hag");
    this.modalEl.addClass("property-hag-home");
    const hero = this.contentEl.createDiv({ cls: "property-hag-hero" });
    hero.createEl("img", { cls: "property-hag-logo", attr: {
      src: bundledHagResources.logo,
      alt: "Property Hag holding a purple crystal", draggable: "false",
    } });
    const introduction = hero.createDiv({ cls: "property-hag-introduction" });
    introduction.createEl("span", { text: "A LITTLE ORDER. A LITTLE MAGIC.", cls: "property-hag-eyebrow" });
    introduction.createEl("h1", { text: "Property Hag" });
    const tagline = introduction.createEl("p", { cls: "property-hag-tagline" });
    tagline.createEl("span", { text: "Turn chaos into clarity. ", cls: "property-hag-tagline-lead" });
    tagline.createEl("span", { text: "Uncover clutter and take control of your properties." });
    const options = this.contentEl.createDiv({ cls: "property-hag-home-actions" });
    const destinations = [
      ["List properties", "Explore property names, values, and usage.", "list", () => new PropertyHagModal(this.app)],
      ["Batch actions", "Select notes and preview a property edit.", "sliders-horizontal", () => new workflows.BatchModal(this.app)],
      ["Find inconsistencies", "Spot mixed types and formatting variants.", "scan-search", () => new workflows.AuditModal(this.app)],
      ["Batch history / Undo", "Review past changes and restoration tools.", "history", () => new workflows.HistoryModal(this.app)],
    ];
    for (const [label, description, icon, create] of destinations) {
      const link = options.createEl("a", {
        cls: "property-hag-action",
        attr: { href: "#" },
      });
      setIcon(link.createEl("span", { cls: "property-hag-action-icon" }), icon);
      const copy = link.createDiv({ cls: "property-hag-action-copy" });
      copy.createEl("strong", { text: label });
      copy.createEl("span", { text: description });
      link.createEl("span", { text: "›", cls: "property-hag-action-arrow", attr: { "aria-hidden": "true" } });
      link.addEventListener("click", (event) => {
        event.preventDefault();
        this.close();
        create().open();
      });
    }
    const footer = this.contentEl.createDiv({ cls: "property-hag-home-footer" });
    footer.createEl("span", { cls: "property-hag-preview-dot", attr: { "aria-hidden": "true" } });
    footer.createEl("span", { text: "Review changes first · Verified batches can be undone" });
  }

  onClose() {
    super.onClose();
  }
}

// Read-only workflow scaffolding. No vault mutation or persistence APIs are used.
const createWorkflows = ({ HagModal, propertyValueText: text, makeSortable, createTableSearch, openMenu }) => {
  let autocompleteId = 0;
  const operations = [
    ["create", "Create property"], ["set", "Set property value"], ["rename", "Rename property"],
    ["replace", "Replace value"], ["add", "Add list item"],
    ["replace-item", "Replace list item"],
    ["remove", "Remove list item"], ["delete", "Delete property"],
    ["delete-empty", "Delete empty properties"],
  ];
  const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const empty = (value) => value == null || value === "" || (Array.isArray(value) && value.length === 0);
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const valueTypes = [["text", "Text"], ["number", "Number"], ["boolean", "Checkbox"], ["list", "List"], ["empty", "Empty (null)"]];
  const valueKind = value => value == null ? "empty" : Array.isArray(value) ? "list" :
    ({ string: "text", number: "number", boolean: "boolean" })[typeof value] || "unsupported";
  function typedText(value) {
    const kind = valueKind(value);
    if (kind === "empty") return "Empty · null";
    if (kind === "boolean") return `Checkbox · ${value ? "Checked" : "Unchecked"}`;
    if (kind === "list") return `List · ${fingerprint(value) ?? "Unsupported nested value"}`;
    if (kind === "text") return `Text · ${JSON.stringify(value)}`;
    return `${kind === "number" ? "Number" : "Unsupported value"} · ${fingerprint(value) ?? "Cannot display safely"}`;
  }
  function parseTyped(type, input) {
    if (type === "empty") return null;
    if (type === "text") return String(input ?? "");
    if (type === "boolean") {
      if (input !== true && input !== false && input !== "true" && input !== "false") throw new Error("Choose Checked or Unchecked.");
      return input === true || input === "true";
    }
    if (type === "number") {
      const raw = String(input).trim();
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw) || !Number.isFinite(Number(raw))) throw new Error("Enter a valid number.");
      return Number(raw);
    }
    if (type === "list") {
      if (!Array.isArray(input)) throw new Error("Add list items using the item fields.");
      return input.map(item => {
        if (!["text", "number"].includes(valueKind(item))) throw new Error("List items must be text or numbers; nested lists are not supported.");
        if (typeof item === "number" && !Number.isFinite(item)) throw new Error("Enter a valid number for each numeric list item.");
        return item;
      });
    }
    throw new Error("This value type is not supported yet.");
  }
  function matchesValue(has, current, condition, match) {
    if (condition === "all") return true;
    if (condition === "exists") return has;
    if (condition === "missing") return !has;
    if (!has) return false;
    if (condition === "empty") return empty(current);
    if (condition === "equals") return equal(current, match);
    if (condition === "greater" || condition === "less") return typeof current === "number" && typeof match === "number" &&
      (condition === "greater" ? current > match : current < match);
    if (condition === "contains") {
      if (Array.isArray(current)) return current.some(item => equal(item, match));
      return typeof current === "string" && typeof match === "string" && current.toLocaleLowerCase().includes(match.toLocaleLowerCase());
    }
    return false;
  }
  function additionalFilter(state) {
    if (Array.isArray(state.filters)) return state.filters.length ? {mode: state.filterMode || "all", filters: state.filters.map(row => ({property: row.property, condition: row.condition, value: copyMetadata(row.typed)}))} : null;
    return state.filterEnabled ? {property: state.filterProperty, condition: state.filterCondition, value: copyMetadata(state.filterTyped)} : null;
  }
  function matchesAdditionalFilter(fm, filter) {
    if (!filter) return true;
    if (Array.isArray(filter.filters)) {
      if (!["all", "any"].includes(filter.mode) || !filter.filters.length || filter.filters.some(row => !row || Array.isArray(row.filters))) return false;
      return filter.mode === "any" ? filter.filters.some(row => matchesAdditionalFilter(fm, row)) : filter.filters.every(row => matchesAdditionalFilter(fm, row));
    }
    if (typeof filter.property !== "string" || !filter.property.trim() || /[\r\n\0]/.test(filter.property) ||
        !["exists", "missing", "empty", "equals", "contains", "greater", "less"].includes(filter.condition)) return false;
    return matchesValue(own(fm, filter.property), fm[filter.property], filter.condition, filter.value);
  }
  function additionalFilterText(filter) {
    if (Array.isArray(filter.filters)) return filter.filters.map(row => additionalFilterText(row)).join(filter.mode === "any" ? " OR " : " AND ");
    const labels = {exists: "exists", missing: "is missing", empty: "is empty", equals: "equals", contains: "contains", greater: "is greater than", less: "is less than"};
    return `${filter.property} ${labels[filter.condition]}${["exists", "missing", "empty"].includes(filter.condition) ? "" : " " + typedText(filter.value)}`;
  }
  // Keep saved error details unchanged; explain them in everyday language in UI.
  function friendlyWarning(reason) {
    const messages = {
      "Value type mismatch; automatic conversion is disabled": "The existing value and new value use different types. Choose the same type as the existing value, such as Text or Number.",
      "Item type mismatch; automatic conversion is disabled": "The original list item and its replacement use different types. Choose Text for both or Number for both.",
      "Property is not a list": "This property holds a single value. Choose a list property, or use Set property value to change a single value.",
      "Existing list contains unsupported items": "This list contains items this tool cannot safely edit. Open the note and review its properties.",
      "Existing value contains unsupported items": "This value has a structure this tool cannot safely edit. Open the note and review its properties.",
      "Unsupported existing value; review this note manually": "This property has a structure this tool cannot safely edit. Open the note to make this change.",
      "Unsupported original or proposed value; review manually": "This change includes a value this tool cannot safely edit. Review the note and the value you entered.",
      "Unsafe property name; choose another name or review manually": "Choose a different property name. This name contains reserved words or characters that cannot be used safely.",
      "Destination property already exists": "This note already has a property with the new name. Choose another name to avoid replacing it.",
      "Note is still being indexed": "Obsidian is still reading this note's properties. Wait a moment, then choose Refresh.",
      "Properties changed since the last refresh": "This note's properties changed while you were working. Choose Refresh and review it again.",
      "Note no longer matches the additional property filter": "This note no longer matches your property conditions. Choose Refresh to update the list.",
      "Affected properties differ from Preview": "The property changed after Preview. Go Back, choose Refresh, and review the updated value.",
      "An affected property changed since the batch; review manually": "This property was edited after the batch. Review the note before trying to undo it.",
      "Note changed immediately before writing; Refresh and review again": "This note changed just before saving. Choose Refresh and review the latest version before trying again.",
      "Frontmatter is incomplete or malformed": "The note's properties section has a formatting problem. Open the note and fix its properties before trying again.",
      "Properties must be a YAML mapping": "The note's properties are not in the expected name-and-value format. Open the note and review its properties.",
      "Flow-style property sections need manual review; no changes were made": "This note uses a compact properties format that cannot be edited safely here. Edit its properties directly in the note.",
      "Anchored, aliased or tagged properties need manual review; no changes were made": "This property uses advanced YAML features. Edit it directly in the note to keep its references intact.",
      "Complex YAML layout needs manual review": "This note's property formatting needs a closer look. Edit the property directly in the note.",
      "Cannot serialize these properties without changing other values": "This change could affect other properties, so it was stopped. Edit this property directly in the note.",
      "Note is missing, moved, or is no longer Markdown": "This note could not be found at its saved location. Check whether it was moved, renamed, or deleted.",
      "Note was replaced since this batch; review manually": "A different note now occupies this location. Review it before making changes.",
      "Saved properties failed verification": "The saved properties could not be confirmed. Review the note and its original backup before making more changes.",
      "Saved content did not match the proposed change; retained backup for review": "The saved note differs from the reviewed change. Check the note and its Original backup in batch history before continuing."
    };
    const text = String(reason || "");
    if (messages[text]) return messages[text];
    if (/History could not be saved/.test(text)) return "Batch history could not be saved, so further changes are paused. Check available storage and file access, then reload Property Hag. Review batch history for any changes already completed.";
    if (/Original note backup could not be saved/.test(text)) return "The original note backup could not be saved. Further changes are paused. Check available storage and file access before trying again.";
    if (/Unsupported or damaged.*history|Damaged batch history|saved note backup is damaged|Backup content does not match/.test(text)) return "Saved history or a backup could not be read safely. Editing is paused to protect your notes. Keep the existing files and restore them from a known good backup.";
    return text;
  }
  function copyMetadata(value, seen = new Map()) {
    if (!value || typeof value !== "object") return value;
    if (seen.has(value)) return seen.get(value);
    if (Object.prototype.toString.call(value) === "[object Date]") return new Date(value.getTime());
    const copy = Array.isArray(value) ? [] : {};
    seen.set(value, copy);
    for (const key of Object.keys(value)) Object.defineProperty(copy, key, {value: copyMetadata(value[key], seen), enumerable: true, configurable: true, writable: true});
    return copy;
  }
  const fingerprint = value => { try { return JSON.stringify(value); } catch { return null; } };
  const snapshot = (app) => app.vault.getMarkdownFiles().map(file => {
    const cache = app.metadataCache.getFileCache(file);
    return {
      file: {path: file.path, basename: file.basename || file.path.split('/').pop().replace(/\.md$/i, '')},
      sourceFile: file, frontmatter: copyMetadata(cache?.frontmatter || {}), indexed: !!cache,
      mtime: file.stat?.mtime, size: file.stat?.size,
      fingerprint: fingerprint(cache?.frontmatter || {}),
    };
  });
  function liveContext(app) {
    return {app, files: new Map(app.vault.getMarkdownFiles().map(file => [file.path, file]))};
  }
  function staleReason(note, live) {
    if (!note.sourceFile) return "";
    if (note.sourceFile.path !== note.file.path) return `Note moved or renamed to ${note.sourceFile.path}; Refresh before reviewing`;
    const file = live ? live.files.get(note.file.path) : note.sourceFile;
    if (!file) return "Note was deleted or moved; Refresh the note list";
    if (note.eventReason) return note.eventReason;
    if (live?.app.vault.getAbstractFileByPath && live.app.vault.getAbstractFileByPath(note.file.path) !== note.sourceFile) return "Note was replaced since the last refresh";
    if ((note.mtime !== undefined && note.mtime !== file.stat?.mtime) || (note.size !== undefined && note.size !== file.stat?.size)) return "Note changed since the last refresh";
    if (live) {
      const cache = live.app.metadataCache.getFileCache(file);
      if (!cache && note.indexed) return "Note is awaiting indexing; Refresh when indexing finishes";
      const current = fingerprint(cache?.frontmatter || {});
      if (note.fingerprint === null || current === null) return "Cannot compare this note's properties safely";
      if (note.fingerprint !== current) return "Properties changed since the last refresh";
    }
    return "";
  }
  function watchNoteChanges(modal, callback) {
    const refs = [];
    for (const [emitter, names] of [[modal.app.vault, ["modify", "rename", "delete", "create"]], [modal.app.metadataCache, ["changed", "resolved"]]]) {
      if (!emitter.on || !emitter.offref) continue;
      for (const name of names) refs.push([emitter, emitter.on(name, (...args) => callback(name, ...args))]);
    }
    modal.cleanupLive = () => { for (const [emitter, ref] of refs) emitter.offref(ref); };
  }
  function markSnapshotEvent(notes, event, file) {
    if (!file || !["modify", "rename", "delete"].includes(event)) return;
    for (const note of notes) if (note.sourceFile === file || note.file.path === file.path) {
      note.eventReason = event === "delete" ? "Note was deleted; Refresh the note list" : event === "rename" ? "Note moved or renamed since the last refresh" : "Note was saved since the last refresh";
    }
  }

  function field(parent, label, value = "", choices) {
    const wrapper = parent.createEl("label", { cls: "property-hag-field" });
    wrapper.createEl("span", { text: label });
    const input = wrapper.createEl(choices ? "select" : "input", {
      attr: choices ? {} : { type: "text" },
    });
    if (choices) for (const [key, name] of choices) input.createEl("option", { text: name, attr: { value: key } });
    input.value = value;
    return input;
  }

  // Keep each type's draft independently so switching types never discards input.
  function typedEditor(parent, label, draft, changed) {
    const container = parent.createDiv({ cls: "property-hag-typed-editor" });
    const type = field(container, `${label} type`, draft.type, valueTypes);
    const textInput = field(container, label, draft.text);
    const number = field(container, label, draft.number);
    number.setAttribute("type", "number"); number.setAttribute("step", "any");
    const checkbox = field(container, label, draft.boolean, [["false", "Unchecked"], ["true", "Checked"]]);
    const list = container.createDiv({ cls: "property-hag-list-editor" });
    const listLabel = list.createEl("span", { text: "List items", cls: "property-hag-list-label" });
    const items = list.createDiv();
    list.createEl("small", { text: "Each row is one item. No rows means an empty list.", cls: "property-hag-summary" });
    const add = list.createEl("button", { text: "+ Add item", attr: { type: "button" } });
    const emptyHint = container.createEl("p", { text: label === "Filter value" ? "Matches an empty (null) value. Use Is empty to also match blank text and empty lists." : "Stores an empty (null) value. This keeps the property present.", cls: "property-hag-summary" });
    let allowed = valueTypes.map(([key]) => key);
    const show = () => {
      const selected = type.value;
      textInput.parentElement.hidden = selected !== "text";
      number.parentElement.hidden = selected !== "number";
      checkbox.parentElement.hidden = selected !== "boolean";
      list.hidden = selected !== "list";
      emptyHint.hidden = selected !== "empty";
      for (const option of type.children) {
        option.disabled = !allowed.includes(option.value);
        option.hidden = option.disabled;
      }
    };
    const renderItems = () => {
      items.empty();
      draft.items.forEach((item, index) => {
        const row = items.createDiv({ cls: "property-hag-list-item" });
        const itemType = field(row, `Item ${index + 1} type`, item.type, [["text", "Text"], ["number", "Number"]]);
        const input = field(row, `Item ${index + 1}`, item.value);
        input.setAttribute("type", item.type === "number" ? "number" : "text");
        input.setAttribute("step", "any");
        itemType.addEventListener("change", () => {
          item.type = itemType.value;
          input.setAttribute("type", item.type === "number" ? "number" : "text");
          changed();
        });
        input.addEventListener("input", () => { item.value = input.value; changed(); });
        const remove = row.createEl("button", { text: "×", attr: { type: "button", "aria-label": `Remove item ${index + 1}` } });
        remove.addEventListener("click", () => { draft.items.splice(index, 1); renderItems(); changed(); });
      });
    };
    add.addEventListener("click", () => { draft.items.push({ type: "text", value: "" }); renderItems(); changed(); });
    type.addEventListener("change", () => { draft.type = type.value; show(); changed(); });
    for (const [input, key] of [[textInput, "text"], [number, "number"], [checkbox, "boolean"]]) {
      input.addEventListener(key === "boolean" ? "change" : "input", () => { draft[key] = input.value; changed(); });
    }
    renderItems(); show();
    return {
      container, type,
      describe(operation) {
        const itemOperation = ["add", "remove", "replace-item"].includes(operation);
        const valueLabel = operation === "add" ? "Item to add" : operation === "remove" ? "Item to remove" : operation === "replace-item" ? "Replacement item" : "New value";
        for (const input of [textInput, number, checkbox]) input.parentElement.children[0].textContent = valueLabel;
        type.parentElement.children[0].textContent = itemOperation ? "Item type (optional)" : "New value type";
        listLabel.textContent = operation === "replace" ? "Replacement list items" : "List items";
        container.classList.toggle("property-hag-single-item-editor", itemOperation);
      },
      suggestItems(getItems, label = "Existing list items") {
        for (const [input, kind] of [[textInput, "text"], [number, "number"]]) {
          suggestProperties(input, () => getItems().filter(item => valueKind(item) === kind).map(item => String(item)), label);
        }
      },
      suggestMatches(getValues) {
        for (const [input, kind] of [[textInput, "text"], [number, "number"]]) {
          suggestProperties(input, () => getValues().filter(value => valueKind(value) === kind).map(String), "Existing property values");
        }
        const existingList = field(list, "Search existing lists", "");
        list.insertBefore(existingList.parentElement, items);
        const label = value => `List · ${value.map(item => JSON.stringify(item)).join(", ") || "(empty)"}`;
        const lists = () => getValues().filter(value => Array.isArray(value) && value.every(item => ["text", "number"].includes(valueKind(item))));
        suggestProperties(existingList, () => lists().map(label), "Existing property lists", name => {
          const value = lists().find(value => label(value) === name);
          if (!value) return;
          draft.items = value.map(item => ({type: valueKind(item), value: String(item)}));
          existingList.value = ""; renderItems(); changed();
        });
      },
      read() { return parseTyped(type.value, type.value === "list" ? draft.items.map(item => parseTyped(item.type, item.value)) : draft[type.value]); },
      configure(visible, types = valueTypes.map(([key]) => key)) {
        container.hidden = !visible;
        const restrictionsChanged = allowed.join(",") !== types.join(",");
        allowed = types;
        if (restrictionsChanged && allowed.includes(draft.type)) type.value = draft.type;
        if (visible && !allowed.includes(type.value)) type.value = allowed[0];
        show();
      },
      suggest(kind) { if (valueTypes.some(([key]) => key === kind)) { type.value = kind; draft.type = kind; show(); } },
    };
  }

  function editorDraft(type = "text", value = "") {
    return { type, text: typeof value === "string" ? value : "", number: "", boolean: "false", items: [] };
  }

  function suggestedFilter(operation, property) {
    if (!property) return "all";
    return ({ create: "missing", set: "exists", rename: "exists", replace: "equals", "replace-item": "contains", add: "all", remove: "contains", delete: "exists", "delete-empty": "empty" })[operation] || "all";
  }

  function suggestProperties(input, names, suggestionsLabel = "Existing vault properties", onChoose) {
    const wrapper = input.parentElement;
    wrapper.addClass("property-hag-autocomplete");
    const id = `property-hag-suggestions-${++autocompleteId}`;
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", id);
    input.setAttribute("autocomplete", "off");
    const list = wrapper.createDiv({ cls: "property-hag-suggestions", attr: { id, role: "listbox", "aria-label": suggestionsLabel } });
    let matches = [], active = -1;
    const close = () => {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    };
    const choose = name => {
      if (onChoose) onChoose(name);
      else {
        input.value = name;
        input.dispatchEvent(new input.ownerDocument.defaultView.Event("input", { bubbles: true }));
      }
      close();
    };
    const highlight = () => {
      Array.from(list.children).forEach((option, index) => {
        option.setAttribute("aria-selected", String(index === active));
      });
      if (active >= 0) {
        input.setAttribute("aria-activedescendant", `${id}-${active}`);
        list.children[active].scrollIntoView({ block: "nearest" });
      } else input.removeAttribute("aria-activedescendant");
    };
    const show = () => {
      const query = input.value.trim().toLocaleLowerCase();
      matches = [...new Set(typeof names === "function" ? names() : names)].filter(name => name.toLocaleLowerCase().includes(query));
      active = -1;
      list.empty();
      for (const [index, name] of matches.entries()) {
        const option = list.createDiv({ text: name, cls: "property-hag-suggestion", attr: { id: `${id}-${index}`, role: "option", "aria-selected": "false" } });
        option.addEventListener("pointerdown", event => event.preventDefault());
        option.addEventListener("click", () => choose(name));
      }
      list.hidden = !matches.length;
      input.setAttribute("aria-expanded", String(matches.length > 0));
      input.removeAttribute("aria-activedescendant");
    };
    input.addEventListener("focus", show);
    input.addEventListener("click", show);
    input.addEventListener("input", show);
    input.addEventListener("blur", close);
    input.addEventListener("keydown", event => {
      if (event.key === "Escape" && !list.hidden) { event.preventDefault(); event.stopPropagation(); close(); }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (list.hidden) show();
        if (!matches.length) return;
        active = (active + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length;
        highlight();
      }
      if (event.key === "Enter" && !list.hidden && active >= 0) { event.preventDefault(); choose(matches[active]); }
    });
    close();
  }

  function duplicateNoteNames(files) {
    const seen = new Set(), duplicates = new Set();
    for (const file of files) {if (seen.has(file.basename)) duplicates.add(file.basename); else seen.add(file.basename);}
    return duplicates;
  }
  function noteLink(cell, app, file, showPath = false) {
    const link = cell.createEl("a", { text: file.basename, cls: "internal-link", attr: { href: file.path, "data-href": file.path, title: file.path } });
    link.addEventListener("click", event => { event.preventDefault(); app.workspace.openLinkText(file.path, "", event.ctrlKey || event.metaKey); });
    if (showPath) cell.createEl("small", {text: file.path, cls: "property-hag-file-path"});
  }

  function listMarks(items, other) {
    const remaining = [...other];
    return items.map(item => {
      const index = remaining.findIndex(candidate => equal(candidate, item));
      if (index < 0) return true;
      remaining.splice(index, 1);
      return false;
    });
  }

  function renderListPreview(cell, items, other, side, missing = false) {
    if (missing) { cell.createEl("span", { text: "Property missing", cls: "property-hag-summary" }); return; }
    if (!items.length) { cell.createEl("span", { text: "Empty list", cls: "property-hag-summary" }); return; }
    const changes = listMarks(items, other);
    const chips = cell.createDiv({ cls: "property-hag-list-chips" });
    items.forEach((item, index) => {
      const changed = changes[index];
      const added = side === "after";
      chips.createEl("span", {
        text: `${changed ? (added ? "+ " : "− ") : ""}${JSON.stringify(item)}`,
        cls: `property-hag-list-chip${changed ? (added ? " is-added" : " is-removed") : ""}`,
        attr: { title: changed ? `${added ? "Added" : "Removed"} ${valueKind(item)} item` : `${valueKind(item)} item` },
      });
    });
  }

  function plan(note, state, value, live) {
    const fm = note.frontmatter, has = own(fm, state.property), current = fm[state.property];
    const names = [...new Set([state.property, ...(state.operation === "rename" ? [state.target] : [])])];
    const before = propertyStates(fm, names);
    const result = { note, before, after: copyMetadata(before), operation: state.operation, filter: additionalFilter(state),
      current: has ? typedText(current) : "Property missing", proposed: "Unchanged", status: "Skipped", reason: "No change" };
    const change = (proposed, next) => {
      Object.assign(result, { proposed, status: "Changed", reason: "Proposed only" });
      if (state.operation === "rename") {
        result.after = names.map(name => name === state.property ? {name, present: false} : propertyState(name, true, current));
      } else {
        result.after = [propertyState(state.property, !["delete", "delete-empty"].includes(state.operation), next)];
      }
      if (!validPatch(result)) return Object.assign(result, {status: "Conflict", reason: "Unsupported original or proposed value; review manually"});
      if (Array.isArray(next)) result.listChange = { before: Array.isArray(current) ? [...current] : [], after: [...next], missing: !has };
      return result;
    };
    const conflict = reason => Object.assign(result, { status: "Conflict", reason });
    for (const name of [state.property, ...(state.operation === "rename" ? [state.target] : [])]) {
      if (typeof name !== "string" || !name.trim() || ["__proto__", "constructor", "prototype"].includes(name) || /[\r\n\0]/.test(name)) return conflict("Unsafe property name; choose another name or review manually");
    }
    const stale = staleReason(note, live);
    if (stale) return conflict(stale);
    if (!note.indexed) return conflict("Note is still being indexed");
    if (!matchesAdditionalFilter(fm, result.filter)) return conflict("Note no longer matches the additional property filter");
    switch (state.operation) {
      case "create":
        if (has) return Object.assign(result, { reason: "Property already exists" });
        return change(typedText(value), value);
      case "set":
        if (!has) return Object.assign(result, { reason: "Property missing; use Create property" });
        if (has && valueKind(current) === "unsupported") return conflict("Unsupported existing value; review this note manually");
        if (Array.isArray(current) && current.some(item => !["text", "number"].includes(valueKind(item)))) return conflict("Existing list contains unsupported items");
        if (has && current != null && value != null && valueKind(current) !== valueKind(value)) return conflict("Value type mismatch; automatic conversion is disabled");
        if (has && equal(current, value)) return result;
        return change(typedText(value), value);
      case "rename":
        result.current = `${state.property}: ${has ? typedText(current) : "Property missing"}`;
        if (!has) return Object.assign(result, { reason: "Property missing" });
        if (state.target === state.property) return result;
        if (own(fm, state.target)) return conflict("Destination property already exists");
        return Object.assign(change(`${state.target}: ${typedText(current)}`), { reason: "Rename property; keep its value" });
      case "replace":
        if (!has || !equal(current, own(state, "matchTyped") ? state.matchTyped : state.match)) return Object.assign(result, { reason: "Value does not match exactly" });
        if (valueKind(current) === "unsupported" || (Array.isArray(current) && current.some(item => !["text", "number"].includes(valueKind(item))))) return conflict("Existing value contains unsupported items");
        if (current != null && value != null && valueKind(current) !== valueKind(value)) return conflict("Value type mismatch; automatic conversion is disabled");
        return equal(current, value) ? result : change(typedText(value), value);
      case "replace-item": {
        if (!has) return Object.assign(result, { reason: "Property missing" });
        if (!Array.isArray(current)) return conflict("Property is not a list");
        if (!["text", "number"].includes(valueKind(value))) return conflict("Choose a text or number replacement item");
        if (current.some(item => !["text", "number"].includes(valueKind(item)))) return conflict("Existing list contains unsupported items");
        if (!current.some(item => equal(item, state.matchTyped))) return Object.assign(result, { reason: "No matching list item" });
        if (valueKind(state.matchTyped) !== valueKind(value)) return conflict("Item type mismatch; automatic conversion is disabled");
        const next = current.map(item => equal(item, state.matchTyped) ? value : item);
        return equal(current, next) ? result : change(typedText(next), next);
      }
      case "add":
      case "remove": {
        if (!["text", "number"].includes(valueKind(value))) return conflict("Choose a text or number item; nested lists are not supported");
        if (!has && state.operation === "remove") return result;
        if (has && !Array.isArray(current)) return conflict("Property is not a list");
        const list = current || [];
        if (list.some(item => !["text", "number"].includes(valueKind(item)))) return conflict("Existing list contains unsupported items");
        const next = state.operation === "add" ? (list.some(item => equal(item, value)) ? list : [...list, value]) : list.filter(item => !equal(item, value));
        return equal(list, next) ? result : change(typedText(next), next);
      }
      case "delete": return has ? change("Property removed") : Object.assign(result, { reason: "Property missing" });
      case "delete-empty": return has && empty(current) ? change("Property removed") : Object.assign(result, { reason: has ? "Value is not empty" : "Property missing" });
      default: return result;
    }
  }

  // Serializable property patches, never whole-note replacements. Missing and null
  // remain distinct, and values are copied so later cache edits cannot alter history.
  function propertyState(name, present, value) {
    return present ? {name, present: true, type: valueKind(value), value: copyMetadata(value)} : {name, present: false};
  }
  function propertyStates(fm, names) { return names.map(name => propertyState(name, own(fm, name), fm[name])); }
  function supportedStates(states) {
    return Array.isArray(states) && states.length > 0 && states.every(s => typeof s.name === "string" && s.name.length > 0 &&
      typeof s.present === "boolean" && (!s.present ||
        (own(s, "value") && s.value !== undefined && ["text", "number", "boolean", "empty", "list"].includes(valueKind(s.value)) &&
         (typeof s.value !== "number" || Number.isFinite(s.value)) &&
         (!Array.isArray(s.value) || s.value.every(item => ["text", "number"].includes(valueKind(item)) && (typeof item !== "number" || Number.isFinite(item)))) && s.type === valueKind(s.value))));
  }
  function validPatch(record) {
    return supportedStates(record.before) && supportedStates(record.after) &&
      new Set(record.before.map(s => s.name)).size === record.before.length &&
      equal(record.before.map(s => s.name), record.after.map(s => s.name));
  }
  function stateText(states) {
    return states.map(s => `${s.name}: ${s.present ? typedText(s.value) : "Property missing"}`).join("\n");
  }
  function sameStates(left, right) {
    return left.length === right.length && left.every((s, i) => s.name === right[i].name && s.present === right[i].present &&
      (!s.present || (s.type === right[i].type && sameValue(s.value, right[i].value))));
  }
  function sameValue(a, b) {
    if (Object.is(a, b)) return true;
    if (typeof a !== typeof b || !a || !b || typeof a !== "object") return false;
    if (Object.prototype.toString.call(a) !== Object.prototype.toString.call(b)) return false;
    if (Object.prototype.toString.call(a) === "[object Date]") return a.getTime() === b.getTime();
    const keys = Object.keys(a).sort(), other = Object.keys(b).sort();
    return equal(keys, other) && keys.every(key => sameValue(a[key], b[key]));
  }
  function changeRecord(p) {
    return {schemaVersion: 1, path: p.note.file.path, operation: p.operation,
      before: copyMetadata(p.before), after: copyMetadata(p.after), ...(p.filter ? {filter: copyMetadata(p.filter)} : {}), outcome: "proposed", undoStatus: "pending"};
  }
  // Future Apply must supply a successful save receipt AND a reread matching the
  // proposal. A preview alone cannot become an undoable history entry.
  function verifiedRecord(p, receipt) {
    if (p.status !== "Changed" || !validPatch(p) || receipt?.saved !== true || receipt.path !== p.note.file.path ||
        !receipt.indexed || !receipt.frontmatter || !sameStates(propertyStates(receipt.frontmatter, p.after.map(s => s.name)), p.after)) return null;
    return {...changeRecord(p), outcome: "verified", verifiedAt: receipt.verifiedAt || new Date().toISOString()};
  }
  function planUndo(record, note) {
    const result = {note, current: "Unavailable", proposed: "Unchanged", status: "Conflict", reason: "Invalid change record", before: [], after: []};
    if (record.schemaVersion !== 1 || !validPatch(record)) return result;
    if (record.outcome !== "verified") return {...result, reason: "Only successfully saved and verified changes can be undone"};
    if (!note || note.file.path !== record.path) return {...result, reason: "Note is missing or moved; locate and verify it before Undo"};
    if (!note.indexed) return {...result, reason: "Note is awaiting indexing"};
    const current = propertyStates(note.frontmatter, record.after.map(s => s.name));
    Object.assign(result, {before: current, after: copyMetadata(record.before), current: stateText(current), proposed: stateText(record.before)});
    if (record.undoStatus === "undone") return {...result, status: "Skipped", proposed: "Unchanged", reason: "Already undone"};
    if (!sameStates(current, record.after)) return {...result, reason: "An affected property changed since the batch; review manually"};
    return {...result, status: "Changed", reason: "Ready to restore original properties"};
  }

  function readDocument(raw) {
    const bom = raw.startsWith("\uFEFF") ? "\uFEFF" : "";
    const content = raw.slice(bom.length), info = getFrontMatterInfo(content);
    if (!info.exists && /^---(?:\r?\n|$)/.test(content)) throw new Error("Frontmatter is incomplete or malformed");
    const fm = info.exists ? parseYaml(info.frontmatter) ?? {} : {};
    if (typeof fm !== "object" || Array.isArray(fm)) throw new Error("Properties must be a YAML mapping");
    if (fingerprint(fm) === null) throw new Error("Cyclic YAML values are not supported; review manually");
    return {fm, info, bom, content, body: info.exists ? content.slice(info.contentStart) : content};
  }
  async function readNoteRaw(app, file) {
    // Vault.read strips a leading BOM; Vault.process receives the original bytes.
    // Preserve the BOM for race checks, backups, verification and exact Undo.
    const bytes = await app.vault.readBinary(file);
    return new TextDecoder("utf-8", {ignoreBOM: true, fatal: true}).decode(bytes);
  }
  function patchDocument(raw, states) {
    const doc = readDocument(raw), fm = copyMetadata(doc.fm);
    for (const s of states) {
      if (!s.name.trim() || ["__proto__", "constructor", "prototype"].includes(s.name) || /[\r\n\0]/.test(s.name)) throw new Error("Unsafe property name; review manually");
      if (s.present) Object.defineProperty(fm, s.name, {value: copyMetadata(s.value), enumerable: true, configurable: true, writable: true});
      else delete fm[s.name];
    }
    const newline = raw.includes("\r\n") ? "\r\n" : "\n";
    let output;
    if (!doc.info.exists) {
      const yaml = stringifyYaml(fm).replace(/\r?\n/g, newline).replace(/(?:\r?\n)*$/, "") + newline;
      output = doc.bom + `---${newline}${yaml}---${newline}` + doc.body;
    } else {
      const source = doc.info.frontmatter;
      const parsed = preservingYaml.parseDocument(source, {keepSourceTokens: true});
      if (parsed.errors.length || parsed.warnings.length || (parsed.contents && !preservingYaml.isMap(parsed.contents)) || /^%/m.test(source)) throw new Error("This YAML cannot be edited without risking its formatting; review manually");
      const pairs = parsed.contents?.items || [];
      if (parsed.contents?.flow && pairs.length) throw new Error("Flow-style property sections need manual review; no changes were made");
      const entries = new Map();
      for (const pair of pairs) {
        if (!preservingYaml.isScalar(pair.key) || typeof pair.key.value !== "string" || !pair.key.range) throw new Error("Complex YAML property keys need manual review");
        entries.set(pair.key.value, pair);
      }
      const edits = [];
      const removed = states.filter(s => !s.present && entries.has(s.name));
      const added = states.filter(s => s.present && !entries.has(s.name));
      const rename = states.length === 2 && removed.length === 1 && added.length === 1 && sameValue(doc.fm[removed[0].name], added[0].value);
      if (rename) {
        const key = entries.get(removed[0].name).key;
        // Rename only the key token: preserve the value, comments and spacing.
        const encoded = preservingYaml.stringify({[added[0].name]: null}, {nullStr: "null", lineWidth: 0}).replace(/: null\n$/, "");
        edits.push({start: key.range[0], end: key.range[1], text: encoded});
      } else {
        for (const state of states) {
          const pair = entries.get(state.name);
          if (!pair) {
            if (state.present) {
              const text = preservingYaml.stringify({[state.name]: state.value}, {lineWidth: 0, aliasDuplicateObjects: false}).replace(/\n/g, newline);
              if (parsed.contents?.flow) edits.push({start: parsed.contents.range[0], end: parsed.contents.range[1], text: text.replace(/\r?\n$/, "")});
              else {
                const lastPair = pairs[pairs.length - 1];
                let insertion = source.length;
                if (lastPair) {
                  const start = lastPair.key.range[0], valueEnd = lastPair.value?.range?.[1] ?? lastPair.key.range[1];
                  const last = start + source.slice(start, valueEnd).trimEnd().length;
                  const next = source.indexOf("\n", last); insertion = next < 0 ? source.length : next + 1;
                }
                edits.push({start: insertion, end: insertion, text: (insertion && source[insertion - 1] !== "\n" ? newline : "") + text});
              }
            }
            continue;
          }
          if (state.present && sameValue(doc.fm[state.name], state.value)) continue;
          preservingYaml.visit(pair.value, (_, node) => {
            if (node?.anchor || node?.tag || preservingYaml.isAlias(node)) throw new Error("Anchored, aliased or tagged properties need manual review; no changes were made");
          });
          const keyStart = pair.key.range[0], lineStart = source.lastIndexOf("\n", keyStart - 1) + 1;
          const indent = source.slice(lineStart, keyStart);
          if (!/^ *$/.test(indent)) throw new Error("Complex YAML layout needs manual review");
          // Stop at the last value line, preserving standalone comments and
          // blank lines following the entry, even if the parser attaches them.
          const valueEnd = pair.value?.range?.[1] ?? pair.key.range[1];
          const last = keyStart + source.slice(keyStart, valueEnd).trimEnd().length;
          const nextNewline = source.indexOf("\n", last);
          const end = nextNewline < 0 ? source.length : nextNewline + 1;
          if (!state.present) {edits.push({start: lineStart, end, text: ""}); continue;}
          const isolated = parsed.clone(), changedPair = isolated.contents.items[pairs.indexOf(pair)];
          isolated.contents.items = [changedPair]; isolated.comment = undefined; isolated.commentBefore = undefined;
          isolated.contents.comment = undefined; isolated.contents.commentBefore = undefined; changedPair.key.commentBefore = undefined;
          const old = changedPair.value;
          if (preservingYaml.isScalar(old) && !Array.isArray(state.value)) {
            old.value = state.value;
            if (typeof state.value !== "string") old.type = preservingYaml.Scalar.PLAIN;
          } else {
            const replacement = isolated.createNode(state.value);
            if (old) for (const key of ["comment", "commentBefore", "spaceBefore", "flow"]) replacement[key] = old[key];
            if (preservingYaml.isSeq(old) && Array.isArray(state.value)) {
              const available = old.items.map((node, index) => ({node, value: doc.fm[state.name][index], used: false}));
              replacement.items = state.value.map((value, index) => {
                const match = available.find(item => !item.used && sameValue(item.value, value));
                if (match) {match.used = true; return match.node.clone();}
                return isolated.createNode(value);
              });
            }
            changedPair.value = replacement;
          }
          const ownComments = new Map();
          const collectComments = token => {
            if (!token || typeof token !== "object") return;
            if (token.type === "comment" && token.offset >= lineStart && token.offset < end) {
              const text = token.source.slice(1).trim(); ownComments.set(text, (ownComments.get(text) || 0) + 1);
            }
            for (const value of Object.values(token)) {
              if (Array.isArray(value)) value.forEach(collectComments);
              else if (value && typeof value === "object") collectComments(value);
            }
          };
          collectComments(pair.srcToken);
          preservingYaml.visit(isolated.contents, (_, node) => {
            if (!node || typeof node !== "object") return;
            for (const key of ["commentBefore", "comment"]) if (typeof node[key] === "string") {
              node[key] = node[key].split("\n").filter(line => {
                const text = line.trim(), count = ownComments.get(text) || 0;
                if (!count) return false;
                ownComments.set(text, count - 1); return true;
              }).join("\n") || undefined;
            }
          });
          // Stringify only the selected pair. The rest of the original YAML is
          // never serialized, so its bytes stay exactly as they were.
          const rendered = isolated.toString({lineWidth: 0}).replace(/\n/g, newline);
          const text = rendered.split(newline).map((line, index, all) => index === all.length - 1 && !line ? "" : indent + line).join(newline);
          edits.push({start: lineStart, end, text});
        }
      }
      let yaml = source;
      for (const edit of edits.sort((a, b) => b.start - a.start)) yaml = yaml.slice(0, edit.start) + edit.text + yaml.slice(edit.end);
      const from = doc.info.from ?? doc.content.indexOf(source, doc.content.indexOf("\n") + 1);
      if (from < 0 || doc.content.slice(from, from + source.length) !== source) throw new Error("Cannot locate YAML safely");
      output = doc.bom + doc.content.slice(0, from) + yaml + doc.content.slice(from + source.length);
    }
    const reread = readDocument(output);
    // Refuse a serializer result that changes any other property or the body.
    const keys = [...new Set([...Object.keys(fm), ...Object.keys(reread.fm)])].sort();
    if (reread.body !== doc.body || !sameStates(propertyStates(fm, keys), propertyStates(reread.fm, keys))) throw new Error("Cannot serialize these properties without changing other values");
    return output;
  }
  function unsavedReason(app, file, raw) {
    let reason = "";
    app.workspace?.iterateAllLeaves?.(leaf => {
      const view = leaf.view;
      const normalized = value => value.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
      if (view?.file?.path === file.path && typeof view.getViewData === "function" && normalized(view.getViewData()) !== normalized(raw)) reason = "This note has unsaved editor changes; save it and Refresh first";
    });
    return reason;
  }
  class WriteService {
    constructor(app, plugin, data) {
      this.app = app; this.plugin = plugin; this.busy = false; this.ready = false;
      this.data = data ?? {schemaVersion: 1, batches: []};
      if (this.data.schemaVersion !== 1 || !Array.isArray(this.data.batches)) throw new Error("Unsupported or damaged Property Hag history; no notes will be changed");
      for (const batch of this.data.batches) if (!batch || !Array.isArray(batch.records) || batch.records.some(r => !r || typeof r.path !== "string" || !validPatch(r))) throw new Error("Damaged batch history; restore data.json before editing");
    }
    async persist() {
      try {
        this.data.revision = (this.data.revision || 0) + 1;
        const saved = copyMetadata(this.data);
        // Keep the journal compact: full note backups live in separate files,
        // rather than rewriting every note body on every progress update.
        for (const batch of saved.batches) for (const record of batch.records) {
          for (const key of ["beforeRaw", "afterRaw", "undoBeforeRaw", "undoAfterRaw"]) delete record[key];
        }
        // Keep a second journal copy: a crash during either file write leaves
        // the other copy available. Never write a note until both saves succeed.
        await this.app.vault.adapter.write(`${this.plugin.manifest.dir}/history-backup.json`, JSON.stringify(saved));
        await this.plugin.saveData(saved);
      }
      catch (error) { this.ready = false; this.error = `History could not be saved. Further writes are blocked: ${error.message}`; throw new Error(this.error); }
    }
    async hydrate() {
      const directory = `${this.plugin.manifest.dir}/backups/`;
      for (const batch of this.data.batches) for (const record of batch.records) {
        for (const [key, fields] of [["backupPath", ["beforeRaw", "afterRaw"]], ["undoBackupPath", ["undoBeforeRaw", "undoAfterRaw"]]]) {
          if (!record[key]) continue;
          if (typeof record[key] !== "string" || !record[key].startsWith(directory) || /[\\/\0]/.test(record[key].slice(directory.length)) || record[key].includes("..")) throw new Error("Unsafe backup path in history");
          const backup = JSON.parse(await this.app.vault.adapter.read(record[key]));
          if (fields.some(field => typeof backup[field] !== "string")) throw new Error("A saved note backup is damaged; restore it before editing");
          const before = readDocument(backup[fields[0]]), after = readDocument(backup[fields[1]]);
          const original = key === "backupPath" ? record.before : record.after;
          const proposed = key === "backupPath" ? record.after : record.before;
          if (!sameStates(propertyStates(before.fm, original.map(s => s.name)), original) || !sameStates(propertyStates(after.fm, proposed.map(s => s.name)), proposed) || before.body !== after.body) throw new Error("Backup content does not match its change record; writing is blocked");
          const untouched = [...new Set([...Object.keys(before.fm), ...Object.keys(after.fm)])].filter(name => !original.some(s => s.name === name)).sort();
          if (!sameStates(propertyStates(before.fm, untouched), propertyStates(after.fm, untouched))) throw new Error("Backup contains changes to unrelated properties; writing is blocked");
          for (const field of fields) record[field] = backup[field];
        }
      }
    }
    async saveNoteBackup(record, undoing) {
      try {
        if (!/^[a-zA-Z0-9-]+$/.test(record.backupKey)) throw new Error("Invalid note backup identifier");
        const directory = `${this.plugin.manifest.dir}/backups`;
        if (!await this.app.vault.adapter.exists(directory)) await this.app.vault.adapter.mkdir(directory);
        const key = undoing ? "undoBackupPath" : "backupPath";
        if (undoing) record[key] = `${directory}/${record.backupKey}-undo-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
        else record[key] = `${directory}/${record.backupKey}.json`;
        const backup = undoing ? {undoBeforeRaw: record.undoBeforeRaw, undoAfterRaw: record.undoAfterRaw} : {beforeRaw: record.beforeRaw, afterRaw: record.afterRaw};
        await this.app.vault.adapter.write(record[key], JSON.stringify(backup));
      } catch (error) {this.ready = false; this.error = `Original note backup could not be saved; writes are blocked: ${error.message}`; throw new Error(this.error);}
    }
    fileFor(record) {
      const file = this.app.vault.getAbstractFileByPath(record.path);
      if (!file || file.extension !== "md") throw new Error("Note is missing, moved, or is no longer Markdown");
      if (record.fileCtime !== undefined && file.stat?.ctime !== record.fileCtime) throw new Error("Note was replaced since this batch; review manually");
      return file;
    }
    async inspectUndo(record) {
      try {
        const file = this.fileFor(record), raw = await readNoteRaw(this.app, file);
        const reason = unsavedReason(this.app, file, raw);
        const undo = planUndo(record, {file, indexed: true, frontmatter: readDocument(raw).fm});
        return reason ? {...undo, status: "Conflict", reason} : undo;
      } catch (error) { return {current: "Unavailable", proposed: "Unchanged", status: "Conflict", reason: error.message}; }
    }
    async recover() {
      // Recovery classifies interrupted writes only; it never changes notes.
      let changed = false;
      for (const batch of this.data.batches) {
        for (const r of batch.records) {
          const undoing = r.undoStatus === "writing", applying = r.outcome === "writing";
          if (!undoing && !applying) continue;
          changed = true;
          try {
            const raw = await readNoteRaw(this.app, this.fileFor(r));
            const before = undoing ? r.undoBeforeRaw : r.beforeRaw, after = undoing ? r.undoAfterRaw : r.afterRaw;
            if (typeof after === "string" && raw === after) {
              if (undoing) r.undoStatus = "undone"; else r.outcome = "verified";
              r.reason = "Recovered interrupted write by rereading the saved note";
            } else if (typeof before === "string" && raw === before) {
              if (undoing) r.undoStatus = "pending"; else r.outcome = "not-applied";
              r.reason = "Interrupted before the note was changed";
            } else {
              if (undoing) r.undoStatus = "uncertain"; else r.outcome = "uncertain";
              r.reason = "Interrupted write cannot be verified; retained backup, manual review required";
            }
          } catch (error) {
            if (undoing) r.undoStatus = "uncertain"; else r.outcome = "uncertain";
            r.reason = `Recovery needs review: ${error.message}`;
          }
        }
        if (batch.status === "processing") {batch.status = "interrupted"; changed = true;}
      }
      if (changed) await this.persist();
    }
    async writeRecord(record, file, expectedRaw, nextRaw, undoing) {
      if (record.before.some(s => !s.name.trim()) || !validPatch(record)) throw new Error("Invalid property patch");
      if (undoing) Object.assign(record, {undoBeforeRaw: expectedRaw, undoAfterRaw: nextRaw, undoStatus: "writing"});
      else Object.assign(record, {beforeRaw: expectedRaw, afterRaw: nextRaw, outcome: "writing"});
      await this.saveNoteBackup(record, undoing);
      await this.persist(); // Journal + original note reach storage before any note write.
      let attempted = false;
      try {
        await this.app.vault.process(file, raw => {
          if (this.app.vault.getAbstractFileByPath(record.path) !== file || file.path !== record.path) throw new Error("Note moved or was replaced during the operation");
          if (raw !== expectedRaw) throw new Error("Note changed immediately before writing; Refresh and review again");
          const unsaved = unsavedReason(this.app, file, raw);
          if (unsaved) throw new Error(unsaved);
          if (!undoing && !matchesAdditionalFilter(readDocument(raw).fm, record.filter)) throw new Error("Note no longer matches the additional property filter");
          attempted = true;
          return nextRaw;
        });
        const saved = await readNoteRaw(this.app, file);
        if (saved !== nextRaw) throw new Error("Saved content did not match the proposed change; retained backup for review");
        const states = undoing ? record.before : record.after;
        if (!sameStates(propertyStates(readDocument(saved).fm, states.map(s => s.name)), states)) throw new Error("Saved properties failed verification");
        if (undoing) Object.assign(record, {undoStatus: "undone", undoneAt: new Date().toISOString(), reason: "Undo saved and verified"});
        else Object.assign(record, {outcome: "verified", verifiedAt: new Date().toISOString(), reason: "Saved and verified"});
      } catch (error) {
        // A rejected promise can follow an actual write. Inspect disk before
        // declaring failure, retaining the journal if verification is impossible.
        let actual;
        try {actual = await readNoteRaw(this.app, file);} catch {}
        if (attempted && actual === nextRaw) {
          if (undoing) record.undoStatus = "undone"; else record.outcome = "verified";
          record.reason = `Saved content verified after reported error: ${error.message}`;
        } else if (actual === expectedRaw || !attempted) {
          if (undoing) record.undoStatus = "pending"; else record.outcome = "failed";
          record.reason = error.message;
        } else {
          if (undoing) record.undoStatus = "uncertain"; else record.outcome = "uncertain";
          record.reason = `Write could not be verified: ${error.message}. Original content is retained in history.`;
        }
      }
      await this.persist();
    }
    async apply(plans, state, progress = () => {}) {
      if (!this.ready || this.busy) throw new Error(this.error || "Another batch is running or history is not ready");
      this.busy = true;
      this.idlePromise = new Promise(resolve => {this.resolveIdle = resolve;});
      const candidates = plans.filter(p => p.status === "Changed");
      const batch = {id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: new Date().toISOString(),
        operation: state.operation, property: state.property, status: "processing", records: []};
      try {
        if (!candidates.length) throw new Error("No proposed changes to apply");
        this.data.batches.unshift(batch); await this.persist();
        for (const [index, p] of candidates.entries()) {
          if (this.stopping) throw new Error("Plugin unloaded; remaining notes were not changed");
          const record = {...changeRecord(p), outcome: "pending", backupKey: `${batch.id}-${index}`}; batch.records.push(record);
          try {
            if (!validPatch(record)) throw new Error("Unsupported original or proposed property value");
            const stale = staleReason(p.note, liveContext(this.app)); if (stale) throw new Error(stale);
            const file = this.fileFor(record);
            if (p.note.sourceFile && file !== p.note.sourceFile) throw new Error("Note was replaced since Preview");
            record.fileCtime = file.stat?.ctime;
            const raw = await readNoteRaw(this.app, file), doc = readDocument(raw);
            if (!matchesAdditionalFilter(doc.fm, record.filter)) throw new Error("Note no longer matches the additional property filter");
            const unsaved = unsavedReason(this.app, file, raw); if (unsaved) throw new Error(unsaved);
            if (!sameStates(propertyStates(doc.fm, record.before.map(s => s.name)), record.before)) throw new Error("Affected properties differ from Preview");
            const next = patchDocument(raw, record.after);
            await this.writeRecord(record, file, raw, next, false);
          } catch (error) {
            if (!this.ready) throw error;
            // Only pre-write validation failures are conflicts. A write already
            // classified as verified, failed, or uncertain must retain that state.
            if (record.outcome !== "pending") throw error;
            record.outcome = "conflict"; record.reason = error.message; await this.persist();
          }
          progress(index + 1, candidates.length, record);
        }
        batch.status = "completed"; batch.completedAt = new Date().toISOString(); await this.persist();
        return batch;
      } finally {this.busy = false; this.resolveIdle?.();}
    }
    async undo(batch, selectedRecords, progress = () => {}) {
      if (!this.ready || this.busy) throw new Error(this.error || "Another batch is running or history is not ready");
      if (!this.data.batches.includes(batch)) throw new Error("Batch is not in saved history");
      this.busy = true;
      this.idlePromise = new Promise(resolve => {this.resolveIdle = resolve;});
      try {
        const records = batch.records.filter(r => selectedRecords.includes(r) && r.outcome === "verified" && r.undoStatus === "pending");
        for (const [index, record] of records.entries()) {
          if (this.stopping) throw new Error("Plugin unloaded; remaining notes were not undone");
          try {
            const file = this.fileFor(record), raw = await readNoteRaw(this.app, file);
            const unsaved = unsavedReason(this.app, file, raw); if (unsaved) throw new Error(unsaved);
            const p = planUndo(record, {file, indexed: true, frontmatter: readDocument(raw).fm});
            if (p.status !== "Changed") throw new Error(p.reason);
            // Full restoration is safe only if this entry-only editor can prove
            // the original Apply left every surrounding byte untouched. Older
            // history may contain whole-YAML rewrites; do not restore those wholesale.
            const exactRestore = raw === record.afterRaw && typeof record.beforeRaw === "string" && patchDocument(record.beforeRaw, record.after) === record.afterRaw;
            const next = exactRestore ? record.beforeRaw : patchDocument(raw, record.before);
            await this.writeRecord(record, file, raw, next, true);
          } catch (error) {
            if (!this.ready) throw error;
            record.reason = error.message; await this.persist();
          }
          progress(index + 1, records.length, record);
        }
        batch.lastUndoAt = new Date().toISOString(); await this.persist();
        return batch;
      } finally {this.busy = false; this.resolveIdle?.();}
    }
  }
  initializeWrites = async (app, plugin, data) => {
    try {
      const previous = writeServices.get(app) || app[writeServiceKey];
      if (previous?.busy && previous.idlePromise) await previous.idlePromise;
      if (data === undefined) {
        let primary, backup, loadError;
        try {primary = await plugin.loadData();} catch (error) {loadError = error;}
        const path = `${plugin.manifest.dir}/history-backup.json`;
        if (await app.vault.adapter.exists(path)) {
          try {backup = JSON.parse(await app.vault.adapter.read(path));} catch (error) {if (!primary) loadError ||= error;}
        }
        if (backup && (!primary || (backup.revision || 0) > (primary.revision || 0))) {
          // Validate a backup before allowing it to replace an existing journal.
          new WriteService(app, plugin, backup);
          data = backup;
        } else data = primary;
        if (loadError && !data) throw loadError;
        if (!data && await app.vault.adapter.exists(`${plugin.manifest.dir}/backups`)) throw new Error("History is missing but note backups remain. Restore the history journals before editing.");
      }
      const service = new WriteService(app, plugin, data); writeServices.set(app, service);
      app[writeServiceKey] = service;
      await service.hydrate(); await service.recover(); service.ready = true; return service;
    } catch (error) {
      writeServices.set(app, {ready: false, busy: false, error: error.message, data: {batches: []}});
      if (Notice) new Notice(`Property Hag: ${error.message}`, 10000);
      return writeServices.get(app);
    }
  };

  class ConfirmBatchModal extends HagModal {
    constructor(app, title, count, details, action, back, operationText) {super(app); Object.assign(this, {confirmationTitle: title, count, details, action, back, operationText});}
    close() {if (!this.running) super.close();}
    onOpen() {
      this.setupHeader(this.confirmationTitle, this.back, "preview");
      if (this.operationText) this.contentEl.createEl("p", {text: this.operationText, cls: "property-hag-operation-heading"});
      this.contentEl.createEl("p", {text: this.details});
      this.contentEl.createEl("p", {text: "This will save changes to your notes. Original content is saved in local batch history first. Only the selected property entry changes; other properties, comments and note text stay intact.", cls: "property-hag-warning"});
      const button = this.contentEl.createEl("button", {text: `${this.confirmationTitle === "Confirm Undo" ? "Undo" : "Apply"} ${this.count} ${this.count === 1 ? "note" : "notes"}`, cls: "mod-cta", attr: {type: "button"}});
      const cancel = this.contentEl.createEl("button", {text: "Cancel", attr: {type: "button"}});
      const progress = this.contentEl.createEl("p", {attr: {role: "status", "aria-live": "polite"}});
      button.addEventListener("click", async () => {
        if (button.disabled) return;
        button.disabled = true; cancel.disabled = true; this.running = true;
        const back = this.contentEl.querySelector(".property-hag-back"); if (back) back.hidden = true;
        try {await this.action((done, total) => {progress.textContent = `${done} of ${total} notes processed…`;}); this.running = false; this.close();}
        catch (error) {this.running = false; progress.textContent = `${friendlyWarning(error.message)} Review batch history for any completed changes.`; progress.addClass("property-hag-warning"); cancel.disabled = false; if (back) back.hidden = false;}
      });
      cancel.addEventListener("click", () => {this.close(); this.back();});
    }
  }
  class BatchResultModal extends HagModal {
    constructor(app, batch, undoing = false, back) {super(app); Object.assign(this, {batch, undoing, back});}
    onOpen() {
      const resultState = `${this.undoing ? "undo-results" : "batch-results"}:${this.batch.id ?? this.batch.createdAt}`;
      this.setupHeader(this.undoing ? "Undo results" : "Batch results", this.back || (() => openMenu(this.app)), "history", resultState);
      const records = this.batch.records;
      const saved = records.filter(r => this.undoing ? r.undoStatus === "undone" : r.outcome === "verified").length;
      this.contentEl.createEl("p", {text: `${saved} ${this.undoing ? "undone" : "saved and verified"} · ${records.length - saved} not verified${this.undoing ? " as undone" : " as applied"}`});
      if (records.some(r => r.outcome === "uncertain" || r.undoStatus === "uncertain")) this.contentEl.createEl("p", {text: "Some changes could not be confirmed. Check those notes and their Original backups in batch history before making more changes.", cls: "property-hag-warning"});
      const actions = this.contentEl.createDiv({cls: "property-hag-actions"});
      const history = actions.createEl("button", {text: "Open batch history / Undo", attr: {type: "button"}});
      history.addEventListener("click", () => {this.close(); new HistoryModal(this.app).open();});
      const bind = createTableSearch(this.contentEl, "Search results…");
      const container = this.contentEl.createDiv({cls: "property-hag-table-container"});
      const table = container.createEl("table", {cls: "property-hag-table property-hag-workflow-table"});
      const header = table.createEl("thead").createEl("tr"), body = table.createEl("tbody");
      const rows = records.map(r => {
        const row = body.createEl("tr"); noteLink(row.createEl("td"), this.app, {path: r.path, basename: r.path.split('/').pop().replace(/\.md$/i, '')});
        const status = this.undoing ? r.undoStatus : r.outcome;
        row.createEl("td", {text: status}); row.createEl("td", {text: friendlyWarning(r.reason), cls: (this.undoing ? status !== "undone" : status !== "verified") ? "property-hag-warning" : ""});
        return {element: row, keys: [r.path, status, friendlyWarning(r.reason)]};
      });
      makeSortable(header, body, rows, ["Note", "Result", "Details"]); bind(container, rows, row => row.keys.join("\n"), "notes");

    }
  }
  class BackupModal extends HagModal {
    constructor(app, record, back) {super(app); Object.assign(this, {record, back});}
    onOpen() {
      this.setupHeader("Original note backup", this.back, "history");
      this.contentEl.createEl("p", {text: this.record.path});
      this.contentEl.createEl("p", {text: "Original saved content, retained before Apply. You can copy this for manual recovery. This screen does not restore or replace the note.", cls: "property-hag-summary"});
      const text = this.contentEl.createEl("textarea", {cls: "property-hag-backup-text", attr: {readonly: "", "aria-label": "Original note content"}});
      text.value = typeof this.record.beforeRaw === "string" ? this.record.beforeRaw : "No backup was needed: this note was not written.";
    }
  }
  class SavedUndoModal extends HagModal {
    constructor(app, batch) {super(app); this.batch = batch; this.generation = 0;}
    onClose() {this.generation++; super.onClose();}
    onOpen() {
      this.setupHeader("Undo saved batch", () => new HistoryModal(this.app).open(), "undo-preview");
      const el = this.contentEl, service = writeServices.get(this.app);
      el.createEl("p", {text: `${historyTime(this.batch.createdAt)} · ${this.batch.operation} · ${this.batch.property}`});
      el.createEl("p", {text: "Only verified changes can be undone. Later changes to affected properties are conflicts; other edits stay intact.", cls: "property-hag-summary"});
      const totals = el.createEl("p", {attr: {role: "status"}});
      const bind = createTableSearch(el, "Search Undo preview…");
      const container = el.createDiv({cls: "property-hag-table-container"});
      const table = container.createEl("table", {cls: "property-hag-table property-hag-workflow-table property-hag-preview-table"});
      const header = table.createEl("thead").createEl("tr"), body = table.createEl("tbody");
      const rows = this.batch.records.map(record => {
        const row = body.createEl("tr"); noteLink(row.createEl("td"), this.app, {path: record.path, basename: record.path.split('/').pop().replace(/\.md$/i, '')});
        if (typeof record.beforeRaw === "string") {
          const backup = row.children[0].createEl("button", {text: "Original backup", cls: "property-hag-backup-link", attr: {type: "button"}});
          backup.addEventListener("click", event => {event.preventDefault(); this.close(); new BackupModal(this.app, record, () => new SavedUndoModal(this.app, this.batch).open()).open();});
        }
        return {record, element: row, current: row.createEl("td"), restored: row.createEl("td"), result: row.createEl("td"), keys: [record.path, "", "", ""]};
      });
      const sort = makeSortable(header, body, rows, ["Note", "Current", "Undo restores", "Result"]);
      const filter = bind(container, rows, row => row.keys.join("\n"), "notes");
      const toolbar = el.createDiv({cls: "property-hag-toolbar"});
      const refreshButton = toolbar.createEl("button", {text: "Refresh Undo preview", attr: {type: "button"}});
      const undoButton = toolbar.createEl("button", {text: "Undo ready notes", cls: "mod-cta", attr: {type: "button"}});
      let eligible = [];
      const refresh = async () => {
        const generation = ++this.generation; undoButton.disabled = true;
        if (!service?.ready) {totals.textContent = friendlyWarning(service?.error) || "Batch history is still loading. Wait a moment, then reopen this screen."; totals.addClass("property-hag-warning"); return;}
        const inspected = await Promise.all(rows.map(async row => ({row, p: row.record.outcome === "verified" && row.record.undoStatus !== "uncertain"
          ? await service.inspectUndo(row.record) : {current: stateText(row.record.after), proposed: "Unchanged", status: row.record.outcome === "uncertain" || row.record.undoStatus === "uncertain" ? "Conflict" : "Skipped", reason: row.record.reason || "This change was not verified or needs manual review"}})));
        if (generation !== this.generation) return;
        eligible = [];
        let conflicts = 0;
        for (const {row, p} of inspected) {
          row.current.textContent = p.current; row.restored.textContent = p.proposed; row.result.textContent = `${p.status}: ${friendlyWarning(p.reason)}`;
          row.result.classList.toggle("property-hag-warning", p.status === "Conflict");
          row.keys = [row.record.path, p.current, p.proposed, `${p.status}: ${friendlyWarning(p.reason)}`];
          if (p.status === "Changed" && row.record.undoStatus === "pending") eligible.push(row.record);
          if (p.status === "Conflict") conflicts++;
        }
        totals.textContent = `${eligible.length} ready to undo · ${conflicts} conflicts · ${rows.length - eligible.length - conflicts} skipped`;
        undoButton.textContent = `Undo ${eligible.length} ready notes`;
        undoButton.disabled = !eligible.length || service.busy;
        sort(); filter();
      };
      refreshButton.addEventListener("click", () => refresh());
      const update = debounceSearch(el, () => refresh());
      watchNoteChanges(this, () => {undoButton.disabled = true; update.schedule();});
      undoButton.addEventListener("click", () => {
        if (undoButton.disabled) return;
        const records = [...eligible]; this.close();
        new ConfirmBatchModal(this.app, "Confirm Undo", records.length, `Restore original properties in ${records.length} notes. Conflicting, failed, and already undone notes will be left alone.`,
          async progress => {await service.undo(this.batch, records, progress); new BatchResultModal(this.app, this.batch, true).open();},
          () => new SavedUndoModal(this.app, this.batch).open()).open();
      });
      refresh();
    }
  }

  class BatchModal extends HagModal {
    constructor(app, state = {}, back) {
      super(app);
      this.state = { property: "", operation: "set", condition: state.property ? "exists" : "all", includeSubfolders: true, query: "", match: "", value: "", type: "text", target: "", filterEnabled: false, filterProperty: "", filterCondition: "equals", selected: new Set(), ...state };
      this.state.conditionManual = state.conditionManual ?? own(state, "condition");
      this.state.valueDraft ||= editorDraft(this.state.type, this.state.value);
      this.state.matchDraft ||= editorDraft("text", this.state.match);
      this.state.filterDraft ||= editorDraft("text", "");
      if (!Array.isArray(this.state.filters)) {
        this.state.filters = this.state.filterEnabled ? [{property: this.state.filterProperty, condition: this.state.filterCondition, draft: this.state.filterDraft, typed: this.state.filterTyped}] : [];
        if (this.state.conditionManual && this.state.condition !== "all" && this.state.property)
          this.state.filters.unshift({property: this.state.property, condition: this.state.condition, draft: copyMetadata(this.state.matchDraft), typed: this.state.matchTyped});
      }
      this.state.filterMode ||= "all";
      // New grouped states use operation eligibility only; older callers with
      // an explicit Find notes condition are migrated into the visible cards.
      if (Array.isArray(state.filters)) this.state.conditionManual = false;
      this.back = back || (() => openMenu(app));
    }
    onOpen() {
      this.setupHeader("Batch actions", this.back);
      const el = this.contentEl, s = this.state;
      this.modalEl.addClass("property-hag-batch-editor");
      const editSection = el.createDiv({cls: "property-hag-batch-section"});
      editSection.createEl("h3", {text: "1. Choose a change"});
      const chooseSection = el.createDiv({cls: "property-hag-batch-section"});
      chooseSection.createEl("h3", {text: "2. Choose notes"});
      const reviewSection = el.createDiv({cls: "property-hag-batch-section"});
      reviewSection.createEl("h3", {text: "3. Review and apply"});
      const primary = editSection.createDiv({ cls: "property-hag-form" });
      const operation = field(primary, "Operation", s.operation, operations);
      const property = field(primary, "Property name", s.property);
      const scope = chooseSection.createDiv({ cls: "property-hag-scope" });
      scope.createEl("span", { text: s.folderPath !== undefined ? `Folder: ${s.folderPath || "/"}` : "Scope: Whole vault" });
      const warnings = reviewSection.createDiv({ cls: "property-hag-batch-warnings", attr: { role: "status", "aria-live": "polite" } });
      const error = warnings.createEl("p", { cls: "property-hag-error", attr: { role: "alert" } });
      const conflictWarnings = warnings.createDiv();
      let recursive;
      if (s.folderPath !== undefined) {
        const label = scope.createEl("label", { cls: "property-hag-scope-toggle" });
        recursive = label.createEl("input", { attr: { type: "checkbox" } });
        recursive.checked = s.includeSubfolders;
        label.createEl("span", { text: "Include subfolders" });
      }
      const form = editSection.createDiv({ cls: "property-hag-form" });
      const condition = field(form, "Find notes", s.condition, [["exists", "Property exists"], ["missing", "Property missing"], ["empty", "Property is empty"], ["equals", "Value equals (same type)"], ["contains", "Contains text / list item"], ["greater", "Number is greater than"], ["less", "Number is less than"], ["all", "All notes"]]);
      const matchEditor = typedEditor(form, "Match value", s.matchDraft, () => sync());
      const newValues = editSection.createDiv({ cls: "property-hag-form" });
      const target = field(newValues, "New property name", s.target);
      const propertyNames = [...new Set(snapshot(this.app).flatMap(note => Object.keys(note.frontmatter)))].sort((a, b) => a.localeCompare(b));
      suggestProperties(property, propertyNames);
      suggestProperties(target, propertyNames);
      const valueEditor = typedEditor(newValues, "New value / list item", s.valueDraft, () => sync());
      const filterSection = chooseSection.createDiv({cls: "property-hag-filter-builder"});
      const filterMode = field(filterSection, "Match notes meeting", s.filterMode, [["all", "All conditions (AND)"], ["any", "Any condition (OR)"]]);
      const filterRows = filterSection.createDiv({cls: "property-hag-filter-rows"});
      const filterEmpty = filterSection.createEl("p", {text: "No property filters. Add a condition to narrow your notes.", cls: "property-hag-summary"});
      const addFilter = filterSection.createEl("button", {text: "+ Add filter", attr: {type: "button"}});
      const filterSummary = filterSection.createEl("p", {cls: "property-hag-summary", attr: {role: "status", "aria-live": "polite"}});
      let filterControls = [];
      const renderFilters = () => {
        filterRows.empty();
        filterControls = s.filters.map((row, index) => {
          row.draft ||= editorDraft("text", "");
          const card = filterRows.createDiv({cls: "property-hag-filter-card"});
          const heading = card.createDiv({cls: "property-hag-filter-heading"});
          heading.createEl("strong", {text: "Condition " + (index + 1)});
          const remove = heading.createEl("button", {text: "Remove", attr: {type: "button", "aria-label": "Remove condition " + (index + 1)}});
          const fields = card.createDiv({cls: "property-hag-form"});
          const name = field(fields, "Filter property", row.property || "");
          const conditionInput = field(fields, "Filter condition", row.condition || "equals", [["equals", "Equals (same type)"], ["contains", "Contains text / list item"], ["exists", "Exists"], ["missing", "Is missing"], ["empty", "Is empty"], ["greater", "Number is greater than"], ["less", "Number is less than"]]);
          suggestProperties(name, propertyNames);
          const editor = typedEditor(card, "Filter value", row.draft, () => {s.conditionManual = false; sync();});
          editor.suggestMatches(() => {
            const values = notes.filter(note => own(note.frontmatter, row.property)).map(note => note.frontmatter[row.property]);
            return row.condition === "contains" ? values.flatMap(value => Array.isArray(value) ? value : [value]) : values;
          });
          const control = {row, name, conditionInput, editor};
          name.addEventListener("input", () => {s.conditionManual = false; sync();});
          conditionInput.addEventListener("change", () => {s.conditionManual = false; sync();});
          remove.addEventListener("click", () => {s.conditionManual = false; s.filters.splice(index, 1); renderFilters(); sync();});
          return control;
        });
        filterMode.parentElement.hidden = !s.filters.length;
        filterEmpty.hidden = !!s.filters.length;
      };
      const search = field(chooseSection, "Search note titles or property text", this.uiState?.search ?? s.query);
      search.parentElement.createEl("small", {text: "Searches titles and the current value of the property chosen above. Property conditions above can match other properties.", cls: "property-hag-summary"});
      search.setAttribute("title", 'Search: ; / OR = either, AND / spaces = both, - / NOT = exclude, "phrase" = exact phrase.');
      const batchSummary = reviewSection.createEl("p", {cls: "property-hag-batch-intent", attr: {role: "status", "aria-live": "polite"}});
      const toolbar = reviewSection.createDiv({ cls: "property-hag-toolbar property-hag-batch-toolbar" });
      const select = toolbar.createEl("button", { text: "Select all filtered", attr: { type: "button" } });
      const clear = toolbar.createEl("button", { text: "Clear selection", attr: { type: "button" } });
      const preview = toolbar.createEl("button", { text: "Preview changes", attr: { type: "button" } });
      const refresh = toolbar.createEl("button", { text: "Refresh", attr: { type: "button", title: "Reload notes and properties; keep only selections that still match" } });
      const summary = reviewSection.createEl("p", { cls: "property-hag-summary", attr: { role: "status" } });
      const outcomeSummary = reviewSection.createDiv({ cls: "property-hag-summary", attr: { role: "status", "aria-live": "polite" } });
      const refreshNotice = reviewSection.createEl("p", { cls: "property-hag-summary", attr: { role: "status" } });
      refreshNotice.hidden = true;
      const container = reviewSection.createDiv({ cls: "property-hag-table-container" });
      const table = container.createEl("table", { cls: "property-hag-table property-hag-workflow-table property-hag-selection-table" });
      const header = table.createEl("thead").createEl("tr");
      const body = table.createEl("tbody");
      const selectionRows = [];
      const selectionTableState = tableUiState(header);
      if (!selectionTableState.sort) selectionTableState.sort = { column: 1, direction: 1 };
      const sortSelectionRows = makeSortable(header, body, selectionRows, ["Select", "Note", "Current value"]);
      let allNotes = s.baselineNotes || snapshot(this.app);
      s.baselineNotes = allNotes;
      let notes = [];
      let filtered = [];
      let previousProperty;
      let matchError = "";
      let valueError = "";
      let filterIssue = "";
      let searchError = "";
      let additionalFilterError = "";
      let previousSelectionCount = s.selected.size;
      let proposedValue;
      let searchUpdate;
      const rowWarnings = new Map();
      valueEditor.suggestItems(() => {
        const values = notes.filter(note => own(note.frontmatter, s.property)).map(note => note.frontmatter[s.property]);
        return ["add", "remove", "replace-item"].includes(s.operation)
          ? values.flatMap(value => Array.isArray(value) ? value : []) : values;
      }, "Existing property values");
      matchEditor.suggestMatches(() => {
        const values = notes.filter(note => own(note.frontmatter, s.property)).map(note => note.frontmatter[s.property]);
        return s.condition === "contains" || s.operation === "replace-item"
          ? values.flatMap(value => Array.isArray(value) ? value : [value]) : values;
      });
      const sync = () => {
        searchUpdate?.cancel();
        previousSelectionCount = s.selected.size;
        if (recursive) s.includeSubfolders = recursive.checked;
        notes = allNotes.filter(note => s.folderPath === undefined || isInFolder(note.file.path, s.folderPath, s.includeSubfolders));
        const allowedPaths = new Set(notes.map(note => note.file.path));
        for (const path of s.selected) if (!allowedPaths.has(path)) s.selected.delete(path);
        const exactName = input => propertyNames.includes(input.value) ? input.value : input.value.trim();
        Object.assign(s, { property: exactName(property), condition: condition.value, operation: operation.value, target: exactName(target), query: search.value });
        s.filterMode = filterMode.value;
        additionalFilterError = "";
        for (const control of filterControls) {
          const {row, name, conditionInput, editor} = control;
          row.property = exactName(name);
          row.condition = conditionInput.value;
          const storedValues = notes.filter(note => own(note.frontmatter, row.property)).map(note => note.frontmatter[row.property]);
          const comparableValues = row.condition === "contains" ? storedValues.flatMap(value => Array.isArray(value) ? value : [value]) : storedValues;
          const kinds = [...new Set(comparableValues.map(valueKind))];
          const numeric = ["greater", "less"].includes(row.condition);
          const allowed = numeric ? ["number"] : row.condition === "contains" ? ["text", "number"] : valueTypes.map(([key]) => key);
          const inferred = numeric ? "number" : kinds.length === 1 && allowed.includes(kinds[0]) ? kinds[0] : null;
          const usesValue = ["equals", "contains", "greater", "less"].includes(row.condition);
          editor.configure(usesValue && !!row.property, allowed);
          if (inferred) editor.suggest(inferred);
          editor.type.parentElement.hidden = !!inferred || !usesValue;
          editor.container.classList.toggle("property-hag-inferred-filter-value", !!inferred);
          editor.type.setAttribute("title", inferred ? "Value type inferred from this property and condition." : "This property has mixed or unknown value types. Choose the type to match.");
          let issue = !row.property ? "Choose a property." : /[\r\n\0]/.test(row.property) ? "Choose a valid property name." : "";
          if (!issue && usesValue) {try {row.typed = editor.read();} catch (e) {issue = e.message;}}
          if (issue && !additionalFilterError) additionalFilterError = "Condition " + (s.filters.indexOf(row) + 1) + ": " + issue;
        }
        filterSummary.textContent = additionalFilterError || (s.filters.length ? "Match " + (s.filterMode === "any" ? "any" : "all") + " of the conditions above." : "");
        if (this.uiState) this.uiState.search = s.query;
        if (!s.conditionManual) {
          s.condition = suggestedFilter(s.operation, s.property);
          condition.value = s.condition;
        }
        const automaticRemoval = !s.conditionManual && !!s.property && s.operation === "remove";
        const kinds = [...new Set(notes.filter(note => own(note.frontmatter, s.property)).map(note => valueKind(note.frontmatter[s.property])).filter(kind => kind !== "empty"))];
        const singleKind = kinds.length === 1 && kinds[0] !== "unsupported" ? kinds[0] : null;
        if (previousProperty !== s.property) {
          // Suggest from existing values; never rewrite any values or property type settings.
          if (singleKind && (previousProperty !== undefined || !s.draftsInitialized)) {
            valueEditor.suggest(singleKind);
            matchEditor.suggest(singleKind);
          }
          previousProperty = s.property;
          s.draftsInitialized = true;
        }
        const inactive = (input, disabled, explanation) => {
          input.disabled = disabled;
          input.parentElement.hidden = disabled;
          input.setAttribute("title", disabled ? explanation : "");
          if (disabled) {
            const suggestions = input.parentElement.querySelector(".property-hag-suggestions");
            if (suggestions) suggestions.hidden = true;
            input.setAttribute("aria-expanded", "false");
          }
        };
        const usesValue = ["create", "set", "replace", "replace-item", "add", "remove"].includes(s.operation);
        const listItemOperation = ["add", "remove", "replace-item"].includes(s.operation);
        for (const option of condition.children) {
          option.disabled = (["greater", "less"].includes(option.value) && (listItemOperation || s.operation === "replace" || (kinds.length > 0 && !kinds.includes("number")))) ||
            (option.value === "contains" && kinds.length > 0 && !kinds.includes("text") && !kinds.includes("list")) ||
            (option.value === "equals" && s.operation === "replace-item");
        }
        filterIssue = Array.from(condition.children).find(option => option.value === s.condition)?.disabled
          ? "This condition does not fit the selected operation or the values in these notes. Choose another condition or operation." : "";
        const usesMatch = (!automaticRemoval && ["equals", "contains", "greater", "less"].includes(s.condition)) || ["replace", "replace-item"].includes(s.operation);
        inactive(target, s.operation !== "rename", "New property name is used only for Rename property.");
        valueEditor.configure(usesValue, listItemOperation ? ["text", "number"] : undefined);
        valueEditor.describe(s.operation);
        form.hidden = !["replace", "replace-item"].includes(s.operation);
        condition.parentElement.hidden = true;
        matchEditor.configure(usesMatch, ["greater", "less"].includes(s.condition) ? ["number"] : s.condition === "contains" || s.operation === "replace-item" ? ["text", "number"] : undefined);
        s.type = valueEditor.type.value;
        matchError = valueError = "";
        if (usesMatch) {
          try { s.matchTyped = matchEditor.read(); }
          catch (e) { matchError = e.message; }
        }
        if (usesValue) {
          try { proposedValue = valueEditor.read(); }
          catch (e) { valueError = e.message; }
        }
        if (automaticRemoval) {
          s.matchTyped = proposedValue;
          matchError = valueError;
        }
        error.textContent = matchError ? `Match value: ${matchError}` : valueError ? `New value: ${valueError}` : "";
        newValues.hidden = !usesValue && s.operation !== "rename";
        const query = compileSearch(s.query);
        searchError = query.error;
        if (query.error) error.textContent = `Search: ${query.error}`;
        if (additionalFilterError) error.textContent = `Property filter: ${additionalFilterError}`;
        filtered = notes.filter(note => {
          const has = own(note.frontmatter, s.property), v = note.frontmatter[s.property];
          const matches = !s.property || s.condition === "all" || ((!matchError || !["equals", "contains", "greater", "less"].includes(s.condition)) &&
            (automaticRemoval || (!s.conditionManual && s.operation === "replace-item") ? has && Array.isArray(v) && v.some(item => equal(item, s.matchTyped)) : matchesValue(has, v, s.condition, s.matchTyped)));
          return matches && !additionalFilterError && matchesAdditionalFilter(note.frontmatter, additionalFilter(s)) && query.matches(`${note.file.basename}\n${text(v)}`);
        });
        const matchingPaths = new Set(filtered.map(note => note.file.path));
        for (const path of s.selected) if (!matchingPaths.has(path)) s.selected.delete(path);
        body.empty();
        selectionRows.length = 0;
        rowWarnings.clear();
        const duplicateNames = duplicateNoteNames(notes.map(note => note.file));
        for (const note of filtered.sort((a, b) => a.file.path.localeCompare(b.file.path))) {
          const row = body.createEl("tr");
          const checkbox = row.createEl("td").createEl("input", { attr: { type: "checkbox", "aria-label": `Select ${note.file.path}` } });
          checkbox.checked = s.selected.has(note.file.path);
          const currentValue = !s.property ? "—" : own(note.frontmatter, s.property) ? typedText(note.frontmatter[s.property]) : "Property missing";
          const noteLabel = s.folderPath !== undefined || duplicateNames.has(note.file.basename) ? note.file.path : note.file.basename;
          const sortableRow = { element: row, keys: [Number(checkbox.checked), noteLabel, currentValue] };
          selectionRows.push(sortableRow);
          checkbox.addEventListener("change", () => {
            if (checkbox.checked) s.selected.add(note.file.path); else s.selected.delete(note.file.path);
            sortableRow.keys[0] = Number(checkbox.checked);
            sortSelectionRows();
            update();
          });
          const noteCell = row.createEl("td");
          noteLink(noteCell, this.app, note.file, s.folderPath !== undefined || duplicateNames.has(note.file.basename));
          const stale = noteCell.createEl("small", { cls: "property-hag-warning property-hag-stale-note" });
          rowWarnings.set(note.file.path, stale);
          row.createEl("td", { text: currentValue });
        }
        sortSelectionRows();
        update();
        if (!filtered.length) {
          const row = body.createEl("tr");
          row.createEl("td", { text: notes.length ? "No files match the current filters." : s.folderPath !== undefined ? "This folder contains no Markdown notes." : "This vault contains no Markdown notes.", attr: { colspan: "3" } });
        }
      };
      const update = () => {
        const live = liveContext(this.app);
        conflictWarnings.empty();
        const messages = [];
        if (filterIssue) messages.push(filterIssue);
        const stale = notes.filter(note => staleReason(note, live));
        if (stale.length) messages.push(`${stale.length} ${stale.length === 1 ? "note needs" : "notes need"} rechecking after changes, moves, deletion or indexing. Choose Refresh to update the list before changing these notes.`);
        const known = new Set(allNotes.map(note => note.file.path));
        const added = [...live.files.keys()].filter(path => !known.has(path) && (s.folderPath === undefined || isInFolder(path, s.folderPath, s.includeSubfolders))).length;
        if (added) messages.push(`${added} new ${added === 1 ? "note is" : "notes are"} available in this scope. Click Refresh to include them.`);
        for (const note of filtered) {
          const warning = rowWarnings.get(note.file.path);
          if (warning) { warning.textContent = friendlyWarning(staleReason(note, live)); warning.hidden = !warning.textContent; }
        }
        if (s.property && ["add", "remove", "replace-item"].includes(s.operation)) {
          const nonLists = notes.filter(note => own(note.frontmatter, s.property) && !Array.isArray(note.frontmatter[s.property])).length;
          if (nonLists) messages.push(`${nonLists} ${nonLists === 1 ? "note stores" : "notes store"} “${s.property}” as a single value rather than a list. To change a single value, choose Set property value. To edit list items, choose a property that contains a list.`);
        }
        const ready = s.property && !additionalFilterError && !searchError && !matchError && !valueError && (s.operation !== "rename" || s.target);
        const selectedPlans = ready ? notes.filter(note => s.selected.has(note.file.path)).map(note => plan(note, s, proposedValue, live)) : [];
        if (ready) {
          const candidates = s.selected.size ? selectedPlans : filtered.map(note => plan(note, s, proposedValue, live));
          const conflicts = new Map();
          if (["set", "replace"].includes(s.operation) && empty(proposedValue)) {
            const clears = candidates.filter(result => result.status === "Changed").length;
            const kind = Array.isArray(proposedValue) ? "an empty list" : proposedValue === null ? "an empty (null) value" : "blank text";
            if (clears) messages.push(`${clears} ${s.selected.size ? "selected" : "matching"} ${clears === 1 ? "note will" : "notes will"} be set to ${kind}. This clears the current value but keeps the property.`);
          }
          if (["add", "replace-item"].includes(s.operation) && proposedValue === "") {
            const blanks = candidates.filter(result => result.status === "Changed").length;
            if (blanks) messages.push(`${blanks} ${s.selected.size ? "selected" : "matching"} ${blanks === 1 ? "note will" : "notes will"} receive a blank-text list item. This keeps an empty item; it does not remove the item.`);
          }
          for (const result of candidates) {
            if (result.status === "Conflict" && !(messages.length && result.reason === "Property is not a list")) conflicts.set(result.reason, (conflicts.get(result.reason) || 0) + 1);
          }
          for (const [reason, count] of conflicts) messages.push(`${count} ${s.selected.size ? "selected" : "matching"} ${count === 1 ? "note" : "notes"}: ${friendlyWarning(reason).replace(/\.$/, "")}.`);
        }
        for (const message of messages) conflictWarnings.createEl("p", { text: message, cls: "property-hag-warning" });
        error.hidden = !error.textContent;
        warnings.hidden = !error.textContent && !messages.length;
        summary.textContent = `${filtered.length} matching notes · ${s.selected.size} selected`;
        if (previousSelectionCount > s.selected.size) {
          refreshNotice.textContent = `${previousSelectionCount - s.selected.size} selections removed because those notes no longer match. Newly matching notes are not selected automatically.`;
          refreshNotice.hidden = false;
        }
        const action = operations.find(([key]) => key === s.operation)?.[1] || "Choose a change";
        const valuePart = ["create", "set", "replace", "replace-item", "add", "remove"].includes(s.operation) && !valueError ? " to " + typedText(proposedValue) : s.operation === "rename" ? " to “" + s.target + "”" : "";
        const chosenFilter = additionalFilter(s);
        batchSummary.textContent = s.property ? action + " “" + s.property + "”" + valuePart + (chosenFilter ? " for notes matching " + (s.filterMode === "any" ? "any of: " : "all of: ") + additionalFilterText(chosenFilter) : " in the chosen scope") + "." : "Choose the notes and a property change, then review your selection.";
        if (s.operation === "create" && s.property) batchSummary.textContent += " Only notes missing this property can change.";
        if (s.operation === "set" && s.property) batchSummary.textContent += " Only notes already containing this property can change.";
        if (s.folderPath !== undefined) batchSummary.textContent += " Folder: " + (s.folderPath || "/") + (s.includeSubfolders ? " (including subfolders)." : " (this folder only).");
        if (s.query) batchSummary.textContent += " Search: “" + s.query + "”.";
        outcomeSummary.empty();
        if (ready) {
          ["Changed", "Skipped", "Conflict"].forEach((status, index) => {
            if (index) outcomeSummary.createEl("span", { text: " · " });
            const count = selectedPlans.filter(p => p.status === status).length;
            outcomeSummary.createEl("span", { text: `${count} ${status === "Changed" ? "would change" : status === "Skipped" ? "would be skipped" : "conflicts"}`, cls: status === "Conflict" && count ? "property-hag-warning" : "" });
          });
        } else outcomeSummary.createEl("span", { text: "Complete the fields to see results for selected notes." });
        select.disabled = !filtered.length || !!searchUpdate?.pending;
        clear.disabled = !s.selected.size;
        let reason = !s.selected.size ? "Select at least one note." : !s.property ? "Enter a property name." : s.operation === "rename" && !s.target ? "Enter a new property name." : "";
        if (!reason) reason = additionalFilterError || filterIssue || matchError || valueError;
        preview.disabled = !!reason || !!searchUpdate?.pending;
        preview.setAttribute("title", reason);
      };
      for (const input of [property, target]) input.addEventListener(input.tagName === "SELECT" ? "change" : "input", sync);
      searchUpdate = debounceSearch(el, sync);
      search._hagDebounce = searchUpdate;
      search.addEventListener("input", () => {
        s.query = search.value;
        if (this.uiState) this.uiState.search = s.query;
        preview.disabled = true;
        select.disabled = true;
        searchUpdate.schedule();
      });
      operation.addEventListener("change", () => { s.conditionManual = false; sync(); });
      condition.addEventListener("change", () => { s.conditionManual = true; sync(); });
      filterMode.addEventListener("change", () => {s.conditionManual = false; sync();});
      addFilter.addEventListener("click", () => {s.conditionManual = false; s.filters.push({property: "", condition: "equals", draft: editorDraft("text", "")}); renderFilters(); sync();});
      recursive?.addEventListener("change", sync);
      const statusUpdate = debounceSearch(el, update);
      watchNoteChanges(this, (event, file) => { markSnapshotEvent(allNotes, event, file); statusUpdate.schedule(); });
      refresh.addEventListener("click", () => {
        statusUpdate.cancel();
        const previous = s.selected.size;
        allNotes = snapshot(this.app);
        s.baselineNotes = allNotes;
        propertyNames.splice(0, propertyNames.length, ...[...new Set(allNotes.flatMap(note => Object.keys(note.frontmatter)))].sort((a, b) => a.localeCompare(b)));
        sync();
        const removed = previous - s.selected.size;
        refreshNotice.textContent = removed ? `Refreshed. ${removed} ${removed === 1 ? "selection was" : "selections were"} removed because those notes no longer match.` : "Refreshed. Your matching selections and inputs were kept.";
        refreshNotice.hidden = false;
      });
      select.addEventListener("click", () => { filtered.forEach(note => s.selected.add(note.file.path)); sync(); });
      clear.addEventListener("click", () => { s.selected.clear(); sync(); });
      preview.addEventListener("click", () => {
        sync();
        try {
          if (!s.property) throw new Error("Enter a property name.");
          if (!s.selected.size) throw new Error("Select at least one matching note.");
          if (s.operation === "rename" && !s.target) throw new Error("Enter a new property name.");
          if (matchError || valueError) throw new Error(matchError || valueError);
          if (filterIssue) throw new Error(filterIssue);
          if (additionalFilterError) throw new Error(additionalFilterError);
          const live = liveContext(this.app);
          const plans = notes.filter(note => s.selected.has(note.file.path)).map(note => plan(note, s, proposedValue, live));
          this.close(); new PreviewModal(this.app, plans, s, () => new BatchModal(this.app, s, this.back).open(), proposedValue).open();
        } catch (e) { error.textContent = friendlyWarning(e.message); }
      });
      renderFilters();
      sync();
    }
  }

  class PreviewModal extends HagModal {
    constructor(app, plans, state, back, value) { super(app); Object.assign(this, { plans, state, back, value }); }
    onOpen() {
      this.setupHeader("Preview changes", this.back);
      const el = this.contentEl;
      const operationText = `${operations.find(([key]) => key === this.state.operation)[1]} · ${this.state.property}${this.state.operation === "rename" ? ` → ${this.state.target}` : ""}`;
      el.createEl("p", { text: operationText, cls: "property-hag-operation-heading" });
      if (additionalFilter(this.state)) el.createEl("p", {text: `Only notes where ${additionalFilterText(additionalFilter(this.state))}`, cls: "property-hag-summary"});
      let applyButton, applied = false;
      const totals = el.createEl("p", { cls: "property-hag-summary" });
      const staleNotice = el.createEl("p", { cls: "property-hag-warning", attr: { role: "status", "aria-live": "polite" } });
      const bind = createTableSearch(el, "Search preview…");
      const container = el.createDiv({ cls: "property-hag-table-container" });
      const table = container.createEl("table", { cls: "property-hag-table property-hag-workflow-table property-hag-preview-table" });
      const header = table.createEl("thead").createEl("tr"), body = table.createEl("tbody"), rows = [];
      const duplicateNames = duplicateNoteNames(this.plans.map(p => p.note.file));
      for (const p of this.plans) {
        const row = body.createEl("tr"); noteLink(row.createEl("td"), this.app, p.note.file, duplicateNames.has(p.note.file.basename));
        const before = row.createEl("td"), after = row.createEl("td");
        if (p.listChange) {
          renderListPreview(before, p.listChange.before, p.listChange.after, "before", p.listChange.missing);
          renderListPreview(after, p.listChange.after, p.listChange.before, "after");
        } else {
          before.textContent = p.current;
          after.textContent = p.proposed;
        }
        row.createEl("td", { text: `${p.status}: ${friendlyWarning(p.reason)}`, cls: p.status === "Conflict" ? "property-hag-warning" : "" });
        rows.push({ element: row, before, after, result: row.lastElementChild || row.children[row.children.length - 1], note: p.note, keys: [p.note.file.basename, p.current, p.proposed, `${p.status}: ${friendlyWarning(p.reason)}`] });
      }
      const sort = makeSortable(header, body, rows, ["Note", "Before", "After", "Result"]);
      const filter = bind(container, rows, row => row.keys.join("\n"), "notes");
      const recheck = () => {
        const live = liveContext(this.app);
        this.plans = rows.map(row => {
          const p = plan(row.note, this.state, this.value, live);
          row.before.empty(); row.after.empty();
          if (p.listChange) {
            renderListPreview(row.before, p.listChange.before, p.listChange.after, "before", p.listChange.missing);
            renderListPreview(row.after, p.listChange.after, p.listChange.before, "after");
          } else { row.before.textContent = p.current; row.after.textContent = p.proposed; }
          row.result.textContent = `${p.status}: ${friendlyWarning(p.reason)}`;
          row.result.classList.toggle("property-hag-warning", p.status === "Conflict");
          row.keys = [row.note.file.basename, p.current, p.proposed, `${p.status}: ${friendlyWarning(p.reason)}`];
          return p;
        });
        totals.empty();
        ["Changed", "Skipped", "Conflict"].forEach((status, index) => {
          if (index) totals.createEl("span", { text: " · " });
          const count = this.plans.filter(p => p.status === status).length;
          totals.createEl("span", { text: `${count} ${status.toLowerCase()}`, cls: status === "Conflict" && count ? "property-hag-warning" : "" });
        });
        const staleCount = rows.filter(row => staleReason(row.note, live)).length;
        staleNotice.textContent = staleCount ? `${staleCount} ${staleCount === 1 ? "note changed or is" : "notes changed or are"} unavailable. Go Back and Refresh before reviewing again.` : "";
        staleNotice.hidden = !staleCount;
        sort?.(); filter();
        const service = writeServices.get(this.app);
        if (applyButton) applyButton.disabled = applied || !service?.ready || service.busy || !this.plans.some(p => p.status === "Changed");
      };
      const statusUpdate = debounceSearch(el, recheck);
      watchNoteChanges(this, (event, file) => { markSnapshotEvent(rows.map(row => row.note), event, file); statusUpdate.schedule(); });
      recheck();
      el.createEl("h3", { text: "Verification" });
      el.createEl("p", { text: "Before saving, Property Hag keeps an original backup and checks that each note still matches your review. It then checks the saved result. Only the chosen property is edited. Notes with property formatting that cannot be edited safely are left for you to review.", cls: "property-hag-warning" });
      const service = writeServices.get(this.app);
      if (!service?.ready) el.createEl("p", {text: friendlyWarning(service?.error) || "Property Hag is not ready to save changes yet. Reload it before applying this batch.", cls: "property-hag-warning"});
      applyButton = el.createEl("button", { text: "Apply changes…", cls: "mod-cta", attr: {type: "button"} });
      applyButton.disabled = !service?.ready || service.busy || !this.plans.some(p => p.status === "Changed");
      applyButton.addEventListener("click", () => {
        if (applyButton.disabled) return;
        recheck();
        const plans = this.plans.filter(p => p.status === "Changed"), count = plans.length;
        if (!count) return;
        this.close();
        new ConfirmBatchModal(this.app, "Confirm Apply", count, `Apply the reviewed changes to ${count} notes. Skipped and conflicting notes will not be changed.`,
          async progress => {
            applied = true;
            const batch = await service.apply(plans, this.state, progress);
            new BatchResultModal(this.app, batch, false, () => {
              delete this.state.baselineNotes; this.state.selected.clear();
              new BatchModal(this.app, this.state).open();
            }).open();
          }, () => new PreviewModal(this.app, this.plans, this.state, this.back, this.value).open(), operationText).open();
      });
    }
  }

  const normalizeSpelling = value => value.trim().toLocaleLowerCase().replace(/[\s_-]+/g, "");
  function oneEditApart(left, right) {
    const a = [...left], b = [...right];
    if (Math.abs(a.length - b.length) > 1 || left === right) return false;
    if (a.length === b.length) {
      const differences = [];
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) differences.push(i);
      if (differences.length === 1) return true;
      if (differences.length !== 2) return false;
      const [i, j] = differences;
      return j === i + 1 && a[i] === b[j] && a[j] === b[i];
    }
    const short = a.length < b.length ? a : b, long = a.length < b.length ? b : a;
    let i = 0, j = 0, skipped = false;
    while (i < short.length && j < long.length) {
      if (short[i] === long[j]) { i++; j++; }
      else { if (skipped) return false; skipped = true; j++; }
    }
    return true;
  }

  function spellingRecord(groups, label, file) {
    const normalized = normalizeSpelling(label);
    // Avoid short words, identifiers, dates, links and long prose.
    if (!/^[\p{L}]{4,64}$/u.test(normalized)) return;
    if (!groups.has(normalized)) groups.set(normalized, { normalized, labels: new Set(), notes: new Map() });
    const group = groups.get(normalized);
    group.labels.add(label);
    group.notes.set(file.path, file);
  }

  function spellingPairs(groups, addPair, budget) {
    const index = new Map();
    const entries = [...groups.values()].sort((a, b) => a.normalized.localeCompare(b.normalized));
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i], letters = [...entry.normalized];
      const signatures = new Set([entry.normalized, ...letters.map((_, j) => letters.slice(0, j).concat(letters.slice(j + 1)).join(""))]);
      const neighbors = new Set();
      for (const signature of signatures) for (const j of index.get(signature) || []) neighbors.add(j);
      for (const j of neighbors) {
        if (budget.checks >= 50000 || budget.findings >= 500) { budget.limited = true; return; }
        budget.checks++;
        if (oneEditApart(entry.normalized, entries[j].normalized)) {
          addPair(entries[j], entry);
          budget.findings++;
        }
      }
      for (const signature of signatures) {
        if (!index.has(signature)) index.set(signature, []);
        index.get(signature).push(i);
      }
    }
  }

  function collectInconsistencies(notes) {
    const findings = [], properties = new Map(), typoNames = new Map();
    for (const note of notes) for (const [name, value] of Object.entries(note.frontmatter)) {
      spellingRecord(typoNames, name, note.file);
      if (!properties.has(name)) properties.set(name, { types: new Set(), variants: new Map(), typoValues: new Map() });
      const info = properties.get(name);
      if (!empty(value)) info.types.add(Array.isArray(value) ? "list" : typeof value);
      const values = Array.isArray(value) ? value : [value];
      for (const v of values) if (typeof v === "string" && v.trim()) {
        const normalized = normalizeSpelling(v);
        if (!info.variants.has(normalized)) info.variants.set(normalized, new Set());
        info.variants.get(normalized).add(v);
        spellingRecord(info.typoValues, v, note.file);
      }
    }
    const names = new Map();
    for (const [name, info] of properties) {
      const normalized = normalizeSpelling(name);
      if (!names.has(normalized)) names.set(normalized, []);
      names.get(normalized).push(name);
      if (info.types.size > 1) findings.push([name, "Mixed value types", [...info.types].join(", ")]);
      for (const variants of info.variants.values()) if (variants.size > 1) {
        const finding = [name, "Value spelling / formatting variants", [...variants].join(" · ")];
        findings.push(finding);
      }
    }
    for (const group of names.values()) if (group.length > 1) {
      const finding = [group.join(" · "), "Similar property names", "Names differ by case, spacing, hyphens or underscores"];
      findings.push(finding);
    }
    const budget = { checks: 0, findings: 0, limited: false };
    const label = group => [...group.labels].sort().map(value => `“${value}”`).join(" / ");
    const usage = group => `${label(group)}: ${group.notes.size} ${group.notes.size === 1 ? "note" : "notes"}`;
    const addTypo = (property, category, a, b) => {
      const finding = [property, category, `${usage(a)}; ${usage(b)}. Similar spelling; review both.`];
      findings.push(finding);
    };
    spellingPairs(typoNames, (a, b) => addTypo(`${label(a)} ↔ ${label(b)}`, "Possible typo in property name", a, b), budget);
    for (const [name, info] of properties) {
      if (budget.limited) break;
      spellingPairs(info.typoValues, (a, b) => addTypo(name, "Possible typo in value", a, b), budget);
    }
    return { findings, limited: budget.limited };
  }

  class AuditModal extends HagModal {
    onOpen() {
      this.restoreGeometry = false;
      this.setupHeader("Find inconsistencies", () => openMenu(this.app));
      this.contentEl.createEl("p", { text: "Read-only checks. Similar names and value variants are suggestions to review, not confirmed errors.", cls: "property-hag-summary" });
      const { findings, limited } = collectInconsistencies(snapshot(this.app));
      if (limited) this.contentEl.createEl("p", { text: "Typo checking reached its size limit. Some possible pairs are omitted; the other checks are complete.", cls: "property-hag-warning" });
      const toolbar = this.contentEl.createDiv({ cls: "property-hag-toolbar" });
      const category = field(toolbar, "Show", this.uiState?.category || "all", [
        ["all", "All inconsistencies"],
        ["Mixed value types", "Mixed value types"],
        ["Similar property names", "Similar property names"],
        ["Value spelling / formatting variants", "Value spelling / formatting variants"],
        ["typos", "Possible typos"],
        ["Possible typo in property name", "Possible typos in property names"],
        ["Possible typo in value", "Possible typos in values"],
      ]);
      const bind = createTableSearch(this.contentEl, "Search findings…");
      const container = this.contentEl.createDiv({ cls: "property-hag-table-container" });
      const table = container.createEl("table", { cls: "property-hag-table property-hag-workflow-table" });
      const header = table.createEl("thead").createEl("tr"), body = table.createEl("tbody");
      const rows = findings.map(keys => {
        const row = body.createEl("tr");
        keys.forEach((value, index) => {
          const cell = row.createEl("td", { text: value, cls: index === 1 ? "property-hag-warning" : "" });

        });
        return { element: row, keys };
      });
      makeSortable(header, body, rows, ["Property", "Finding", "Details"]);
      const filter = bind(container, rows, row => row.keys.join("\n"), "findings",
        row => category.value === "all" || row.keys[1] === category.value || (category.value === "typos" && row.keys[1].startsWith("Possible typo")));
      category.addEventListener("change", () => { if (this.uiState) this.uiState.category = category.value; filter(); });
    }
  }

  class HistoryModal extends HagModal {
    onOpen() {
      this.setupHeader("Batch history / Undo", () => openMenu(this.app));
      const service = writeServices.get(this.app), el = this.contentEl;
      if (!service?.ready) el.createEl("p", {text: friendlyWarning(service?.error) || "Batch history is still loading. Wait a moment, then reopen this screen.", cls: "property-hag-warning"});
      const batches = service?.data.batches || [];
      if (!batches.length) el.createEl("p", {text: "No applied batches yet. Previews do not create history entries."});
      el.createEl("p", {text: "Open a saved batch to review results, inspect original backups, and preview Undo. Only successfully verified changes can be undone.", cls: "property-hag-summary"});
      const bind = createTableSearch(el, "Search history…");
      const container = el.createDiv({cls: "property-hag-table-container"});
      const table = container.createEl("table", {cls: "property-hag-table property-hag-workflow-table"});
      const header = table.createEl("thead").createEl("tr"), body = table.createEl("tbody");
      const rows = batches.map(batch => {
        const row = body.createEl("tr"), title = `${batch.operation} · ${batch.property}`;
        const link = row.createEl("td").createEl("a", {text: title, cls: "internal-link", attr: {href: "#"}});
        link.addEventListener("click", event => {event.preventDefault(); this.close(); new SavedUndoModal(this.app, batch).open();});
        const summary = `${batch.records.filter(r => r.outcome === "verified").length} verified · ${batch.records.filter(r => r.undoStatus === "undone").length} undone · ${batch.status}`;
        row.createEl("td", {text: historyTime(batch.createdAt)}); row.createEl("td", {text: summary});
        return {element: row, keys: [title, batch.createdAt, summary]};
      });
      makeSortable(header, body, rows, ["Batch", "Time", "Results"]); bind(container, rows, row => row.keys.join("\n"), "batches");
      const refresh = el.createEl("button", {text: "Refresh history", attr: {type: "button"}});
      refresh.addEventListener("click", () => {this.close(); new HistoryModal(this.app).open();});
    }
  }
  smokeCore = {WriteService, snapshot, plan, readDocument, patchDocument, readNoteRaw};
  return { BatchModal, PreviewModal, AuditModal, HistoryModal };
};


const workflows = createWorkflows({ HagModal, propertyValueText, makeSortable, createTableSearch,
  openMenu: (app) => new PropertyHagMenuModal(app).open() });

// BEGIN BUNDLED PROPERTY HAG SMOKE
const savePropertyHagReport = (() => { const module = {exports: {}};
'use strict';
module.exports=async function saveReport({text,name,platform,view=globalThis.window}){
 try{
  if(platform!=='mobile'){
   const load=view?.require||view?.parent?.require;
   let remote=view?.electron?.remote;
   if(!remote&&load){remote=load('electron')?.remote;if(!remote){try{remote=load('@electron/remote');}catch{}}}
   if(remote?.dialog?.showSaveDialog){
    const selected=await remote.dialog.showSaveDialog({title:'Save Property Hag diagnostic report',defaultPath:name,filters:[{name:'Markdown',extensions:['md']}],properties:['showOverwriteConfirmation']});
    if(selected.canceled||!selected.filePath)return {cancelled:true};
    if(!load)throw Error('File writing is unavailable in this window.');
    await load('fs').promises.writeFile(selected.filePath,text,'utf8');return {path:selected.filePath};
   }
  }
  if(typeof view?.showSaveFilePicker==='function'){
   const handle=await view.showSaveFilePicker({suggestedName:name,types:[{description:'Markdown',accept:{'text/markdown':['.md']}}]});
   const output=await handle.createWritable();try{await output.write(text);await output.close();}catch(error){await output.abort?.();throw error;}return {path:handle.name||name};
  }
  // Android WebViews may offer the system file-sharing/export sheet instead
  // of the desktop Save As API. Never silently create a vault note instead.
  if(platform==='mobile'&&typeof view?.navigator?.share==='function'&&typeof view.File==='function'){
   const file=new view.File([text],name,{type:'text/markdown'});
   if(view.navigator.canShare&&!view.navigator.canShare({files:[file]}))throw Error('This device cannot export Markdown files through its system picker.');
   await view.navigator.share({files:[file],title:'Property Hag diagnostic report'});return {shared:true};
  }
  throw Error('A system Save As or file-export dialog is unavailable on this device.');
 }catch(error){if(error?.name==='AbortError')return {cancelled:true};throw error;}
};

return module.exports; })();
// Bundled into main.js by scripts/embed-smoke.cjs. Test execution needs no Node or network.
function createPropertyHagSmoke({Modal, HagModal, Platform, core, initialize, search}) {
  const owners = new WeakMap(), active = new WeakMap();
  const equal = (actual, expected, label) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      const error = new Error(label); Object.assign(error, {expected: expected === undefined ? 'undefined' : expected, actual: actual === undefined ? 'undefined' : actual}); throw error;
    }
  };
  const token = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const ledgerPath = plugin => `${plugin.manifest.dir}/smoke-test-pending.json`;
  const safeRoot = root => /^PropertyHag-smoke-\d+-[a-z0-9]+$/.test(root);
  const safeFile = (root, path) => typeof path === 'string' && path.startsWith(root + '/') &&
    !path.slice(root.length + 1).includes('/') && !/[\\\0]/.test(path) && !path.includes('..');

  // Only remove an owned directory after a fresh listing proves it is empty.
  async function cleanup(plugin, ledger) {
    if (!ledger || ledger.schema !== 1 || !safeRoot(ledger.root) || !Array.isArray(ledger.files) ||
        ledger.files.some(path => !safeFile(ledger.root, path))) throw new Error('Unsafe smoke cleanup ledger; nothing removed');
    const vault = plugin.app.vault, errors = [];
    for (const path of ledger.files) {
      try {
        const file = vault.getAbstractFileByPath(path);
        if (file?.children) throw new Error('Expected a temporary file; found a folder, retained');
        if (file) await vault.delete(file);
        else if (await vault.adapter.exists(path)) await vault.adapter.remove(path);
        equal(await vault.adapter.exists(path), false, 'Temporary file removed');
      }
      catch (error) {errors.push(`${path}: ${error.message}`);}
    }
    if (await vault.adapter.exists(ledger.root)) {
      const remaining = await vault.adapter.list(ledger.root);
      if (remaining.files.length || remaining.folders.length) errors.push('Temporary folder contains unexpected or undeleted files; retained');
      // Desktop FileSystemAdapter may reject rmdir(path, false) with EISDIR.
      // Use the cross-platform directory-removal mode only for this verified-empty root.
      else try {await vault.adapter.rmdir(ledger.root, true);} catch (error) {errors.push(error.message);}
    }
    if (!errors.length) {
      if (await vault.adapter.exists(ledgerPath(plugin))) await vault.adapter.remove(ledgerPath(plugin));
      equal(await vault.adapter.exists(ledger.root), false, 'Temporary folder must be absent');
    }
    if (errors.length) throw new Error(errors.join('\n'));
  }
  async function recover(plugin, currentRun = false) {
    if (active.has(plugin.app) && !currentRun) throw new Error('Smoke test still running; cleanup deferred until it finishes');
    const adapter = plugin.app.vault.adapter;
    if (!await adapter.exists(ledgerPath(plugin))) return 'No interrupted test data';
    await cleanup(plugin, JSON.parse(await adapter.read(ledgerPath(plugin))));
    return 'Interrupted test data removed';
  }
  function reportMarkdown(report) {
    const literal = value => JSON.stringify(value, null, 2) ?? 'undefined';
    const fence = value => '\n````text\n' + String(value).replace(/`/g, 'ˋ') + '\n````\n';
    return `# Property Hag local smoke test\n\nVersion: ${report.version}\nPlatform: ${report.platform}\nStarted: ${report.started}\nResult: ${!report.finished ? 'RUNNING' : report.cancelled ? 'CANCELLED' : report.tests.some(t => t.status === 'FAIL') ? 'FAIL' : 'PASS'}\nDuration: ${report.duration ?? 0} ms\nCleanup: ${report.cleanup}\n\n` +
      report.tests.map(t => `## ${t.status}: ${t.name} (${t.duration} ms)\n` +
        (t.error ? fence(t.error) : '') + (t.expected !== undefined ? '\nExpected:' + fence(literal(t.expected)) + '\nActual:' + fence(literal(t.actual)) : '')).join('\n') +
      '\nManual checks still required: visual layout, Android keyboard/touch, rotation, background/foreground, and a real app restart. Reload tests below reinitialize the service, not the app. Failure injection uses scoped facades over real temporary-file I/O. No existing notes or settings are written.\n';
  }
  async function run(plugin, update = () => {}, uiCheck) {
    if (active.has(plugin.app)) throw new Error('A smoke test is already running');
    const report = {version: plugin.manifest.version, platform: Platform?.isAndroidApp ? 'Android' : Platform?.isMobile ? 'Mobile' : 'Desktop',
      started: new Date().toISOString(), tests: [], cleanup: 'Pending'};
    const started = Date.now();
    active.set(plugin.app, report);
    const check = async (name, fn) => {
      const start = Date.now(); const result = {name, status: 'PASS'};
      const cleaning = name.startsWith('Cleanup of every');
      if (report.cancelled && !cleaning) {report.tests.push({name, status: 'SKIP', duration: 0, error: 'Test cancelled'}); update(report); return false;}
      try {await fn();} catch (error) {Object.assign(result, {status: report.cancelled && !cleaning ? 'SKIP' : 'FAIL', error: error.stack || String(error),
        expected: error.expected === undefined ? 'All stated assertions succeed' : error.expected,
        actual: error.actual === undefined ? error.message : error.actual});}
      result.duration = Date.now() - start; report.tests.push(result); update(report);
      return result.status === 'PASS';
    };
    let ledger;
    const real = plugin.app.vault;
    try {
      if (!await check('Initialization, public APIs, and prior-run cleanup', async () => {
        for (const name of ['createFolder', 'create', 'read', 'readBinary', 'process', 'delete', 'getAbstractFileByPath']) equal(typeof real[name], 'function', `Vault.${name}`);
        equal(typeof plugin.app.metadataCache.getFileCache, 'function', 'MetadataCache.getFileCache');
        equal(typeof plugin.saveData, 'function', 'Plugin.saveData');
        equal(typeof plugin.loadData, 'function', 'Plugin.loadData');
        await recover(plugin, true);
      })) return report;
      const root = `PropertyHag-smoke-${token()}`;
      equal(real.getAbstractFileByPath(root) == null, true, 'Unique test directory');
      ledger = {schema: 1, root, files: []};
      await real.adapter.write(ledgerPath(plugin), JSON.stringify(ledger));
      await real.createFolder(root);
      const rawCache = new Map(), files = new Map();
      const guard = path => {
        if (report.cancelled) throw new Error('Smoke test cancelled');
        if (report.stopping) throw new Error('Plugin unloaded; smoke test stopped');
        if (!ledger.files.includes(path) || !safeFile(root, path)) throw new Error('Smoke sandbox blocked path: ' + path);
      };
      const read = async file => {guard(file.path); return core.readNoteRaw(plugin.app, file);};
      const create = async (name, raw) => {
        if (report.cancelled) throw new Error('Smoke test cancelled');
        if (report.stopping) throw new Error('Plugin unloaded; smoke test stopped');
        const path = `${root}/${name}.md`; if (!safeFile(root, path)) throw new Error('Invalid fixture name');
        equal(real.getAbstractFileByPath(path) == null, true, 'Fixture must not overwrite');
        ledger.files.push(path); await real.adapter.write(ledgerPath(plugin), JSON.stringify(ledger));
        const file = await real.create(path, raw); files.set(path, file); rawCache.set(path, raw); return file;
      };
      const faults = {};
      let backupDirectory = false;
      const journal = `${root}/journal.json`, mirror = `${root}/history-backup.json`, backups = `${root}/backups`;
      // Production backup paths use one subdirectory; map these to flat owned files.
      const mapped = path => path.startsWith(backups + '/') ? `${root}/backup-${path.slice(backups.length + 1)}` : path;
      const adapter = {
        exists: async path => path === backups ? backupDirectory : ledger.files.includes(mapped(path)) && real.adapter.exists(mapped(path)),
        mkdir: async path => {equal(path, backups, 'Only sandbox backup directory permitted'); backupDirectory = true;},
        read: async path => {path = mapped(path); guard(path); return real.adapter.read(path);},
        write: async (path, raw) => {
          path = mapped(path);
          if (faults.storage) throw new Error('Injected history storage failure');
          if (path !== mirror && !path.startsWith(root + '/backup-') && path !== journal) throw new Error('Blocked journal path');
          if (!ledger.files.includes(path)) {
            equal(await real.adapter.exists(path), false, 'Journal must not overwrite');
            ledger.files.push(path); await real.adapter.write(ledgerPath(plugin), JSON.stringify(ledger));
          }
          guard(path); await real.adapter.write(path, raw);
        },
      };
      const vault = {
        adapter, getMarkdownFiles: () => [...files.values()],
        getAbstractFileByPath: path => {guard(path); return files.get(path) === real.getAbstractFileByPath(path) ? files.get(path) : null;},
        read,
        readBinary: file => {guard(file.path); return real.readBinary(file);},
        process: async (file, fn) => {
          guard(file.path);
          if (faults.reject === file.path) throw new Error('Injected note write failure');
          if (faults.race === file.path) await real.process(file, () => '---\nstatus: raced\n---\nConcurrent edit\n');
          const output = await real.process(file, fn); rawCache.set(file.path, await read(file));
          if (faults.afterWrite === file.path) throw new Error('Injected error after successful write');
          return output;
        },
      };
      const app = {vault, metadataCache: {getFileCache: file => ({frontmatter: core.readDocument(rawCache.get(file.path)).fm})},
        workspace: {iterateAllLeaves() {}}};
      const isolated = {manifest: {dir: root}, loadData: async () => await adapter.exists(journal) ? JSON.parse(await adapter.read(journal)) : null,
        saveData: data => adapter.write(journal, JSON.stringify(data))};
      let service = await initialize(app, isolated);
      const plan = (file, operation, value, options = {}) => {
        const note = core.snapshot(app).find(n => n.file.path === file.path);
        return core.plan(note, {operation, property: 'status', target: 'state', matchTyped: 'active', ...options}, value);
      };
      const apply = (plans, operation = 'set') => service.apply(plans, {operation, property: 'status'});
      const changeRaw = async (file, raw) => {await real.process(file, () => raw); rawCache.set(file.path, raw);};
      const doc = value => `---\nstatus: ${value}\nunrelated: keep # preserved\n---\nBody [[link]] 🧙\n`;
      await check('Fresh isolated history and platform initialization', async () => {
        equal(service.ready, true, service.error || 'Write engine ready'); equal(service.data.batches, [], 'Fresh history');
        equal(plugin.manifest.isDesktopOnly, false, 'Mobile enabled');
      });
      await check('Obsidian metadata indexing sees temporary properties', async () => {
        const file = await create('index compatibility', doc('active'));
        const deadline = Date.now() + 5000;
        let cache;
        do {
          cache = plugin.app.metadataCache.getFileCache(file);
          if (cache?.frontmatter?.status === 'active') break;
          await new Promise(resolve => setTimeout(resolve, 50));
        } while (Date.now() < deadline);
        equal(cache?.frontmatter?.status, 'active', 'Live metadata cache indexed expected value');
      });
      const cases = [
        ['create', '---\nunrelated: keep\n---\nBody\n', 'active', 'active'],
        ['set', doc('active'), 'done', 'done'], ['rename', doc('active'), undefined, undefined],
        ['replace', doc('active'), 'done', 'done'], ['add', doc('[active, active, work]'), 'new', ['active','active','work','new']],
        ['replace-item', doc('[active, active, work]'), 'done', ['done','done','work']],
        ['remove', doc('[active, active, work]'), 'active', ['work']], ['delete', doc('active'), undefined, undefined],
        ['delete-empty', doc('null'), undefined, undefined],
        ['set', '\uFEFF' + doc('active').replace(/\n/g, '\r\n'), 'done', 'done'],
        ['set', doc('false'), true, true], ['set', doc('0'), 42, 42],
      ];
      for (const [index, [operation, raw, value, expected]] of cases.entries()) await check(`${operation} fixture ${index + 1}: verified Apply, persisted reload, exact Undo`, async () => {
        const file = await create(`${operation}-${index} – 学習 🧙 # [sample]`, raw);
        const batch = await apply([plan(file, operation, value)], operation);
        equal(batch.records[0].outcome, 'verified', 'Apply outcome: ' + batch.records[0].reason);
        const changed = core.readDocument(await read(file));
        equal(changed.fm.status, expected, 'Expected property value');
        if (operation === 'rename') equal(changed.fm.state, 'active', 'Rename destination');
        equal(changed.body, core.readDocument(raw).body, 'Body unchanged');
        service = await initialize(app, isolated); equal(service.ready, true, service.error || 'Reload ready');
        const restoredBatch = service.data.batches.find(b => b.id === batch.id);
        equal(restoredBatch.records[0].beforeRaw, raw, 'Original backup hydrated');
        await service.undo(restoredBatch, restoredBatch.records);
        equal(restoredBatch.records[0].undoStatus, 'undone', 'Undo outcome'); equal(await read(file), raw, 'Exact original bytes');
        await service.undo(restoredBatch, restoredBatch.records); equal(await read(file), raw, 'Repeated Undo leaves note unchanged');
      });
      await check('Bulk partial failure and rejected-promise recovery', async () => {
        const a = await create('bulk A', doc('active')), b = await create('bulk B', doc('active')), c = await create('bulk C', doc('active'));
        faults.reject = b.path; faults.afterWrite = c.path;
        let batch;
        try {batch = await apply([a,b,c].map(f => plan(f, 'set', 'done')));} finally {delete faults.reject; delete faults.afterWrite;}
        equal(batch.records.map(r => r.outcome), ['verified','failed','verified'], 'Partial failure classified by saved bytes');
        equal(await read(b), doc('active'), 'Failed note untouched');
        await service.undo(batch, batch.records); for (const f of [a,b,c]) equal(await read(f), doc('active'), 'Bulk restoration');
      });
      await check('Stale preview, affected-property conflicts, unrelated-edit protection', async () => {
        const file = await create('stale', doc('active')); const old = plan(file, 'set', 'done');
        const later = doc('later'); await changeRaw(file, later);
        const blocked = await apply([old]); equal(blocked.records[0].outcome, 'conflict', 'Stale Apply blocked'); equal(await read(file), later, 'Later content preserved');
        const batch = await apply([plan(file, 'set', 'done')]); await changeRaw(file, doc('another'));
        await service.undo(batch, batch.records); equal(await read(file), doc('another'), 'Conflicting Undo blocked');
        await changeRaw(file, doc('done') + 'Later body edit\n'); await service.undo(batch, batch.records);
        equal(await read(file), doc('later') + 'Later body edit\n', 'Undo preserves unrelated edit');
      });
      await check('Empty notes, duplicate items, type and rename collision protection', async () => {
        const file = await create('empty', ''), list = await create('duplicates', doc('[active, active]'));
        const batch = await apply([plan(file, 'create', 'active')], 'create');
        equal(core.readDocument(await read(file)).fm.status, 'active', 'Empty note Create');
        await service.undo(batch, batch.records); equal(await read(file), '', 'Empty note exact restoration');
        equal(plan(list, 'add', 'active').status, 'Skipped', 'No duplicate addition');
        equal(plan(list, 'set', false).status, 'Conflict', 'Type mismatch blocked');
        equal(plan(list, 'rename', undefined, {target: 'unrelated'}).status, 'Conflict', 'Rename collision blocked');
      });
      await check('Last-moment write race preserves concurrent content', async () => {
        const file = await create('write race', doc('active'));
        const proposed = plan(file, 'set', 'done'); faults.race = file.path;
        let batch;
        try {batch = await apply([proposed]);} finally {delete faults.race;}
        equal(batch.records[0].outcome, 'failed', 'Atomic callback rejected stale source');
        equal(await read(file), '---\nstatus: raced\n---\nConcurrent edit\n', 'Concurrent bytes preserved');
        rawCache.set(file.path, await read(file));
      });
      await check('Malformed YAML and duplicate keys rejected without writes', async () => {
        for (const [index, raw] of ['---\nstatus: [\n---\nBody\n', '---\nstatus: active\nstatus: other\n---\nBody\n'].entries()) {
          const file = await create(`malformed-${index}`, raw); let rejected = false;
          try {core.patchDocument(raw, [{name: 'status', present: true, value: 'done'}]);} catch {rejected = true;}
          equal(rejected, true, 'Unsafe YAML rejected'); equal(await read(file), raw, 'Malformed note untouched');
          files.delete(file.path); // Keep malformed fixtures out of subsequent indexed snapshots.
        }
      });
      await check('Interrupted writes recovered from durable backups without note mutation', async () => {
        const fixtures = [];
        for (const name of ['saved', 'not-saved', 'uncertain']) fixtures.push(await create(`interrupted-${name}`, doc('active')));
        const batch = await apply(fixtures.map(file => plan(file, 'set', 'done')));
        await changeRaw(fixtures[1], doc('active')); await changeRaw(fixtures[2], doc('unknown'));
        for (const record of batch.records) record.outcome = 'writing'; batch.status = 'processing'; await service.persist();
        const before = await Promise.all(fixtures.map(read)); service = await initialize(app, isolated);
        const recovered = service.data.batches.find(b => b.id === batch.id);
        equal(recovered.records.map(r => r.outcome), ['verified','not-applied','uncertain'], 'Interrupted write classifications');
        equal(await Promise.all(fixtures.map(read)), before, 'Recovery is read-only');
        await service.undo(recovered, recovered.records);
        equal(recovered.records[0].undoStatus, 'undone', 'Recovered Undo status: ' + recovered.records[0].reason +
          `; recorded ctime=${recovered.records[0].fileCtime}; live ctime=${fixtures[0].stat?.ctime}`);
        equal(await read(fixtures[0]), doc('active'), 'Recovered Undo exact: ' + recovered.records[0].reason);
        equal(await read(fixtures[2]), doc('unknown'), 'Uncertain write cannot be undone automatically');
      });
      await check('History-storage failure blocks writes before touching notes', async () => {
        const file = await create('storage failure', doc('active')), proposed = plan(file, 'set', 'done');
        faults.storage = true; let rejected = false;
        try {await apply([proposed]);} catch {rejected = true;} finally {delete faults.storage;}
        equal(rejected, true, 'Storage failure reported'); equal(service.ready, false, 'Further writes blocked');
        equal(await read(file), doc('active'), 'No note write before durable journal'); service = await initialize(app, isolated);
      });
      await check('Multiple property filters: All/Any Apply, persisted reload, and exact Undo', async () => {
        for (const mode of ['all', 'any']) {
          const originals = [
            '---\nsubcategory: peer-perspective\nscore: 2\n---\nKeep A\n',
            '---\nsubcategory: other\nscore: 2\n---\nKeep B\n',
            '---\nsubcategory: other\nscore: 0\n---\nKeep C\n',
          ];
          const fixtures = [];
          for (const [index, raw] of originals.entries()) fixtures.push(await create(`filters-${mode}-${index}`, raw));
          const options = {filterMode: mode, filters: [{property: 'subcategory', condition: 'equals', typed: 'peer-perspective'}, {property: 'score', condition: 'greater', typed: 1}]};
          const plans = fixtures.map(file => plan(file, 'create', 'active', options));
          equal(plans.filter(p => p.status === 'Changed').length, mode === 'all' ? 1 : 2, 'Matching notes for ' + mode);
          const batch = await apply(plans, 'create');
          equal(batch.records.filter(r => r.outcome === 'verified').length, mode === 'all' ? 1 : 2, 'Verified writes for ' + mode);
          equal(await read(fixtures[2]), originals[2], 'Nonmatching note untouched');
          service = await initialize(app, isolated);
          const saved = service.data.batches.find(b => b.id === batch.id);
          equal(saved.records[0].filter.mode, mode, 'Persisted filter mode');
          await service.undo(saved, saved.records);
          for (const [index, file] of fixtures.entries()) equal(await read(file), originals[index], 'Exact filtered Undo: ' + index);
        }
      });
      await check('Search operators and invalid-query fail-closed behavior', async () => {
        for (const [query, text, expected] of [['study; research','research',true],['study AND notes','study',false],['study NOT archived','study archived',false],['"study notes"','study other notes',false],['study OR','study',false]]) equal(search(query).matches(text), expected, query);
      });
      if (uiCheck) await check('Modal lifecycle, title, controls, and platform hooks', uiCheck);
      else report.tests.push({name: 'Modal lifecycle (requires live Obsidian UI)', status: 'SKIP', duration: 0});
    } catch (error) {
      await check('Smoke runner setup/execution', () => {throw error;});
    } finally {
      if (ledger) await check('Cleanup of every temporary note, journal, backup, and directory', async () => {
        try {await cleanup(plugin, ledger); report.cleanup = 'PASS — all temporary data removed';}
        catch (error) {report.cleanup = 'FAIL — retained cleanup ledger; retry on next plugin load/test'; throw error;}
      });
      else report.cleanup = report.tests.some(t => t.status === 'FAIL') ? 'No new fixtures; prior cleanup may need attention' : 'No temporary data created';
      report.duration = Date.now() - started; report.finished = true; active.delete(plugin.app); update(report);
    }
    return report;
  }
  async function exportReport(plugin, report, view) {
    if (active.has(plugin.app) || !report?.finished) throw new Error('Wait for testing and cleanup to finish before exporting.');
    return savePropertyHagReport({text: reportMarkdown(report), name: `PropertyHag-diagnostic-${token()}.md`,
      platform: Platform?.isMobile || plugin.app.isMobile ? 'mobile' : 'desktop', view});
  }
  const cancel = app => {const report = active.get(app); if (report) report.cancelled = true;};
  class SmokeModal extends HagModal {
    constructor(plugin) {super(plugin.app); this.plugin = plugin;}
    onOpen() {
      this.setupHeader('Property Hag diagnostics', undefined, false);
      this.modalEl.addClass('property-hag-window-wide');
      const el = this.contentEl;
      const status = el.createEl('p', {attr: {role: 'status', 'aria-live': 'polite'}});
      const bar = el.createDiv({cls: 'property-hag-toolbar'});
      const start = bar.createEl('button', {text: 'Run again', attr: {type: 'button'}});
      const cancelButton = bar.createEl('button', {text: 'Cancel test', attr: {type: 'button'}});
      const exportButton = bar.createEl('button', {text: 'Export Markdown report', attr: {type: 'button'}}); exportButton.disabled = true;
      const output = el.createEl('textarea', {cls: 'property-hag-backup-text', attr: {readonly: '', 'aria-label': 'Smoke-test PASS/FAIL results and detailed errors'}});
      const update = report => {
        this.report = report;
        if (this.closed) return;
        output.value = reportMarkdown(report);
        const running = active.has(this.app);
        status.textContent = `${running ? 'Running' : report.cancelled ? 'Cancelled' : 'Complete'} · ${report.tests.filter(t => t.status === 'PASS').length} PASS · ${report.tests.filter(t => t.status === 'FAIL').length} FAIL · ${report.tests.filter(t => t.status === 'SKIP').length} SKIP · Cleanup: ${report.cleanup}`;
        start.disabled = running; cancelButton.disabled = !running; exportButton.disabled = running || !report.finished;
      };
      const execute = async () => {
        start.disabled = true; exportButton.disabled = true;
        cancelButton.disabled = false; status.textContent = 'Running local functional tests…';
        try {await run(this.plugin, update, async () => {
          const probe = new HagModal(this.app);
          try {
            probe.setupHeader('Smoke probe', () => {}, '', `smoke-probe-${token()}`); probe.open();
            equal(probe.titleEl.textContent, 'Smoke probe', 'Rendered title');
            equal(!!probe.contentEl.querySelector('.property-hag-back'), true, 'Back control');
            equal(probe.modalEl.classList.contains('property-hag-mobile'), !!(Platform?.isMobile || this.app.isMobile), 'Platform layout class');
          } finally {probe.close();}
          equal(probe.containerEl.isConnected, false, 'Modal removed after close');
        });} catch (error) {status.textContent = 'FAIL: ' + error.message;}
        finally {start.disabled = false; cancelButton.disabled = true; exportButton.disabled = !this.report?.finished;}
      };
      start.addEventListener('click', () => {this.runningPromise = execute(); return this.runningPromise;});
      cancelButton.addEventListener('click', () => cancel(this.app));
      exportButton.addEventListener('click', async () => {
        exportButton.disabled = true;
        try {
          const saved = await exportReport(this.plugin, this.report, this.modalEl.ownerDocument.defaultView);
          if (!saved.cancelled) status.textContent = saved.shared ? 'Report exported through the system dialog.' : `Diagnostic report saved: ${saved.path}`;
        }
        catch (error) {status.textContent = `Report export failed: ${error.message}`;}
        finally {exportButton.disabled = active.has(this.app) || !this.report?.finished;}
      });
      this.runningPromise = execute();
    }
    close() {this.closed = true; cancel(this.app); super.close();}
  }
  return {run, recover, cleanup, reportMarkdown, exportReport, stop: cancel, register: plugin => owners.set(plugin.app, plugin),
    open: app => {const plugin = owners.get(app); if (plugin) new SmokeModal(plugin).open();}};
}
const propertyHagSmoke = createPropertyHagSmoke({Modal, HagModal, Platform, core: smokeCore, initialize: (...args) => initializeWrites(...args), search: compileSearch});

// END BUNDLED PROPERTY HAG SMOKE
module.exports = class PropertyHagPlugin extends Plugin {
  async onload() {
    propertyHagSmoke.register(this);
    try {await propertyHagSmoke.recover(this);} catch (error) {new Notice(`Property Hag smoke cleanup needs attention: ${error.message}`, 10000);}
    helpDirectory = this.manifest.dir;
    try {await initializeWrites(this.app, this);}
    catch (error) {writeServices.set(this.app, {ready: false, error: `History could not be loaded: ${error.message}`, data: {batches: []}}); if (Notice) new Notice(`Property Hag: history could not be loaded; writing is blocked. ${error.message}`, 10000);}
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
      if (!(file instanceof TFolder)) return;
      menu.addItem(item => item
        .setTitle("Batch Edit Properties")
        .setIcon("list")
        .onClick(() => new workflows.BatchModal(this.app, {
          folderPath: file.path,
          condition: "all",
          conditionManual: false,
        }).open()));
    }));
    this.addCommand({
      id: "show-vault-properties",
      name: "Open property browser",
      callback: () => new PropertyHagMenuModal(this.app).open(),
    });
    this.addRibbonIcon("list", "Property Hag: Open property browser", () => {
      new PropertyHagMenuModal(this.app).open();
    });
  }
  onunload() {
    propertyHagSmoke.stop(this.app);
    for (const cleanup of [...(mobileViewportCleanups.get(this.app) || [])]) cleanup();
    const service = writeServices.get(this.app);
    if (service) {service.ready = false; service.stopping = true;}
  }
};

/* nosourcemap */
