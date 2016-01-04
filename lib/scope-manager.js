"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/*
  Copyright (C) 2015 Yusuke Suzuki <utatane.tea@gmail.com>

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

var WeakMap = _interopRequire(require("es6-weak-map"));

var _scope = require("./scope");

var Scope = _interopRequire(_scope);

var assert = _interopRequire(require("assert"));

var GlobalScope = _scope.GlobalScope;
var CatchScope = _scope.CatchScope;
var WithScope = _scope.WithScope;
var ModuleScope = _scope.ModuleScope;
var ClassScope = _scope.ClassScope;
var SwitchScope = _scope.SwitchScope;
var FunctionScope = _scope.FunctionScope;
var ForScope = _scope.ForScope;
var TDZScope = _scope.TDZScope;
var FunctionExpressionNameScope = _scope.FunctionExpressionNameScope;
var BlockScope = _scope.BlockScope;

/**
 * @class ScopeManager
 */

var ScopeManager = (function () {
    function ScopeManager(options) {
        _classCallCheck(this, ScopeManager);

        this.scopes = [];
        this.globalScope = null;
        this.__nodeToScope = new WeakMap();
        this.__currentScope = null;
        this.__options = options;
    }

    _createClass(ScopeManager, {
        __useDirective: {
            value: function __useDirective() {
                return this.__options.directive;
            }
        },
        __isOptimistic: {
            value: function __isOptimistic() {
                return this.__options.optimistic;
            }
        },
        __ignoreEval: {
            value: function __ignoreEval() {
                return this.__options.ignoreEval;
            }
        },
        __isNodejsScope: {
            value: function __isNodejsScope() {
                return this.__options.nodejsScope;
            }
        },
        isModule: {
            value: function isModule() {
                return this.__options.sourceType === "module";
            }
        },
        isInstrumentingTree: {
            value: function isInstrumentingTree() {
                return this.__options.instrumentTree;
            }
        },
        __get: {

            // Returns appropliate scope for this node.

            value: function __get(node) {
                return this.__nodeToScope.get(node);
            }
        },
        acquire: {

            /**
             * acquire scope from node.
             * @method ScopeManager#acquire
             * @param {Esprima.Node} node - node for the acquired scope.
             * @param {boolean=} inner - look up the most inner scope, default value is false.
             * @return {Scope?}
             */

            value: function acquire(node, inner) {
                var scopes, scope, i, iz;

                function predicate(scope) {
                    if (scope.type === "function" && scope.functionExpressionScope) {
                        return false;
                    }
                    if (scope.type === "TDZ") {
                        return false;
                    }
                    return true;
                }

                scopes = this.__get(node);
                if (!scopes || scopes.length === 0) {
                    return null;
                }

                // Heuristic selection from all scopes.
                // If you would like to get all scopes, please use ScopeManager#acquireAll.
                if (scopes.length === 1) {
                    return scopes[0];
                }

                if (inner) {
                    for (i = scopes.length - 1; i >= 0; --i) {
                        scope = scopes[i];
                        if (predicate(scope)) {
                            return scope;
                        }
                    }
                } else {
                    for (i = 0, iz = scopes.length; i < iz; ++i) {
                        scope = scopes[i];
                        if (predicate(scope)) {
                            return scope;
                        }
                    }
                }

                return null;
            }
        },
        acquireAll: {

            /**
             * acquire all scopes from node.
             * @method ScopeManager#acquireAll
             * @param {Esprima.Node} node - node for the acquired scope.
             * @return {Scope[]?}
             */

            value: function acquireAll(node) {
                return this.__get(node);
            }
        },
        release: {

            /**
             * release the node.
             * @method ScopeManager#release
             * @param {Esprima.Node} node - releasing node.
             * @param {boolean=} inner - look up the most inner scope, default value is false.
             * @return {Scope?} upper scope for the node.
             */

            value: function release(node, inner) {
                var scopes, scope;
                scopes = this.__get(node);
                if (scopes && scopes.length) {
                    scope = scopes[0].upper;
                    if (!scope) {
                        return null;
                    }
                    return this.acquire(scope.block, inner);
                }
                return null;
            }
        },
        attach: {
            value: function attach() {}
        },
        detach: {
            value: function detach() {}
        },
        __nestScope: {
            value: function __nestScope(scope) {
                if (scope instanceof GlobalScope) {
                    assert(this.__currentScope === null);
                    this.globalScope = scope;
                }
                this.__currentScope = scope;
                return scope;
            }
        },
        __nestGlobalScope: {
            value: function __nestGlobalScope(node) {
                return this.__nestScope(new GlobalScope(this, node));
            }
        },
        __nestBlockScope: {
            value: function __nestBlockScope(node, isMethodDefinition) {
                return this.__nestScope(new BlockScope(this, this.__currentScope, node));
            }
        },
        __nestFunctionScope: {
            value: function __nestFunctionScope(node, isMethodDefinition) {
                return this.__nestScope(new FunctionScope(this, this.__currentScope, node, isMethodDefinition));
            }
        },
        __nestForScope: {
            value: function __nestForScope(node) {
                return this.__nestScope(new ForScope(this, this.__currentScope, node));
            }
        },
        __nestCatchScope: {
            value: function __nestCatchScope(node) {
                return this.__nestScope(new CatchScope(this, this.__currentScope, node));
            }
        },
        __nestWithScope: {
            value: function __nestWithScope(node) {
                return this.__nestScope(new WithScope(this, this.__currentScope, node));
            }
        },
        __nestClassScope: {
            value: function __nestClassScope(node) {
                return this.__nestScope(new ClassScope(this, this.__currentScope, node));
            }
        },
        __nestSwitchScope: {
            value: function __nestSwitchScope(node) {
                return this.__nestScope(new SwitchScope(this, this.__currentScope, node));
            }
        },
        __nestModuleScope: {
            value: function __nestModuleScope(node) {
                return this.__nestScope(new ModuleScope(this, this.__currentScope, node));
            }
        },
        __nestTDZScope: {
            value: function __nestTDZScope(node) {
                return this.__nestScope(new TDZScope(this, this.__currentScope, node));
            }
        },
        __nestFunctionExpressionNameScope: {
            value: function __nestFunctionExpressionNameScope(node) {
                return this.__nestScope(new FunctionExpressionNameScope(this, this.__currentScope, node));
            }
        },
        __isES6: {
            value: function __isES6() {
                return this.__options.ecmaVersion >= 6;
            }
        }
    });

    return ScopeManager;
})();

module.exports = ScopeManager;

/* vim: set sw=4 ts=4 et tw=80 : */
//# sourceMappingURL=data:application/json;base64,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QyxDQUFDLENBQUM7YUFDN0Y7O0FBRUQsZUFBTzttQkFBQSxtQkFBRztBQUNOLHVCQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxJQUFJLENBQUMsQ0FBQzthQUMxQzs7OztXQWpMZ0IsWUFBWTs7O2lCQUFaLFlBQVkiLCJmaWxlIjoic2NvcGUtbWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gIENvcHlyaWdodCAoQykgMjAxNSBZdXN1a2UgU3V6dWtpIDx1dGF0YW5lLnRlYUBnbWFpbC5jb20+XG5cbiAgUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0XG4gIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxuXG4gICAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodFxuICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICAgICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGVcbiAgICAgIGRvY3VtZW50YXRpb24gYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG5cbiAgVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBcIkFTIElTXCJcbiAgQU5EIEFOWSBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRVxuICBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRVxuICBBUkUgRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgPENPUFlSSUdIVCBIT0xERVI+IEJFIExJQUJMRSBGT1IgQU5ZXG4gIERJUkVDVCwgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTXG4gIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUztcbiAgTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EXG4gIE9OIEFOWSBUSEVPUlkgT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUXG4gIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRSBPRlxuICBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuKi9cblxuaW1wb3J0IFdlYWtNYXAgZnJvbSAnZXM2LXdlYWstbWFwJztcbmltcG9ydCBTY29wZSBmcm9tICcuL3Njb3BlJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuaW1wb3J0IHtcbiAgICBHbG9iYWxTY29wZSxcbiAgICBDYXRjaFNjb3BlLFxuICAgIFdpdGhTY29wZSxcbiAgICBNb2R1bGVTY29wZSxcbiAgICBDbGFzc1Njb3BlLFxuICAgIFN3aXRjaFNjb3BlLFxuICAgIEZ1bmN0aW9uU2NvcGUsXG4gICAgRm9yU2NvcGUsXG4gICAgVERaU2NvcGUsXG4gICAgRnVuY3Rpb25FeHByZXNzaW9uTmFtZVNjb3BlLFxuICAgIEJsb2NrU2NvcGVcbn0gZnJvbSAnLi9zY29wZSc7XG5cbi8qKlxuICogQGNsYXNzIFNjb3BlTWFuYWdlclxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTY29wZU1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5zY29wZXMgPSBbXTtcbiAgICAgICAgdGhpcy5nbG9iYWxTY29wZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX19ub2RlVG9TY29wZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgICAgIHRoaXMuX19jdXJyZW50U2NvcGUgPSBudWxsO1xuICAgICAgICB0aGlzLl9fb3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgfVxuXG4gICAgX191c2VEaXJlY3RpdmUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fb3B0aW9ucy5kaXJlY3RpdmU7XG4gICAgfVxuXG4gICAgX19pc09wdGltaXN0aWMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fb3B0aW9ucy5vcHRpbWlzdGljO1xuICAgIH1cblxuICAgIF9faWdub3JlRXZhbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19vcHRpb25zLmlnbm9yZUV2YWw7XG4gICAgfVxuXG4gICAgX19pc05vZGVqc1Njb3BlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX29wdGlvbnMubm9kZWpzU2NvcGU7XG4gICAgfVxuXG4gICAgaXNNb2R1bGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fb3B0aW9ucy5zb3VyY2VUeXBlID09PSAnbW9kdWxlJztcbiAgICB9XG5cbiAgICBpc0luc3RydW1lbnRpbmdUcmVlICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19vcHRpb25zLmluc3RydW1lbnRUcmVlO1xuICAgIH1cblxuICAgIC8vIFJldHVybnMgYXBwcm9wbGlhdGUgc2NvcGUgZm9yIHRoaXMgbm9kZS5cbiAgICBfX2dldChub2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fbm9kZVRvU2NvcGUuZ2V0KG5vZGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGFjcXVpcmUgc2NvcGUgZnJvbSBub2RlLlxuICAgICAqIEBtZXRob2QgU2NvcGVNYW5hZ2VyI2FjcXVpcmVcbiAgICAgKiBAcGFyYW0ge0VzcHJpbWEuTm9kZX0gbm9kZSAtIG5vZGUgZm9yIHRoZSBhY3F1aXJlZCBzY29wZS5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW49fSBpbm5lciAtIGxvb2sgdXAgdGhlIG1vc3QgaW5uZXIgc2NvcGUsIGRlZmF1bHQgdmFsdWUgaXMgZmFsc2UuXG4gICAgICogQHJldHVybiB7U2NvcGU/fVxuICAgICAqL1xuICAgIGFjcXVpcmUobm9kZSwgaW5uZXIpIHtcbiAgICAgICAgdmFyIHNjb3Blcywgc2NvcGUsIGksIGl6O1xuXG4gICAgICAgIGZ1bmN0aW9uIHByZWRpY2F0ZShzY29wZSkge1xuICAgICAgICAgICAgaWYgKHNjb3BlLnR5cGUgPT09ICdmdW5jdGlvbicgJiYgc2NvcGUuZnVuY3Rpb25FeHByZXNzaW9uU2NvcGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc2NvcGUudHlwZSA9PT0gJ1REWicpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlcyA9IHRoaXMuX19nZXQobm9kZSk7XG4gICAgICAgIGlmICghc2NvcGVzIHx8IHNjb3Blcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGV1cmlzdGljIHNlbGVjdGlvbiBmcm9tIGFsbCBzY29wZXMuXG4gICAgICAgIC8vIElmIHlvdSB3b3VsZCBsaWtlIHRvIGdldCBhbGwgc2NvcGVzLCBwbGVhc2UgdXNlIFNjb3BlTWFuYWdlciNhY3F1aXJlQWxsLlxuICAgICAgICBpZiAoc2NvcGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHNjb3Blc1swXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbm5lcikge1xuICAgICAgICAgICAgZm9yIChpID0gc2NvcGVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUgPSBzY29wZXNbaV07XG4gICAgICAgICAgICAgICAgaWYgKHByZWRpY2F0ZShzY29wZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjb3BlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGl6ID0gc2NvcGVzLmxlbmd0aDsgaSA8IGl6OyArK2kpIHtcbiAgICAgICAgICAgICAgICBzY29wZSA9IHNjb3Blc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAocHJlZGljYXRlKHNjb3BlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2NvcGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogYWNxdWlyZSBhbGwgc2NvcGVzIGZyb20gbm9kZS5cbiAgICAgKiBAbWV0aG9kIFNjb3BlTWFuYWdlciNhY3F1aXJlQWxsXG4gICAgICogQHBhcmFtIHtFc3ByaW1hLk5vZGV9IG5vZGUgLSBub2RlIGZvciB0aGUgYWNxdWlyZWQgc2NvcGUuXG4gICAgICogQHJldHVybiB7U2NvcGVbXT99XG4gICAgICovXG4gICAgYWNxdWlyZUFsbChub2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fZ2V0KG5vZGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHJlbGVhc2UgdGhlIG5vZGUuXG4gICAgICogQG1ldGhvZCBTY29wZU1hbmFnZXIjcmVsZWFzZVxuICAgICAqIEBwYXJhbSB7RXNwcmltYS5Ob2RlfSBub2RlIC0gcmVsZWFzaW5nIG5vZGUuXG4gICAgICogQHBhcmFtIHtib29sZWFuPX0gaW5uZXIgLSBsb29rIHVwIHRoZSBtb3N0IGlubmVyIHNjb3BlLCBkZWZhdWx0IHZhbHVlIGlzIGZhbHNlLlxuICAgICAqIEByZXR1cm4ge1Njb3BlP30gdXBwZXIgc2NvcGUgZm9yIHRoZSBub2RlLlxuICAgICAqL1xuICAgIHJlbGVhc2Uobm9kZSwgaW5uZXIpIHtcbiAgICAgICAgdmFyIHNjb3Blcywgc2NvcGU7XG4gICAgICAgIHNjb3BlcyA9IHRoaXMuX19nZXQobm9kZSk7XG4gICAgICAgIGlmIChzY29wZXMgJiYgc2NvcGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgc2NvcGUgPSBzY29wZXNbMF0udXBwZXI7XG4gICAgICAgICAgICBpZiAoIXNjb3BlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hY3F1aXJlKHNjb3BlLmJsb2NrLCBpbm5lcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgYXR0YWNoKCkgeyB9XG5cbiAgICBkZXRhY2goKSB7IH1cblxuICAgIF9fbmVzdFNjb3BlKHNjb3BlKSB7XG4gICAgICAgIGlmIChzY29wZSBpbnN0YW5jZW9mIEdsb2JhbFNjb3BlKSB7XG4gICAgICAgICAgICBhc3NlcnQodGhpcy5fX2N1cnJlbnRTY29wZSA9PT0gbnVsbCk7XG4gICAgICAgICAgICB0aGlzLmdsb2JhbFNjb3BlID0gc2NvcGU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fX2N1cnJlbnRTY29wZSA9IHNjb3BlO1xuICAgICAgICByZXR1cm4gc2NvcGU7XG4gICAgfVxuXG4gICAgX19uZXN0R2xvYmFsU2NvcGUobm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX25lc3RTY29wZShuZXcgR2xvYmFsU2NvcGUodGhpcywgbm9kZSkpO1xuICAgIH1cblxuICAgIF9fbmVzdEJsb2NrU2NvcGUobm9kZSwgaXNNZXRob2REZWZpbml0aW9uKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fbmVzdFNjb3BlKG5ldyBCbG9ja1Njb3BlKHRoaXMsIHRoaXMuX19jdXJyZW50U2NvcGUsIG5vZGUpKTtcbiAgICB9XG5cbiAgICBfX25lc3RGdW5jdGlvblNjb3BlKG5vZGUsIGlzTWV0aG9kRGVmaW5pdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcy5fX25lc3RTY29wZShuZXcgRnVuY3Rpb25TY29wZSh0aGlzLCB0aGlzLl9fY3VycmVudFNjb3BlLCBub2RlLCBpc01ldGhvZERlZmluaXRpb24pKTtcbiAgICB9XG5cbiAgICBfX25lc3RGb3JTY29wZShub2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fbmVzdFNjb3BlKG5ldyBGb3JTY29wZSh0aGlzLCB0aGlzLl9fY3VycmVudFNjb3BlLCBub2RlKSk7XG4gICAgfVxuXG4gICAgX19uZXN0Q2F0Y2hTY29wZShub2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fbmVzdFNjb3BlKG5ldyBDYXRjaFNjb3BlKHRoaXMsIHRoaXMuX19jdXJyZW50U2NvcGUsIG5vZGUpKTtcbiAgICB9XG5cbiAgICBfX25lc3RXaXRoU2NvcGUobm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX25lc3RTY29wZShuZXcgV2l0aFNjb3BlKHRoaXMsIHRoaXMuX19jdXJyZW50U2NvcGUsIG5vZGUpKTtcbiAgICB9XG5cbiAgICBfX25lc3RDbGFzc1Njb3BlKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19uZXN0U2NvcGUobmV3IENsYXNzU2NvcGUodGhpcywgdGhpcy5fX2N1cnJlbnRTY29wZSwgbm9kZSkpO1xuICAgIH1cblxuICAgIF9fbmVzdFN3aXRjaFNjb3BlKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19uZXN0U2NvcGUobmV3IFN3aXRjaFNjb3BlKHRoaXMsIHRoaXMuX19jdXJyZW50U2NvcGUsIG5vZGUpKTtcbiAgICB9XG5cbiAgICBfX25lc3RNb2R1bGVTY29wZShub2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fbmVzdFNjb3BlKG5ldyBNb2R1bGVTY29wZSh0aGlzLCB0aGlzLl9fY3VycmVudFNjb3BlLCBub2RlKSk7XG4gICAgfVxuXG4gICAgX19uZXN0VERaU2NvcGUobm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX25lc3RTY29wZShuZXcgVERaU2NvcGUodGhpcywgdGhpcy5fX2N1cnJlbnRTY29wZSwgbm9kZSkpO1xuICAgIH1cblxuICAgIF9fbmVzdEZ1bmN0aW9uRXhwcmVzc2lvbk5hbWVTY29wZShub2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fbmVzdFNjb3BlKG5ldyBGdW5jdGlvbkV4cHJlc3Npb25OYW1lU2NvcGUodGhpcywgdGhpcy5fX2N1cnJlbnRTY29wZSwgbm9kZSkpO1xuICAgIH1cblxuICAgIF9faXNFUzYoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fb3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2O1xuICAgIH1cbn1cblxuLyogdmltOiBzZXQgc3c9NCB0cz00IGV0IHR3PTgwIDogKi9cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
