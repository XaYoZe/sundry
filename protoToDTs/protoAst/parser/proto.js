"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = parse;
exports.parseConstant = parseConstant;
var recursive_descent_parser_1 = require("./recursive-descent-parser");
function parse(text) {
    var parser = (0, recursive_descent_parser_1.createRecursiveDescentParser)(text);
    var statements = acceptStatements(parser, [
        acceptSyntax,
        acceptImport,
        acceptPackage,
        acceptOption,
        acceptMessage,
        acceptEnum,
        acceptExtend,
        acceptService,
        acceptEmpty,
    ]);
    var ast = { statements: statements };
    return { ast: ast, parser: parser };
}
function parseConstant(text) {
    var parser = (0, recursive_descent_parser_1.createRecursiveDescentParser)(text);
    var constant = expectConstant(parser);
    return { ast: constant, parser: parser };
}
function mergeSpans(spans) {
    var start = Infinity;
    var end = -Infinity;
    for (var i = 0; i < spans.length; ++i) {
        if (spans[i] == null)
            continue;
        var span = Array.isArray(spans[i])
            ? mergeSpans(spans[i])
            : spans[i];
        start = Math.min(start, span.start);
        end = Math.max(end, span.end);
    }
    return { start: start, end: end };
}
function acceptPatternAndThen(pattern, then) {
    return function accept(parser) {
        var token = parser.accept(pattern);
        if (!token)
            return;
        return then(token);
    };
}
function choice(acceptFns) {
    return function accept(parser) {
        for (var _i = 0, acceptFns_1 = acceptFns; _i < acceptFns_1.length; _i++) {
            var acceptFn = acceptFns_1[_i];
            var node = acceptFn(parser);
            if (node)
                return node;
        }
    };
}
function many(parser, acceptFn) {
    var nodes = [];
    var node;
    while (node = acceptFn(parser))
        nodes.push(node);
    return nodes;
}
function acceptComplexSequence(parser, expectFnSeq, escapePattern) {
    var result = {};
    var partial = false;
    var hasNewline = false;
    var recoveryPoint;
    for (var _i = 0, expectFnSeq_1 = expectFnSeq; _i < expectFnSeq_1.length; _i++) {
        var _a = expectFnSeq_1[_i], key = _a[0], expectFn = _a[1];
        var loc = parser.loc;
        hasNewline = skipWsAndComments2(parser);
        if (hasNewline && !recoveryPoint) {
            recoveryPoint = { loc: parser.loc, result: __assign({}, result) };
        }
        try {
            result[key] = expectFn(parser);
        }
        catch (_b) {
            parser.loc = loc;
            partial = true;
            if (escapePattern && parser.try(escapePattern))
                break;
        }
    }
    if (partial && recoveryPoint) {
        parser.loc = recoveryPoint.loc;
        return { partial: partial, result: recoveryPoint.result };
    }
    return { partial: partial, result: result };
}
function acceptStatements(parser, acceptStatementFns) {
    var statements = [];
    statements: while (true) {
        var _a = skipWsAndSweepComments(parser), commentGroups = _a.commentGroups, trailingNewline = _a.trailingNewline;
        var leadingComments = void 0;
        var leadingDetachedComments = void 0;
        if (trailingNewline) {
            leadingComments = [];
            leadingDetachedComments = commentGroups;
        }
        else {
            if (commentGroups.length < 1) {
                leadingComments = [];
                leadingDetachedComments = [];
            }
            else {
                leadingComments = [commentGroups.pop()];
                leadingDetachedComments = commentGroups;
            }
        }
        for (var _i = 0, acceptStatementFns_1 = acceptStatementFns; _i < acceptStatementFns_1.length; _i++) {
            var acceptStatementFn = acceptStatementFns_1[_i];
            var statement = acceptStatementFn(parser, leadingComments, leadingDetachedComments);
            if (statement) {
                statements.push(statement);
                continue statements;
            }
        }
        break;
    }
    return statements;
}
var whitespacePattern = /^\s+/;
var whitespaceWithoutNewlinePattern = /^[ \f\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/;
var newlinePattern = /^\r?\n/;
var multilineCommentPattern = /^\/\*(?:.|\r?\n)*?\*\//;
var singlelineCommentPattern = /^\/\/.*(?:\r?\n|$)/;
var intLitPattern = /^0(?:x[0-9a-f]+|[0-7]*)|^[1-9]\d*/i;
var floatLitPattern = /^\d+\.\d*(?:e[-+]?\d+)?|^\d+e[-+]?\d+|^\.\d+(?:e[-+]?\d+)?|^inf|^nan/i;
var boolLitPattern = /^true|^false/;
var strLitPattern = /^'(?:\\x[0-9a-f]{2}|\\[0-7]{3}|\\[0-7]|\\[abfnrtv\\\?'"]|[^'\0\n\\])*'|^"(?:\\x[0-9a-f]{2}|\\[0-7]{3}|\\[0-7]|\\[abfnrtv\\\?'"]|[^"\0\n\\])*"/i;
var identPattern = /^[a-z_][a-z0-9_]*/i;
var messageBodyStatementKeywordPattern = /^(?:enum|message|extend|extensions|group|option|oneof|map|reserved)\b/;
var acceptDot = acceptPatternAndThen(".", function (dot) { return (__assign({ type: "dot" }, dot)); });
var acceptComma = acceptPatternAndThen(",", function (comma) { return (__assign({ type: "comma" }, comma)); });
var acceptSemi = acceptPatternAndThen(";", function (semi) { return (__assign({ type: "semi" }, semi)); });
function expectSemi(parser) {
    var semi = acceptSemi(parser);
    if (semi)
        return semi;
    throw new recursive_descent_parser_1.SyntaxError(parser, [";"]);
}
var acceptIdent = acceptPatternAndThen(identPattern, function (ident) { return (__assign({ type: "ident" }, ident)); });
function acceptSpecialToken(parser, type, pattern) {
    if (pattern === void 0) { pattern = identPattern; }
    var token = parser.accept(pattern);
    if (!token)
        return;
    return __assign({ type: type }, token);
}
function acceptKeyword(parser, pattern) {
    if (pattern === void 0) { pattern = identPattern; }
    return acceptSpecialToken(parser, "keyword", pattern);
}
function acceptCommentGroup(parser) {
    var loc = parser.loc;
    var comments = [];
    while (true) {
        var whitespace = parser.accept(whitespaceWithoutNewlinePattern);
        if (whitespace)
            continue;
        var multilineComment = acceptSpecialToken(parser, "multiline-comment", multilineCommentPattern);
        if (multilineComment) {
            comments.push(multilineComment);
            continue;
        }
        var singlelineComment = acceptSpecialToken(parser, "singleline-comment", singlelineCommentPattern);
        if (singlelineComment) {
            comments.push(singlelineComment);
            continue;
        }
        break;
    }
    if (comments.length < 1) {
        parser.loc = loc;
        return;
    }
    return __assign(__assign({}, mergeSpans(comments)), { type: "comment-group", comments: comments });
}
function acceptTrailingComments(parser) {
    var loc = parser.loc;
    var comments = [];
    while (true) {
        var whitespace = parser.accept(whitespaceWithoutNewlinePattern);
        if (whitespace)
            continue;
        var newline = parser.accept(newlinePattern);
        if (newline)
            break;
        var multilineComment = acceptSpecialToken(parser, "multiline-comment", multilineCommentPattern);
        if (multilineComment) {
            comments.push(multilineComment);
            continue;
        }
        var singlelineComment = acceptSpecialToken(parser, "singleline-comment", singlelineCommentPattern);
        if (singlelineComment) {
            comments.push(singlelineComment);
            break;
        }
        break;
    }
    if (comments.length < 1) {
        parser.loc = loc;
        return [];
    }
    return [__assign(__assign({}, mergeSpans(comments)), { type: "comment-group", comments: comments })];
}
function skipWsAndSweepComments(parser) {
    var commentGroups = [];
    var trailingNewline = false;
    parser.accept(whitespacePattern);
    while (true) {
        var commentGroup = acceptCommentGroup(parser);
        if (commentGroup) {
            commentGroups.push(commentGroup);
            trailingNewline = false;
            continue;
        }
        var whitespace = parser.accept(whitespaceWithoutNewlinePattern);
        if (whitespace)
            continue;
        var newline = parser.accept(newlinePattern);
        if (newline) {
            trailingNewline = true;
            continue;
        }
        break;
    }
    return {
        commentGroups: commentGroups,
        trailingNewline: trailingNewline,
    };
}
function skipWsAndComments(parser) {
    while (true) {
        var whitespace = parser.accept(whitespacePattern);
        if (whitespace)
            continue;
        var multilineComment = acceptSpecialToken(parser, "multiline-comment", multilineCommentPattern);
        if (multilineComment)
            continue;
        var singlelineComment = acceptSpecialToken(parser, "singleline-comment", singlelineCommentPattern);
        if (singlelineComment)
            continue;
        break;
    }
    return;
}
function skipWsAndComments2(parser) {
    var hasNewline = false;
    while (true) {
        var whitespace = parser.accept(whitespaceWithoutNewlinePattern);
        if (whitespace)
            continue;
        var newline = parser.accept(newlinePattern);
        if (newline) {
            hasNewline = true;
            continue;
        }
        var multilineComment = acceptSpecialToken(parser, "multiline-comment", multilineCommentPattern);
        if (multilineComment)
            continue;
        var singlelineComment = acceptSpecialToken(parser, "singleline-comment", singlelineCommentPattern);
        if (singlelineComment) {
            hasNewline = true;
            continue;
        }
        break;
    }
    return hasNewline;
}
function acceptFullIdent(parser) {
    var identOrDots = many(parser, choice([
        acceptDot,
        acceptIdent,
    ]));
    if (identOrDots.length < 1)
        return;
    return __assign(__assign({}, mergeSpans(identOrDots)), { type: "full-ident", identOrDots: identOrDots });
}
function expectFullIdent(parser) {
    var fullIdent = acceptFullIdent(parser);
    if (fullIdent)
        return fullIdent;
    throw new recursive_descent_parser_1.SyntaxError(parser, [".", identPattern]);
}
function acceptType(parser) {
    var identOrDots = many(parser, choice([
        acceptDot,
        acceptIdent,
    ]));
    if (identOrDots.length < 1)
        return;
    return __assign(__assign({}, mergeSpans(identOrDots)), { type: "type", identOrDots: identOrDots });
}
function expectType(parser) {
    var type = acceptType(parser);
    if (type)
        return type;
    throw new recursive_descent_parser_1.SyntaxError(parser, [".", identPattern]);
}
function acceptIntLit(parser) {
    var intLit = parser.accept(intLitPattern);
    if (!intLit)
        return;
    return __assign({ type: "int-lit" }, intLit);
}
function expectIntLit(parser) {
    var intLit = acceptIntLit(parser);
    if (intLit)
        return intLit;
    throw new recursive_descent_parser_1.SyntaxError(parser, [intLitPattern]);
}
function acceptSignedIntLit(parser) {
    var _a;
    var loc = parser.loc;
    var sign = (_a = parser.accept("-")) !== null && _a !== void 0 ? _a : parser.accept("+");
    var intLit = acceptIntLit(parser);
    if (!intLit) {
        parser.loc = loc;
        return;
    }
    return __assign(__assign({}, mergeSpans([sign, intLit])), { type: "signed-int-lit", sign: sign, value: intLit });
}
function expectSignedIntLit(parser) {
    var signedIntLit = acceptSignedIntLit(parser);
    if (signedIntLit)
        return signedIntLit;
    throw new recursive_descent_parser_1.SyntaxError(parser, ["-", intLitPattern]);
}
function acceptFloatLit(parser) {
    var floatLit = parser.accept(floatLitPattern);
    if (!floatLit)
        return;
    return __assign({ type: "float-lit" }, floatLit);
}
function acceptSignedFloatLit(parser) {
    var _a;
    var loc = parser.loc;
    var sign = (_a = parser.accept("-")) !== null && _a !== void 0 ? _a : parser.accept("+");
    var floatLit = acceptFloatLit(parser);
    if (!floatLit) {
        parser.loc = loc;
        return;
    }
    return __assign(__assign({}, mergeSpans([sign, floatLit])), { type: "signed-float-lit", sign: sign, value: floatLit });
}
function acceptBoolLit(parser) {
    var boolLit = parser.accept(boolLitPattern);
    if (!boolLit)
        return;
    return __assign({ type: "bool-lit" }, boolLit);
}
function acceptStrLit(parser) {
    var strLit = parser.accept(strLitPattern);
    if (!strLit)
        return;
    var tokens = [strLit];
    while (true) {
        skipWsAndComments(parser);
        var strLit_1 = parser.accept(strLitPattern);
        if (!strLit_1)
            break;
        tokens.push(strLit_1);
    }
    return __assign(__assign({}, mergeSpans(tokens)), { type: "str-lit", tokens: tokens });
}
function expectStrLit(parser) {
    var strLit = acceptStrLit(parser);
    if (strLit)
        return strLit;
    throw new recursive_descent_parser_1.SyntaxError(parser, [strLitPattern]);
}
// https://github.com/protocolbuffers/protobuf/blob/c2148566c7/src/google/protobuf/compiler/parser.cc#L1429-L1452
function acceptAggregate(parser) {
    var parenthesisOpen = parser.accept("{");
    if (!parenthesisOpen)
        return;
    var character = parenthesisOpen;
    var depth = 1;
    while (character = parser.expect(/^(?:\s|\S)/)) {
        switch (character.text) {
            case "{":
                ++depth;
                break;
            case "}":
                --depth;
                break;
        }
        if (depth === 0) {
            break;
        }
    }
    return __assign(__assign({}, mergeSpans([parenthesisOpen, character])), { type: "aggregate" });
}
function acceptConstant(parser) {
    var _a, _b, _c, _d, _e;
    return (_e = (_d = (_c = (_b = (_a = acceptSignedFloatLit(parser)) !== null && _a !== void 0 ? _a : acceptSignedIntLit(parser)) !== null && _b !== void 0 ? _b : acceptStrLit(parser)) !== null && _c !== void 0 ? _c : acceptBoolLit(parser)) !== null && _d !== void 0 ? _d : acceptFullIdent(parser)) !== null && _e !== void 0 ? _e : acceptAggregate(parser);
}
function expectConstant(parser) {
    var constant = acceptConstant(parser);
    if (constant)
        return constant;
    throw new recursive_descent_parser_1.SyntaxError(parser, [
        identPattern,
        "-",
        "+",
        intLitPattern,
        strLitPattern,
        boolLitPattern,
    ]);
}
function acceptOptionNameSegment(parser) {
    var bracketOpen = parser.accept("(");
    var name = acceptFullIdent(parser);
    if (!name) {
        if (bracketOpen)
            throw new recursive_descent_parser_1.SyntaxError(parser, [identPattern]);
        return;
    }
    var bracketClose = parser[bracketOpen ? "expect" : "accept"](")");
    return __assign(__assign({}, mergeSpans([bracketOpen, name, bracketClose])), { type: "option-name-segment", bracketOpen: bracketOpen, name: name, bracketClose: bracketClose });
}
function acceptOptionName(parser) {
    var optionNameSegmentOrDots = many(parser, choice([
        acceptDot,
        acceptOptionNameSegment,
    ]));
    if (optionNameSegmentOrDots.length < 1)
        return;
    return __assign(__assign({}, mergeSpans(optionNameSegmentOrDots)), { type: "option-name", optionNameSegmentOrDots: optionNameSegmentOrDots });
}
function expectOptionName(parser) {
    var optionName = acceptOptionName(parser);
    if (optionName)
        return optionName;
    throw new recursive_descent_parser_1.SyntaxError(parser, ["(", identPattern]);
}
function acceptSyntax(parser, leadingComments, leadingDetachedComments) {
    var keyword = acceptKeyword(parser, "syntax");
    if (!keyword)
        return;
    skipWsAndComments(parser);
    var eq = parser.expect("=");
    skipWsAndComments(parser);
    var quoteOpen = parser.expect(/^['"]/);
    var syntax = parser.expect(/^[^'"]+/);
    var quoteClose = parser.expect(/^['"]/);
    skipWsAndComments(parser);
    var semi = expectSemi(parser);
    var trailingComments = acceptTrailingComments(parser);
    return __assign(__assign({}, mergeSpans([
        leadingDetachedComments,
        leadingComments,
        keyword,
        semi,
        trailingComments,
    ])), { leadingComments: leadingComments, trailingComments: trailingComments, leadingDetachedComments: leadingDetachedComments, type: "syntax", keyword: keyword, eq: eq, quoteOpen: quoteOpen, syntax: syntax, quoteClose: quoteClose, semi: semi });
}
function acceptImport(parser, leadingComments, leadingDetachedComments) {
    var keyword = acceptKeyword(parser, "import");
    if (!keyword)
        return;
    skipWsAndComments(parser);
    var weakOrPublic = parser.accept(/^weak|^public/);
    skipWsAndComments(parser);
    var strLit = expectStrLit(parser);
    skipWsAndComments(parser);
    var semi = expectSemi(parser);
    var trailingComments = acceptTrailingComments(parser);
    return __assign(__assign({}, mergeSpans([
        leadingDetachedComments,
        leadingComments,
        keyword,
        semi,
        trailingComments,
    ])), { leadingComments: leadingComments, trailingComments: trailingComments, leadingDetachedComments: leadingDetachedComments, type: "import", keyword: keyword, weakOrPublic: weakOrPublic, strLit: strLit, semi: semi });
}
function acceptPackage(parser, leadingComments, leadingDetachedComments) {
    var keyword = acceptKeyword(parser, "package");
    if (!keyword)
        return;
    skipWsAndComments(parser);
    var fullIdent = expectFullIdent(parser);
    skipWsAndComments(parser);
    var semi = expectSemi(parser);
    var trailingComments = acceptTrailingComments(parser);
    return __assign(__assign({}, mergeSpans([
        leadingDetachedComments,
        leadingComments,
        keyword,
        semi,
        trailingComments,
    ])), { leadingComments: leadingComments, trailingComments: trailingComments, leadingDetachedComments: leadingDetachedComments, type: "package", keyword: keyword, fullIdent: fullIdent, semi: semi });
}
function acceptOption(parser, leadingComments, leadingDetachedComments) {
    var keyword = acceptKeyword(parser, /^option\b/);
    if (!keyword)
        return;
    skipWsAndComments(parser);
    var optionName = expectOptionName(parser);
    skipWsAndComments(parser);
    var eq = parser.expect("=");
    skipWsAndComments(parser);
    var constant = expectConstant(parser);
    skipWsAndComments(parser);
    var semi = expectSemi(parser);
    var trailingComments = acceptTrailingComments(parser);
    return __assign(__assign({}, mergeSpans([
        leadingDetachedComments,
        leadingComments,
        keyword,
        semi,
        trailingComments,
    ])), { leadingComments: leadingComments, trailingComments: trailingComments, leadingDetachedComments: leadingDetachedComments, type: "option", keyword: keyword, optionName: optionName, eq: eq, constant: constant, semi: semi });
}
function acceptEmpty(parser, leadingComments, leadingDetachedComments) {
    var semi = acceptSemi(parser);
    if (!semi)
        return;
    var trailingComments = acceptTrailingComments(parser);
    return __assign(__assign({}, mergeSpans([
        leadingDetachedComments,
        leadingComments,
        semi,
        trailingComments,
    ])), { leadingComments: leadingComments, trailingComments: trailingComments, leadingDetachedComments: leadingDetachedComments, type: "empty", semi: semi });
}
function acceptFieldOption(parser) {
    var optionName = acceptOptionName(parser);
    if (!optionName)
        return;
    skipWsAndComments(parser);
    var eq = parser.expect("=");
    skipWsAndComments(parser);
    var constant = expectConstant(parser);
    return __assign(__assign({}, mergeSpans([optionName, constant])), { type: "field-option", optionName: optionName, eq: eq, constant: constant });
}
function acceptFieldOptions(parser) {
    var bracketOpen = parser.accept("[");
    if (!bracketOpen)
        return;
    var fieldOptionOrCommas = many(parser, choice([
        skipWsAndComments,
        acceptComma,
        acceptFieldOption,
    ]));
    var bracketClose = parser.expect("]");
    return __assign(__assign({}, mergeSpans([bracketOpen, bracketClose])), { type: "field-options", bracketOpen: bracketOpen, fieldOptionOrCommas: fieldOptionOrCommas, bracketClose: bracketClose });
}
function acceptEnumField(parser, leadingComments, leadingDetachedComments) {
    var fieldName = parser.accept(identPattern);
    if (!fieldName)
        return;
    skipWsAndComments(parser);
    var eq = parser.expect("=");
    skipWsAndComments(parser);
    var fieldNumber = expectSignedIntLit(parser);
    skipWsAndComments(parser);
    var fieldOptions = acceptFieldOptions(parser);
    skipWsAndComments(parser);
    var semi = expectSemi(parser);
    var trailingComments = acceptTrailingComments(parser);
    return __assign(__assign({}, mergeSpans([
        leadingDetachedComments,
        leadingComments,
        fieldName,
        semi,
        trailingComments,
    ])), { leadingComments: leadingComments, trailingComments: trailingComments, leadingDetachedComments: leadingDetachedComments, type: "enum-field", fieldName: fieldName, eq: eq, fieldNumber: fieldNumber, fieldOptions: fieldOptions, semi: semi });
}
function expectEnumBody(parser) {
    var bracketOpen = parser.expect("{");
    var statements = acceptStatements(parser, [
        acceptOption,
        acceptReserved,
        acceptEnumField,
        acceptEmpty,
    ]);
    var bracketClose = parser.expect("}");
    return __assign(__assign({}, mergeSpans([bracketOpen, bracketClose])), { type: "enum-body", bracketOpen: bracketOpen, statements: statements, bracketClose: bracketClose });
}
function acceptEnum(parser, leadingComments, leadingDetachedComments) {
    var keyword = acceptKeyword(parser, "enum");
    if (!keyword)
        return;
    skipWsAndComments(parser);
    var enumName = parser.expect(identPattern);
    skipWsAndComments(parser);
    var enumBody = expectEnumBody(parser);
    var trailingComments = acceptTrailingComments(parser);
    return __assign(__assign({}, mergeSpans([
        leadingDetachedComments,
        leadingComments,
        keyword,
        enumBody,
        trailingComments,
    ])), { leadingComments: leadingComments, trailingComments: trailingComments, leadingDetachedComments: leadingDetachedComments, type: "enum", keyword: keyword, enumName: enumName, enumBody: enumBody });
}
function acceptField(parser, leadingComments, leadingDetachedComments) {
    var loc = parser.loc;
    var fieldLabel = acceptKeyword(parser, /^required|^optional|^repeated/);
    skipWsAndComments(parser);
    var fieldType = acceptType(parser);
    if (!fieldType) {
        parser.loc = loc;
        return;
    }
    var rest = acceptComplexSequence(parser, [
        ["fieldName", function (parser) { return parser.expect(identPattern); }],
        ["eq", function (parser) { return parser.expect("="); }],
        ["fieldNumber", expectIntLit],
        ["fieldOptions", acceptFieldOptions],
        ["semi", expectSemi],
    ], messageBodyStatementKeywordPattern);
    var trailingComments = rest.result.semi
        ? acceptTrailingComments(parser)
        : [];
    var type = rest.partial ? "malformed-field" : "field";
    return __assign(__assign(__assign({}, mergeSpans([
        leadingDetachedComments,
        leadingComments,
        fieldLabel,
        fieldType,
        rest.result.semi,
        trailingComments,
    ])), { leadingComments: leadingComments, trailingComments: trailingComments, leadingDetachedComments: leadingDetachedComments, type: type, fieldLabel: fieldLabel, fieldType: fieldType }), rest.result);
}
function acceptOneofField(parser, leadingComments, leadingDetachedComments) {
    var fieldType = acceptType(parser);
    if (!fieldType)
        return;
    skipWsAndComments(parser);
    var fieldName = parser.expect(identPattern);
    skipWsAndComments(parser);
    var eq = parser.expect("=");
    skipWsAndComments(parser);
    var fieldNumber = expectIntLit(parser);
    skipWsAndComments(parser);
    var fieldOptions = acceptFieldOptions(parser);
    skipWsAndComments(parser);
    var semi = expectSemi(parser);
    var trailingComments = acceptTrailingComments(parser);
    return __assign(__assign({}, mergeSpans([
        leadingDetachedComments,
        leadingComments,
        fieldType,
        semi,
        trailingComments,
    ])), { leadingComments: leadingComments, trailingComments: trailingComments, leadingDetachedComments: leadingDetachedComments, type: "oneof-field", fieldType: fieldType, fieldName: fieldName, eq: eq, fieldNumber: fieldNumber, fieldOptions: fieldOptions, semi: semi });
}
function acceptMapField(parser, leadingComments, leadingDetachedComments) {
    var keyword = acceptKeyword(parser, "map");
    if (!keyword)
        return;
    skipWsAndComments(parser);
    var typeBracketOpen = parser.expect("<");
    skipWsAndComments(parser);
    var keyType = expectType(parser);
    skipWsAndComments(parser);
    var typeSep = parser.expect(",");
    skipWsAndComments(parser);
    var valueType = expectType(parser);
    skipWsAndComments(parser);
    var typeBracketClose = parser.expect(">");
    skipWsAndComments(parser);
    var mapName = parser.expect(identPattern);
    skipWsAndComments(parser);
    var eq = parser.expect("=");
    skipWsAndComments(parser);
    var fieldNumber = expectIntLit(parser);
    skipWsAndComments(parser);
    var fieldOptions = acceptFieldOptions(parser);
    skipWsAndComments(parser);
    var semi = expectSemi(parser);
    var trailingComments = acceptTrailingComments(parser);
    return __assign(__assign({}, mergeSpans([
        leadingDetachedComments,
        leadingComments,
        keyword,
        semi,
        trailingComments,
    ])), { leadingComments: leadingComments, trailingComments: trailingComments, leadingDetachedComments: leadingDetachedComments, type: "map-field", keyword: keyword, typeBracketOpen: typeBracketOpen, keyType: keyType, typeSep: typeSep, valueType: valueType, typeBracketClose: typeBracketClose, mapName: mapName, eq: eq, fieldNumber: fieldNumber, fieldOptions: fieldOptions, semi: semi });
}
function expectOneofBody(parser) {
    var bracketOpen = parser.expect("{");
    var statements = acceptStatements(parser, [
        acceptOneofGroup,
        acceptOption,
        acceptOneofField,
        acceptEmpty,
    ]);
    var bracketClose = parser.expect("}");
    return __assign(__assign({}, mergeSpans([bracketOpen, bracketClose])), { type: "oneof-body", bracketOpen: bracketOpen, statements: statements, bracketClose: bracketClose });
}
function acceptOneof(parser, leadingComments, leadingDetachedComments) {
    var keyword = acceptKeyword(parser, "oneof");
    if (!keyword)
        return;
    skipWsAndComments(parser);
    var oneofName = parser.expect(identPattern);
    skipWsAndComments(parser);
    var oneofBody = expectOneofBody(parser);
    var trailingComments = acceptTrailingComments(parser);
    return __assign(__assign({}, mergeSpans([
        leadingDetachedComments,
        leadingComments,
        keyword,
        oneofBody,
        trailingComments,
    ])), { leadingComments: leadingComments, trailingComments: trailingComments, leadingDetachedComments: leadingDetachedComments, type: "oneof", keyword: keyword, oneofName: oneofName, oneofBody: oneofBody });
}
var acceptMax = acceptPatternAndThen("max", function (max) { return (__assign({ type: "max" }, max)); });
function acceptRange(parser) {
    var _a;
    var rangeStart = acceptIntLit(parser);
    if (!rangeStart)
        return;
    skipWsAndComments(parser);
    var to = acceptKeyword(parser, "to");
    if (!to) {
        return {
            start: rangeStart.start,
            end: rangeStart.end,
            type: "range",
            rangeStart: rangeStart,
        };
    }
    skipWsAndComments(parser);
    var rangeEnd = (_a = acceptIntLit(parser)) !== null && _a !== void 0 ? _a : acceptMax(parser);
    if (!rangeEnd)
        throw new recursive_descent_parser_1.SyntaxError(parser, [intLitPattern, "max"]);
    return __assign(__assign({}, mergeSpans([rangeStart, rangeEnd])), { type: "range", rangeStart: rangeStart, to: to, rangeEnd: rangeEnd });
}
function expectRanges(parser) {
    var rangeOrCommas = many(parser, choice([
        skipWsAndComments,
        acceptComma,
        acceptRange,
    ]));
    return __assign(__assign({}, mergeSpans(rangeOrCommas)), { type: "ranges", rangeOrCommas: rangeOrCommas });
}
function acceptExtensions(parser, leadingComments, leadingDetachedComments) {
    var keyword = acceptKeyword(parser, "extensions");
    if (!keyword)
        return;
    skipWsAndComments(parser);
    var ranges = expectRanges(parser);
    skipWsAndComments(parser);
    var semi = expectSemi(parser);
    var trailingComments = acceptTrailingComments(parser);
    return __assign(__assign({}, mergeSpans([
        leadingDetachedComments,
        leadingComments,
        keyword,
        semi,
        trailingComments,
    ])), { leadingComments: leadingComments, trailingComments: trailingComments, leadingDetachedComments: leadingDetachedComments, type: "extensions", keyword: keyword, ranges: ranges, semi: semi });
}
function expectFieldNames(parser) {
    var strLitOrCommas = many(parser, choice([
        skipWsAndComments,
        acceptComma,
        acceptStrLit,
    ]));
    return __assign(__assign({}, mergeSpans(strLitOrCommas)), { type: "field-names", strLitOrCommas: strLitOrCommas });
}
function acceptReserved(parser, leadingComments, leadingDetachedComments) {
    var keyword = acceptKeyword(parser, "reserved");
    if (!keyword)
        return;
    skipWsAndComments(parser);
    var reserved = parser.try(intLitPattern)
        ? expectRanges(parser)
        : expectFieldNames(parser);
    skipWsAndComments(parser);
    var semi = expectSemi(parser);
    var trailingComments = acceptTrailingComments(parser);
    return __assign(__assign({}, mergeSpans([
        leadingDetachedComments,
        leadingComments,
        keyword,
        semi,
        trailingComments,
    ])), { leadingComments: leadingComments, trailingComments: trailingComments, leadingDetachedComments: leadingDetachedComments, type: "reserved", keyword: keyword, reserved: reserved, semi: semi });
}
function expectExtendBody(parser) {
    var bracketOpen = parser.expect("{");
    var statements = acceptStatements(parser, [
        acceptGroup,
        acceptField,
        acceptEmpty,
    ]);
    var bracketClose = parser.expect("}");
    return __assign(__assign({}, mergeSpans([bracketOpen, bracketClose])), { type: "extend-body", bracketOpen: bracketOpen, statements: statements, bracketClose: bracketClose });
}
function acceptExtend(parser, leadingComments, leadingDetachedComments) {
    var keyword = acceptKeyword(parser, "extend");
    if (!keyword)
        return;
    skipWsAndComments(parser);
    var messageType = expectType(parser);
    skipWsAndComments(parser);
    var extendBody = expectExtendBody(parser);
    var trailingComments = acceptTrailingComments(parser);
    return __assign(__assign({}, mergeSpans([
        leadingDetachedComments,
        leadingComments,
        keyword,
        extendBody,
        trailingComments,
    ])), { leadingComments: leadingComments, trailingComments: trailingComments, leadingDetachedComments: leadingDetachedComments, type: "extend", keyword: keyword, messageType: messageType, extendBody: extendBody });
}
function acceptGroup(parser, leadingComments, leadingDetachedComments) {
    var loc = parser.loc;
    var groupLabel = acceptKeyword(parser, /^required|^optional|^repeated/);
    if (!groupLabel) {
        parser.loc = loc;
        return;
    }
    skipWsAndComments(parser);
    var keyword = acceptKeyword(parser, "group");
    if (!keyword) {
        parser.loc = loc;
        return;
    }
    skipWsAndComments(parser);
    var groupName = parser.expect(identPattern);
    skipWsAndComments(parser);
    var eq = parser.expect("=");
    skipWsAndComments(parser);
    var fieldNumber = expectIntLit(parser);
    skipWsAndComments(parser);
    var fieldOptions = acceptFieldOptions(parser);
    skipWsAndComments(parser);
    var messageBody = expectMessageBody(parser);
    var trailingComments = acceptTrailingComments(parser);
    return __assign(__assign({}, mergeSpans([
        leadingDetachedComments,
        leadingComments,
        groupLabel,
        messageBody,
        trailingComments,
    ])), { leadingComments: leadingComments, trailingComments: trailingComments, leadingDetachedComments: leadingDetachedComments, type: "group", groupLabel: groupLabel, keyword: keyword, groupName: groupName, eq: eq, fieldNumber: fieldNumber, fieldOptions: fieldOptions, messageBody: messageBody });
}
function acceptOneofGroup(parser, leadingComments, leadingDetachedComments) {
    var keyword = acceptKeyword(parser, "group");
    if (!keyword)
        return;
    skipWsAndComments(parser);
    var groupName = parser.expect(identPattern);
    skipWsAndComments(parser);
    var eq = parser.expect("=");
    skipWsAndComments(parser);
    var fieldNumber = expectIntLit(parser);
    skipWsAndComments(parser);
    var messageBody = expectMessageBody(parser);
    var trailingComments = acceptTrailingComments(parser);
    return __assign(__assign({}, mergeSpans([
        leadingDetachedComments,
        leadingComments,
        keyword,
        messageBody,
        trailingComments,
    ])), { leadingComments: leadingComments, trailingComments: trailingComments, leadingDetachedComments: leadingDetachedComments, type: "oneof-group", keyword: keyword, groupName: groupName, eq: eq, fieldNumber: fieldNumber, messageBody: messageBody });
}
function expectMessageBody(parser) {
    var bracketOpen = parser.expect("{");
    var statements = acceptStatements(parser, [
        acceptGroup,
        acceptEnum,
        acceptMessage,
        acceptExtend,
        acceptExtensions,
        acceptOption,
        acceptOneof,
        acceptMapField,
        acceptReserved,
        acceptField,
        acceptEmpty,
    ]);
    var bracketClose = parser.expect("}");
    return __assign(__assign({}, mergeSpans([bracketOpen, bracketClose])), { type: "message-body", bracketOpen: bracketOpen, statements: statements, bracketClose: bracketClose });
}
function acceptMessage(parser, leadingComments, leadingDetachedComments) {
    var keyword = acceptKeyword(parser, "message");
    if (!keyword)
        return;
    skipWsAndComments(parser);
    var messageName = parser.expect(identPattern);
    skipWsAndComments(parser);
    var messageBody = expectMessageBody(parser);
    var trailingComments = acceptTrailingComments(parser);
    return __assign(__assign({}, mergeSpans([
        leadingDetachedComments,
        leadingComments,
        keyword,
        messageBody,
        trailingComments,
    ])), { leadingComments: leadingComments, trailingComments: trailingComments, leadingDetachedComments: leadingDetachedComments, type: "message", keyword: keyword, messageName: messageName, messageBody: messageBody });
}
function expectRpcType(parser) {
    var bracketOpen = parser.expect("(");
    skipWsAndComments(parser);
    var stream = acceptKeyword(parser, "stream");
    skipWsAndComments(parser);
    var messageType = expectType(parser);
    skipWsAndComments(parser);
    var bracketClose = parser.expect(")");
    return __assign(__assign({}, mergeSpans([bracketOpen, bracketClose])), { bracketOpen: bracketOpen, stream: stream, messageType: messageType, bracketClose: bracketClose });
}
function acceptRpc(parser, leadingComments, leadingDetachedComments) {
    var _a;
    var keyword = acceptKeyword(parser, "rpc");
    if (!keyword)
        return;
    skipWsAndComments(parser);
    var rpcName = parser.expect(identPattern);
    skipWsAndComments(parser);
    var reqType = expectRpcType(parser);
    skipWsAndComments(parser);
    var returns = parser.expect("returns");
    skipWsAndComments(parser);
    var resType = expectRpcType(parser);
    skipWsAndComments(parser);
    var semiOrRpcBody = (_a = acceptSemi(parser)) !== null && _a !== void 0 ? _a : expectRpcBody(parser);
    var trailingComments = acceptTrailingComments(parser);
    return __assign(__assign({}, mergeSpans([
        leadingDetachedComments,
        leadingComments,
        keyword,
        semiOrRpcBody,
        trailingComments,
    ])), { leadingComments: leadingComments, trailingComments: trailingComments, leadingDetachedComments: leadingDetachedComments, type: "rpc", keyword: keyword, rpcName: rpcName, reqType: reqType, returns: returns, resType: resType, semiOrRpcBody: semiOrRpcBody });
}
function expectRpcBody(parser) {
    var bracketOpen = parser.expect("{");
    var statements = acceptStatements(parser, [
        acceptOption,
        acceptEmpty,
    ]);
    var bracketClose = parser.expect("}");
    return __assign(__assign({}, mergeSpans([bracketOpen, bracketClose])), { type: "rpc-body", bracketOpen: bracketOpen, statements: statements, bracketClose: bracketClose });
}
function expectServiceBody(parser) {
    var bracketOpen = parser.expect("{");
    var statements = acceptStatements(parser, [
        acceptOption,
        acceptRpc,
        acceptEmpty,
    ]);
    var bracketClose = parser.expect("}");
    return __assign(__assign({}, mergeSpans([bracketOpen, bracketClose])), { type: "service-body", bracketOpen: bracketOpen, statements: statements, bracketClose: bracketClose });
}
function acceptService(parser, leadingComments, leadingDetachedComments) {
    var keyword = acceptKeyword(parser, "service");
    if (!keyword)
        return;
    skipWsAndComments(parser);
    var serviceName = parser.expect(identPattern);
    skipWsAndComments(parser);
    var serviceBody = expectServiceBody(parser);
    var trailingComments = acceptTrailingComments(parser);
    return __assign(__assign({}, mergeSpans([
        leadingDetachedComments,
        leadingComments,
        keyword,
        serviceBody,
        trailingComments,
    ])), { leadingComments: leadingComments, trailingComments: trailingComments, leadingDetachedComments: leadingDetachedComments, type: "service", keyword: keyword, serviceName: serviceName, serviceBody: serviceBody });
}
