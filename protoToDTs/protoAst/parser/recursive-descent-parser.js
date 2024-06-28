"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyntaxError = exports.eof = void 0;
exports.createRecursiveDescentParser = createRecursiveDescentParser;
exports.eof = Symbol("<EOF>");
function createRecursiveDescentParser(input, config) {
    var debug = !!(config === null || config === void 0 ? void 0 : config.debug);
    var cnt = 0;
    var lines = input.split("\n");
    var parser = {
        input: input,
        loc: 0,
        offsetToColRow: function (offset) { return offsetToColRow(lines, offset); },
        colRowToOffset: function (colRow) { return colRowToOffset(lines, colRow); },
        getAroundText: function (loc, length, window) {
            return getAroundText(lines, loc, length, window);
        },
        try: function (pattern) {
            var loc = parser.loc;
            try {
                return parser.accept(pattern);
            }
            finally {
                parser.loc = loc;
            }
        },
        accept: function (pattern) {
            cnt++;
            if (cnt > input.length * 5)
                throw "infinite loop";
            if (pattern === exports.eof)
                return acceptEof();
            if (typeof pattern === "string")
                return acceptString(pattern);
            return acceptRegex(pattern);
        },
        expect: function (acceptPattern, expectedPatterns, mistakePatterns) {
            var result = parser.accept(acceptPattern);
            var _expectedPatterns = (expectedPatterns
                ? __spreadArray([acceptPattern], expectedPatterns, true) : [acceptPattern]);
            if (result == null) {
                throw new SyntaxError(parser, _expectedPatterns, mistakePatterns);
            }
            else {
                return result;
            }
        },
    };
    function acceptEof() {
        if (parser.loc < input.length)
            return;
        return { start: parser.loc, end: parser.loc, text: "" };
    }
    function acceptString(pattern) {
        var start = parser.loc;
        var end = start + pattern.length;
        var text = input.slice(start, end);
        if (text !== pattern)
            return;
        parser.loc = end;
        debug && console.log(text);
        return { start: start, end: end, text: text };
    }
    function acceptRegex(pattern) {
        pattern.lastIndex = 0;
        var execArray = pattern.exec(input.substr(parser.loc));
        if (execArray == null)
            return;
        var text = execArray[0];
        var start = parser.loc + execArray.index;
        var end = start + text.length;
        parser.loc = end;
        debug && console.log(text);
        return { start: start, end: end, text: text };
    }
    return parser;
}
var SyntaxError = /** @class */ (function (_super) {
    __extends(SyntaxError, _super);
    function SyntaxError(parser, expectedPatterns, mistakePatterns) {
        if (mistakePatterns === void 0) { mistakePatterns = []; }
        var _this = _super.call(this) || this;
        _this.parser = parser;
        _this.expectedPatterns = expectedPatterns;
        _this.mistakePatterns = mistakePatterns;
        var colRow = _this.colRow;
        var got = _this.got;
        var length = got === exports.eof ? 1 : got.length;
        var expectedPatternsText = expectedPatterns.map(patternToString).join(" or ");
        _this.message = ("at line ".concat(colRow.row + 1, ", column ").concat(colRow.col + 1, ":\n\n") +
            "expected ".concat(expectedPatternsText, ", got ").concat(patternToString(got), "\n\n") +
            parser.getAroundText(parser.loc, length));
        return _this;
    }
    Object.defineProperty(SyntaxError.prototype, "got", {
        get: function () {
            var parser = this.parser;
            for (var _i = 0, _a = this.mistakePatterns; _i < _a.length; _i++) {
                var mistakePattern = _a[_i];
                var token = parser.try(mistakePattern);
                if (token)
                    return token.text;
            }
            return parser.input.charAt(parser.loc) || exports.eof;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SyntaxError.prototype, "colRow", {
        get: function () {
            return this.parser.offsetToColRow(this.parser.loc);
        },
        enumerable: false,
        configurable: true
    });
    return SyntaxError;
}(Error));
exports.SyntaxError = SyntaxError;
function patternToString(pattern) {
    if (pattern === exports.eof)
        return "<EOF>";
    if (typeof pattern === "string")
        return JSON.stringify(pattern);
    return pattern.toString();
}
function offsetToColRow(lines, offset) {
    var row = 0;
    var col = 0;
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (offset < line.length + 1) {
            row = i;
            col = offset;
            break;
        }
        offset -= line.length + 1;
    }
    return { col: col, row: row };
}
function colRowToOffset(lines, _a) {
    var col = _a.col, row = _a.row;
    var offset = 0;
    for (var i = 0; i < row; i++) {
        offset += lines[i].length + 1;
    }
    return offset + col;
}
function getAroundText(lines, loc, length, window) {
    if (length === void 0) { length = 1; }
    if (window === void 0) { window = 5; }
    var colRow = offsetToColRow(lines, loc);
    var headCount = Math.min(1, (window >> 1) + (window % 2));
    var tailCount = window >> 1;
    var headStart = Math.max(0, colRow.row - headCount - 1);
    var headEnd = colRow.row + 1;
    var tailStart = colRow.row + 1;
    var tailEnd = colRow.row + tailCount + 1;
    var heads = lines.slice(headStart, headEnd);
    var tails = lines.slice(tailStart, tailEnd);
    var lineNumberDigitCount = tailEnd.toString().length;
    var headTexts = heads.map(function (line, index) {
        var lineNumber = index + headStart + 1;
        var lineNumberText = lineNumber.toString().padStart(lineNumberDigitCount + 1);
        return lineNumberText + " | " + line;
    }).join("\n");
    var tailTexts = tails.map(function (line, index) {
        var lineNumber = index + tailStart + 1;
        var lineNumberText = lineNumber.toString().padStart(lineNumberDigitCount + 1);
        return lineNumberText + " | " + line;
    }).join("\n");
    return [
        headTexts,
        (new Array(lineNumberDigitCount + 1 + 1)).join(" ") + " | " +
            (new Array(colRow.col + 1)).join(" ") +
            (new Array(length + 1)).join("^"),
        tailTexts,
    ].join("\n");
}
