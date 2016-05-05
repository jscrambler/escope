'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ScopeManager = exports.Scope = exports.Variable = exports.Reference = exports.version = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; }; /*
                                                                                                                                                                                                                                                    Copyright (C) 2012-2014 Yusuke Suzuki <utatane.tea@gmail.com>
                                                                                                                                                                                                                                                    Copyright (C) 2013 Alex Seville <hi@alexanderseville.com>
                                                                                                                                                                                                                                                    Copyright (C) 2014 Thiago de Arruda <tpadilha84@gmail.com>
                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                    Redistribution and use in source and binary forms, with or without
                                                                                                                                                                                                                                                    modification, are permitted provided that the following conditions are met:
                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                      * Redistributions of source code must retain the above copyright
                                                                                                                                                                                                                                                        notice, this list of conditions and the following disclaimer.
                                                                                                                                                                                                                                                      * Redistributions in binary form must reproduce the above copyright
                                                                                                                                                                                                                                                        notice, this list of conditions and the following disclaimer in the
                                                                                                                                                                                                                                                        documentation and/or other materials provided with the distribution.
                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
                                                                                                                                                                                                                                                    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
                                                                                                                                                                                                                                                    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
                                                                                                                                                                                                                                                    ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
                                                                                                                                                                                                                                                    DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
                                                                                                                                                                                                                                                    (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
                                                                                                                                                                                                                                                    LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
                                                                                                                                                                                                                                                    ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
                                                                                                                                                                                                                                                    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
                                                                                                                                                                                                                                                    THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
                                                                                                                                                                                                                                                  */

/**
 * Escope (<a href="http://github.com/estools/escope">escope</a>) is an <a
 * href="http://www.ecma-international.org/publications/standards/Ecma-262.htm">ECMAScript</a>
 * scope analyzer extracted from the <a
 * href="http://github.com/estools/esmangle">esmangle project</a/>.
 * <p>
 * <em>escope</em> finds lexical scopes in a source program, i.e. areas of that
 * program where different occurrences of the same identifier refer to the same
 * variable. With each scope the contained variables are collected, and each
 * identifier reference in code is linked to its corresponding variable (if
 * possible).
 * <p>
 * <em>escope</em> works on a syntax tree of the parsed source code which has
 * to adhere to the <a
 * href="https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API">
 * Mozilla Parser API</a>. E.g. <a href="http://esprima.org">esprima</a> is a parser
 * that produces such syntax trees.
 * <p>
 * The main interface is the {@link analyze} function.
 * @module escope
 */

/*jslint bitwise:true */

exports.analyze = analyze;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _reference = require('./reference');

var _reference2 = _interopRequireDefault(_reference);

var _referencer = require('./referencer');

var _referencer2 = _interopRequireDefault(_referencer);

var _scope = require('./scope');

var _scope2 = _interopRequireDefault(_scope);

var _scopeManager = require('./scope-manager');

var _scopeManager2 = _interopRequireDefault(_scopeManager);

var _variable = require('./variable');

var _variable2 = _interopRequireDefault(_variable);

var _package = require('../package.json');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function defaultOptions() {
    return {
        optimistic: false,
        directive: false,
        nodejsScope: false,
        impliedStrict: false,
        sourceType: 'script', // one of ['script', 'module']
        ecmaVersion: 5,
        instrumentTree: false,
        childVisitorKeys: null,
        fallback: 'iteration'
    };
}

function updateDeeply(target, override) {
    var key, val;

    function isHashObject(target) {
        return (typeof target === 'undefined' ? 'undefined' : _typeof(target)) === 'object' && target instanceof Object && !(target instanceof Array) && !(target instanceof RegExp);
    }

    for (key in override) {
        if (override.hasOwnProperty(key)) {
            val = override[key];
            if (isHashObject(val)) {
                if (isHashObject(target[key])) {
                    updateDeeply(target[key], val);
                } else {
                    target[key] = updateDeeply({}, val);
                }
            } else {
                target[key] = val;
            }
        }
    }
    return target;
}

/**
 * Main interface function. Takes an Esprima syntax tree and returns the
 * analyzed scopes.
 * @function analyze
 * @param {esprima.Tree} tree
 * @param {Object} providedOptions - Options that tailor the scope analysis
 * @param {boolean} [providedOptions.optimistic=false] - the optimistic flag
 * @param {boolean} [providedOptions.directive=false]- the directive flag
 * @param {boolean} [providedOptions.ignoreEval=false]- whether to check 'eval()' calls
 * @param {boolean} [providedOptions.nodejsScope=false]- whether the whole
 * script is executed under node.js environment. When enabled, escope adds
 * a function scope immediately following the global scope.
 * @param {boolean} [providedOptions.impliedStrict=false]- implied strict mode
 * (if ecmaVersion >= 5).
 * @param {string} [providedOptions.sourceType='script']- the source type of the script. one of 'script' and 'module'
 * @param {number} [providedOptions.ecmaVersion=5]- which ECMAScript version is considered
 * @param {Object} [providedOptions.childVisitorKeys=null] - Additional known visitor keys. See [esrecurse](https://github.com/estools/esrecurse)'s the `childVisitorKeys` option.
 * @param {string} [providedOptions.fallback='iteration'] - A kind of the fallback in order to encounter with unknown node. See [esrecurse](https://github.com/estools/esrecurse)'s the `fallback` option.
 * @return {ScopeManager}
 */
function analyze(tree, providedOptions) {
    var scopeManager, referencer, options;

    options = updateDeeply(defaultOptions(), providedOptions);

    scopeManager = new _scopeManager2.default(options);

    referencer = new _referencer2.default(options, scopeManager);
    referencer.visit(tree);

    (0, _assert2.default)(scopeManager.__currentScope === null, 'currentScope should be null.');

    return scopeManager;
}

exports.
/** @name module:escope.version */
version = _package.version;
exports.
/** @name module:escope.Reference */
Reference = _reference2.default;
exports.
/** @name module:escope.Variable */
Variable = _variable2.default;
exports.
/** @name module:escope.Scope */
Scope = _scope2.default;
exports.
/** @name module:escope.ScopeManager */
ScopeManager = _scopeManager2.default;

/* vim: set sw=4 ts=4 et tw=80 : */
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztRQXFIZ0IsTyxHQUFBLE87O0FBbkVoQjs7OztBQUVBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBLFNBQVMsY0FBVCxHQUEwQjtBQUN0QixXQUFPO0FBQ0gsb0JBQVksS0FEVDtBQUVILG1CQUFXLEtBRlI7QUFHSCxxQkFBYSxLQUhWO0FBSUgsdUJBQWUsS0FKWjtBQUtILG9CQUFZLFFBTFQsRTtBQU1ILHFCQUFhLENBTlY7QUFPSCx3QkFBZ0IsS0FQYjtBQVFILDBCQUFrQixJQVJmO0FBU0gsa0JBQVU7QUFUUCxLQUFQO0FBV0g7O0FBRUQsU0FBUyxZQUFULENBQXNCLE1BQXRCLEVBQThCLFFBQTlCLEVBQXdDO0FBQ3BDLFFBQUksR0FBSixFQUFTLEdBQVQ7O0FBRUEsYUFBUyxZQUFULENBQXNCLE1BQXRCLEVBQThCO0FBQzFCLGVBQU8sUUFBTyxNQUFQLHlDQUFPLE1BQVAsT0FBa0IsUUFBbEIsSUFBOEIsa0JBQWtCLE1BQWhELElBQTBELEVBQUUsa0JBQWtCLEtBQXBCLENBQTFELElBQXdGLEVBQUUsa0JBQWtCLE1BQXBCLENBQS9GO0FBQ0g7O0FBRUQsU0FBSyxHQUFMLElBQVksUUFBWixFQUFzQjtBQUNsQixZQUFJLFNBQVMsY0FBVCxDQUF3QixHQUF4QixDQUFKLEVBQWtDO0FBQzlCLGtCQUFNLFNBQVMsR0FBVCxDQUFOO0FBQ0EsZ0JBQUksYUFBYSxHQUFiLENBQUosRUFBdUI7QUFDbkIsb0JBQUksYUFBYSxPQUFPLEdBQVAsQ0FBYixDQUFKLEVBQStCO0FBQzNCLGlDQUFhLE9BQU8sR0FBUCxDQUFiLEVBQTBCLEdBQTFCO0FBQ0gsaUJBRkQsTUFFTztBQUNILDJCQUFPLEdBQVAsSUFBYyxhQUFhLEVBQWIsRUFBaUIsR0FBakIsQ0FBZDtBQUNIO0FBQ0osYUFORCxNQU1PO0FBQ0gsdUJBQU8sR0FBUCxJQUFjLEdBQWQ7QUFDSDtBQUNKO0FBQ0o7QUFDRCxXQUFPLE1BQVA7QUFDSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXNCTSxTQUFTLE9BQVQsQ0FBaUIsSUFBakIsRUFBdUIsZUFBdkIsRUFBd0M7QUFDM0MsUUFBSSxZQUFKLEVBQWtCLFVBQWxCLEVBQThCLE9BQTlCOztBQUVBLGNBQVUsYUFBYSxnQkFBYixFQUErQixlQUEvQixDQUFWOztBQUVBLG1CQUFlLDJCQUFpQixPQUFqQixDQUFmOztBQUVBLGlCQUFhLHlCQUFlLE9BQWYsRUFBd0IsWUFBeEIsQ0FBYjtBQUNBLGVBQVcsS0FBWCxDQUFpQixJQUFqQjs7QUFFQSwwQkFBTyxhQUFhLGNBQWIsS0FBZ0MsSUFBdkMsRUFBNkMsOEJBQTdDOztBQUVBLFdBQU8sWUFBUDtBQUNIOzs7O0FBSUcsTzs7O0FBRUEsUzs7O0FBRUEsUTs7O0FBRUEsSzs7O0FBRUEsWSIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gIENvcHlyaWdodCAoQykgMjAxMi0yMDE0IFl1c3VrZSBTdXp1a2kgPHV0YXRhbmUudGVhQGdtYWlsLmNvbT5cbiAgQ29weXJpZ2h0IChDKSAyMDEzIEFsZXggU2V2aWxsZSA8aGlAYWxleGFuZGVyc2V2aWxsZS5jb20+XG4gIENvcHlyaWdodCAoQykgMjAxNCBUaGlhZ28gZGUgQXJydWRhIDx0cGFkaWxoYTg0QGdtYWlsLmNvbT5cblxuICBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAgbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG5cbiAgICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0XG4gICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gICAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodFxuICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZVxuICAgICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cblxuICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIlxuICBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFXG4gIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFXG4gIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCA8Q09QWVJJR0hUIEhPTERFUj4gQkUgTElBQkxFIEZPUiBBTllcbiAgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVNcbiAgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTO1xuICBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkRcbiAgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbiAgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GXG4gIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4qL1xuXG4vKipcbiAqIEVzY29wZSAoPGEgaHJlZj1cImh0dHA6Ly9naXRodWIuY29tL2VzdG9vbHMvZXNjb3BlXCI+ZXNjb3BlPC9hPikgaXMgYW4gPGFcbiAqIGhyZWY9XCJodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvcHVibGljYXRpb25zL3N0YW5kYXJkcy9FY21hLTI2Mi5odG1cIj5FQ01BU2NyaXB0PC9hPlxuICogc2NvcGUgYW5hbHl6ZXIgZXh0cmFjdGVkIGZyb20gdGhlIDxhXG4gKiBocmVmPVwiaHR0cDovL2dpdGh1Yi5jb20vZXN0b29scy9lc21hbmdsZVwiPmVzbWFuZ2xlIHByb2plY3Q8L2EvPi5cbiAqIDxwPlxuICogPGVtPmVzY29wZTwvZW0+IGZpbmRzIGxleGljYWwgc2NvcGVzIGluIGEgc291cmNlIHByb2dyYW0sIGkuZS4gYXJlYXMgb2YgdGhhdFxuICogcHJvZ3JhbSB3aGVyZSBkaWZmZXJlbnQgb2NjdXJyZW5jZXMgb2YgdGhlIHNhbWUgaWRlbnRpZmllciByZWZlciB0byB0aGUgc2FtZVxuICogdmFyaWFibGUuIFdpdGggZWFjaCBzY29wZSB0aGUgY29udGFpbmVkIHZhcmlhYmxlcyBhcmUgY29sbGVjdGVkLCBhbmQgZWFjaFxuICogaWRlbnRpZmllciByZWZlcmVuY2UgaW4gY29kZSBpcyBsaW5rZWQgdG8gaXRzIGNvcnJlc3BvbmRpbmcgdmFyaWFibGUgKGlmXG4gKiBwb3NzaWJsZSkuXG4gKiA8cD5cbiAqIDxlbT5lc2NvcGU8L2VtPiB3b3JrcyBvbiBhIHN5bnRheCB0cmVlIG9mIHRoZSBwYXJzZWQgc291cmNlIGNvZGUgd2hpY2ggaGFzXG4gKiB0byBhZGhlcmUgdG8gdGhlIDxhXG4gKiBocmVmPVwiaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9TcGlkZXJNb25rZXkvUGFyc2VyX0FQSVwiPlxuICogTW96aWxsYSBQYXJzZXIgQVBJPC9hPi4gRS5nLiA8YSBocmVmPVwiaHR0cDovL2VzcHJpbWEub3JnXCI+ZXNwcmltYTwvYT4gaXMgYSBwYXJzZXJcbiAqIHRoYXQgcHJvZHVjZXMgc3VjaCBzeW50YXggdHJlZXMuXG4gKiA8cD5cbiAqIFRoZSBtYWluIGludGVyZmFjZSBpcyB0aGUge0BsaW5rIGFuYWx5emV9IGZ1bmN0aW9uLlxuICogQG1vZHVsZSBlc2NvcGVcbiAqL1xuXG4vKmpzbGludCBiaXR3aXNlOnRydWUgKi9cblxuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5pbXBvcnQgUmVmZXJlbmNlIGZyb20gJy4vcmVmZXJlbmNlJztcbmltcG9ydCBSZWZlcmVuY2VyIGZyb20gJy4vcmVmZXJlbmNlcic7XG5pbXBvcnQgU2NvcGUgZnJvbSAnLi9zY29wZSc7XG5pbXBvcnQgU2NvcGVNYW5hZ2VyIGZyb20gJy4vc2NvcGUtbWFuYWdlcic7XG5pbXBvcnQgVmFyaWFibGUgZnJvbSAnLi92YXJpYWJsZSc7XG5pbXBvcnQgeyB2ZXJzaW9uIH0gZnJvbSAnLi4vcGFja2FnZS5qc29uJztcblxuZnVuY3Rpb24gZGVmYXVsdE9wdGlvbnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgb3B0aW1pc3RpYzogZmFsc2UsXG4gICAgICAgIGRpcmVjdGl2ZTogZmFsc2UsXG4gICAgICAgIG5vZGVqc1Njb3BlOiBmYWxzZSxcbiAgICAgICAgaW1wbGllZFN0cmljdDogZmFsc2UsXG4gICAgICAgIHNvdXJjZVR5cGU6ICdzY3JpcHQnLCAgLy8gb25lIG9mIFsnc2NyaXB0JywgJ21vZHVsZSddXG4gICAgICAgIGVjbWFWZXJzaW9uOiA1LFxuICAgICAgICBpbnN0cnVtZW50VHJlZTogZmFsc2UsXG4gICAgICAgIGNoaWxkVmlzaXRvcktleXM6IG51bGwsXG4gICAgICAgIGZhbGxiYWNrOiAnaXRlcmF0aW9uJ1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZURlZXBseSh0YXJnZXQsIG92ZXJyaWRlKSB7XG4gICAgdmFyIGtleSwgdmFsO1xuXG4gICAgZnVuY3Rpb24gaXNIYXNoT2JqZWN0KHRhcmdldCkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHRhcmdldCA9PT0gJ29iamVjdCcgJiYgdGFyZ2V0IGluc3RhbmNlb2YgT2JqZWN0ICYmICEodGFyZ2V0IGluc3RhbmNlb2YgQXJyYXkpICYmICEodGFyZ2V0IGluc3RhbmNlb2YgUmVnRXhwKTtcbiAgICB9XG5cbiAgICBmb3IgKGtleSBpbiBvdmVycmlkZSkge1xuICAgICAgICBpZiAob3ZlcnJpZGUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgdmFsID0gb3ZlcnJpZGVba2V5XTtcbiAgICAgICAgICAgIGlmIChpc0hhc2hPYmplY3QodmFsKSkge1xuICAgICAgICAgICAgICAgIGlmIChpc0hhc2hPYmplY3QodGFyZ2V0W2tleV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZURlZXBseSh0YXJnZXRba2V5XSwgdmFsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXRba2V5XSA9IHVwZGF0ZURlZXBseSh7fSwgdmFsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRhcmdldFtrZXldID0gdmFsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQ7XG59XG5cbi8qKlxuICogTWFpbiBpbnRlcmZhY2UgZnVuY3Rpb24uIFRha2VzIGFuIEVzcHJpbWEgc3ludGF4IHRyZWUgYW5kIHJldHVybnMgdGhlXG4gKiBhbmFseXplZCBzY29wZXMuXG4gKiBAZnVuY3Rpb24gYW5hbHl6ZVxuICogQHBhcmFtIHtlc3ByaW1hLlRyZWV9IHRyZWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm92aWRlZE9wdGlvbnMgLSBPcHRpb25zIHRoYXQgdGFpbG9yIHRoZSBzY29wZSBhbmFseXNpc1xuICogQHBhcmFtIHtib29sZWFufSBbcHJvdmlkZWRPcHRpb25zLm9wdGltaXN0aWM9ZmFsc2VdIC0gdGhlIG9wdGltaXN0aWMgZmxhZ1xuICogQHBhcmFtIHtib29sZWFufSBbcHJvdmlkZWRPcHRpb25zLmRpcmVjdGl2ZT1mYWxzZV0tIHRoZSBkaXJlY3RpdmUgZmxhZ1xuICogQHBhcmFtIHtib29sZWFufSBbcHJvdmlkZWRPcHRpb25zLmlnbm9yZUV2YWw9ZmFsc2VdLSB3aGV0aGVyIHRvIGNoZWNrICdldmFsKCknIGNhbGxzXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtwcm92aWRlZE9wdGlvbnMubm9kZWpzU2NvcGU9ZmFsc2VdLSB3aGV0aGVyIHRoZSB3aG9sZVxuICogc2NyaXB0IGlzIGV4ZWN1dGVkIHVuZGVyIG5vZGUuanMgZW52aXJvbm1lbnQuIFdoZW4gZW5hYmxlZCwgZXNjb3BlIGFkZHNcbiAqIGEgZnVuY3Rpb24gc2NvcGUgaW1tZWRpYXRlbHkgZm9sbG93aW5nIHRoZSBnbG9iYWwgc2NvcGUuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtwcm92aWRlZE9wdGlvbnMuaW1wbGllZFN0cmljdD1mYWxzZV0tIGltcGxpZWQgc3RyaWN0IG1vZGVcbiAqIChpZiBlY21hVmVyc2lvbiA+PSA1KS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbcHJvdmlkZWRPcHRpb25zLnNvdXJjZVR5cGU9J3NjcmlwdCddLSB0aGUgc291cmNlIHR5cGUgb2YgdGhlIHNjcmlwdC4gb25lIG9mICdzY3JpcHQnIGFuZCAnbW9kdWxlJ1xuICogQHBhcmFtIHtudW1iZXJ9IFtwcm92aWRlZE9wdGlvbnMuZWNtYVZlcnNpb249NV0tIHdoaWNoIEVDTUFTY3JpcHQgdmVyc2lvbiBpcyBjb25zaWRlcmVkXG4gKiBAcGFyYW0ge09iamVjdH0gW3Byb3ZpZGVkT3B0aW9ucy5jaGlsZFZpc2l0b3JLZXlzPW51bGxdIC0gQWRkaXRpb25hbCBrbm93biB2aXNpdG9yIGtleXMuIFNlZSBbZXNyZWN1cnNlXShodHRwczovL2dpdGh1Yi5jb20vZXN0b29scy9lc3JlY3Vyc2UpJ3MgdGhlIGBjaGlsZFZpc2l0b3JLZXlzYCBvcHRpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gW3Byb3ZpZGVkT3B0aW9ucy5mYWxsYmFjaz0naXRlcmF0aW9uJ10gLSBBIGtpbmQgb2YgdGhlIGZhbGxiYWNrIGluIG9yZGVyIHRvIGVuY291bnRlciB3aXRoIHVua25vd24gbm9kZS4gU2VlIFtlc3JlY3Vyc2VdKGh0dHBzOi8vZ2l0aHViLmNvbS9lc3Rvb2xzL2VzcmVjdXJzZSkncyB0aGUgYGZhbGxiYWNrYCBvcHRpb24uXG4gKiBAcmV0dXJuIHtTY29wZU1hbmFnZXJ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbmFseXplKHRyZWUsIHByb3ZpZGVkT3B0aW9ucykge1xuICAgIHZhciBzY29wZU1hbmFnZXIsIHJlZmVyZW5jZXIsIG9wdGlvbnM7XG5cbiAgICBvcHRpb25zID0gdXBkYXRlRGVlcGx5KGRlZmF1bHRPcHRpb25zKCksIHByb3ZpZGVkT3B0aW9ucyk7XG5cbiAgICBzY29wZU1hbmFnZXIgPSBuZXcgU2NvcGVNYW5hZ2VyKG9wdGlvbnMpO1xuXG4gICAgcmVmZXJlbmNlciA9IG5ldyBSZWZlcmVuY2VyKG9wdGlvbnMsIHNjb3BlTWFuYWdlcik7XG4gICAgcmVmZXJlbmNlci52aXNpdCh0cmVlKTtcblxuICAgIGFzc2VydChzY29wZU1hbmFnZXIuX19jdXJyZW50U2NvcGUgPT09IG51bGwsICdjdXJyZW50U2NvcGUgc2hvdWxkIGJlIG51bGwuJyk7XG5cbiAgICByZXR1cm4gc2NvcGVNYW5hZ2VyO1xufVxuXG5leHBvcnQge1xuICAgIC8qKiBAbmFtZSBtb2R1bGU6ZXNjb3BlLnZlcnNpb24gKi9cbiAgICB2ZXJzaW9uLFxuICAgIC8qKiBAbmFtZSBtb2R1bGU6ZXNjb3BlLlJlZmVyZW5jZSAqL1xuICAgIFJlZmVyZW5jZSxcbiAgICAvKiogQG5hbWUgbW9kdWxlOmVzY29wZS5WYXJpYWJsZSAqL1xuICAgIFZhcmlhYmxlLFxuICAgIC8qKiBAbmFtZSBtb2R1bGU6ZXNjb3BlLlNjb3BlICovXG4gICAgU2NvcGUsXG4gICAgLyoqIEBuYW1lIG1vZHVsZTplc2NvcGUuU2NvcGVNYW5hZ2VyICovXG4gICAgU2NvcGVNYW5hZ2VyXG59O1xuXG5cbi8qIHZpbTogc2V0IHN3PTQgdHM9NCBldCB0dz04MCA6ICovXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
