'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
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

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _es6WeakMap = require('es6-weak-map');

var _es6WeakMap2 = _interopRequireDefault(_es6WeakMap);

var _scope = require('./scope');

var _scope2 = _interopRequireDefault(_scope);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class ScopeManager
 */
var ScopeManager = function () {
    function ScopeManager(options) {
        _classCallCheck(this, ScopeManager);

        this.scopes = [];
        this.globalScope = null;
        this.__nodeToScope = new _es6WeakMap2.default();
        this.__currentScope = null;
        this.__options = options;
        this.__declaredVariables = new _es6WeakMap2.default();
    }

    _createClass(ScopeManager, [{
        key: '__useDirective',
        value: function __useDirective() {
            return this.__options.directive;
        }
    }, {
        key: '__isOptimistic',
        value: function __isOptimistic() {
            return this.__options.optimistic;
        }
    }, {
        key: '__ignoreEval',
        value: function __ignoreEval() {
            return this.__options.ignoreEval;
        }
    }, {
        key: '__isNodejsScope',
        value: function __isNodejsScope() {
            return this.__options.nodejsScope;
        }
    }, {
        key: 'isModule',
        value: function isModule() {
            return this.__options.sourceType === 'module';
        }
    }, {
        key: 'isInstrumentingTree',
        value: function isInstrumentingTree() {
            return this.__options.instrumentTree;
        }

        // Returns appropliate scope for this node.

    }, {
        key: 'isImpliedStrict',
        value: function isImpliedStrict() {
            return this.__options.impliedStrict;
        }
    }, {
        key: 'isStrictModeSupported',
        value: function isStrictModeSupported() {
            return this.__options.ecmaVersion >= 5;
        }

        // Returns appropriate scope for this node.

    }, {
        key: '__get',
        value: function __get(node) {
            return this.__nodeToScope.get(node);
        }

        /**
         * Get variables that are declared by the node.
         *
         * "are declared by the node" means the node is same as `Variable.defs[].node` or `Variable.defs[].parent`.
         * If the node declares nothing, this method returns an empty array.
         * CAUTION: This API is experimental. See https://github.com/estools/escope/pull/69 for more details.
         *
         * @param {Esprima.Node} node - a node to get.
         * @returns {Variable[]} variables that declared by the node.
         */

    }, {
        key: 'getDeclaredVariables',
        value: function getDeclaredVariables(node) {
            return this.__declaredVariables.get(node) || [];
        }

        /**
         * acquire scope from node.
         * @method ScopeManager#acquire
         * @param {Esprima.Node} node - node for the acquired scope.
         * @param {boolean=} inner - look up the most inner scope, default value is false.
         * @return {Scope?}
         */

    }, {
        key: 'acquire',
        value: function acquire(node, inner) {
            var scopes, scope, i, iz;

            function predicate(scope) {
                if (scope.type === 'function' && scope.functionExpressionScope) {
                    return false;
                }
                if (scope.type === 'TDZ') {
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

        /**
         * acquire all scopes from node.
         * @method ScopeManager#acquireAll
         * @param {Esprima.Node} node - node for the acquired scope.
         * @return {Scope[]?}
         */

    }, {
        key: 'acquireAll',
        value: function acquireAll(node) {
            return this.__get(node);
        }

        /**
         * release the node.
         * @method ScopeManager#release
         * @param {Esprima.Node} node - releasing node.
         * @param {boolean=} inner - look up the most inner scope, default value is false.
         * @return {Scope?} upper scope for the node.
         */

    }, {
        key: 'release',
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
    }, {
        key: 'attach',
        value: function attach() {}
    }, {
        key: 'detach',
        value: function detach() {}
    }, {
        key: '__nestScope',
        value: function __nestScope(scope) {
            if (scope instanceof _scope.GlobalScope) {
                (0, _assert2.default)(this.__currentScope === null);
                this.globalScope = scope;
            }
            this.__currentScope = scope;
            return scope;
        }
    }, {
        key: '__nestGlobalScope',
        value: function __nestGlobalScope(node) {
            return this.__nestScope(new _scope.GlobalScope(this, node));
        }
    }, {
        key: '__nestBlockScope',
        value: function __nestBlockScope(node, isMethodDefinition) {
            return this.__nestScope(new _scope.BlockScope(this, this.__currentScope, node));
        }
    }, {
        key: '__nestFunctionScope',
        value: function __nestFunctionScope(node, isMethodDefinition) {
            return this.__nestScope(new _scope.FunctionScope(this, this.__currentScope, node, isMethodDefinition));
        }
    }, {
        key: '__nestForScope',
        value: function __nestForScope(node) {
            return this.__nestScope(new _scope.ForScope(this, this.__currentScope, node));
        }
    }, {
        key: '__nestCatchScope',
        value: function __nestCatchScope(node) {
            return this.__nestScope(new _scope.CatchScope(this, this.__currentScope, node));
        }
    }, {
        key: '__nestWithScope',
        value: function __nestWithScope(node) {
            return this.__nestScope(new _scope.WithScope(this, this.__currentScope, node));
        }
    }, {
        key: '__nestClassScope',
        value: function __nestClassScope(node) {
            return this.__nestScope(new _scope.ClassScope(this, this.__currentScope, node));
        }
    }, {
        key: '__nestSwitchScope',
        value: function __nestSwitchScope(node) {
            return this.__nestScope(new _scope.SwitchScope(this, this.__currentScope, node));
        }
    }, {
        key: '__nestModuleScope',
        value: function __nestModuleScope(node) {
            return this.__nestScope(new _scope.ModuleScope(this, this.__currentScope, node));
        }
    }, {
        key: '__nestTDZScope',
        value: function __nestTDZScope(node) {
            return this.__nestScope(new _scope.TDZScope(this, this.__currentScope, node));
        }
    }, {
        key: '__nestFunctionExpressionNameScope',
        value: function __nestFunctionExpressionNameScope(node) {
            return this.__nestScope(new _scope.FunctionExpressionNameScope(this, this.__currentScope, node));
        }
    }, {
        key: '__isES6',
        value: function __isES6() {
            return this.__options.ecmaVersion >= 6;
        }
    }]);

    return ScopeManager;
}();

/* vim: set sw=4 ts=4 et tw=80 : */


exports.default = ScopeManager;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNjb3BlLW1hbmFnZXIuanMiXSwibmFtZXMiOlsiU2NvcGVNYW5hZ2VyIiwib3B0aW9ucyIsInNjb3BlcyIsImdsb2JhbFNjb3BlIiwiX19ub2RlVG9TY29wZSIsIl9fY3VycmVudFNjb3BlIiwiX19vcHRpb25zIiwiX19kZWNsYXJlZFZhcmlhYmxlcyIsImRpcmVjdGl2ZSIsIm9wdGltaXN0aWMiLCJpZ25vcmVFdmFsIiwibm9kZWpzU2NvcGUiLCJzb3VyY2VUeXBlIiwiaW5zdHJ1bWVudFRyZWUiLCJpbXBsaWVkU3RyaWN0IiwiZWNtYVZlcnNpb24iLCJub2RlIiwiZ2V0IiwiaW5uZXIiLCJzY29wZSIsImkiLCJpeiIsInByZWRpY2F0ZSIsInR5cGUiLCJmdW5jdGlvbkV4cHJlc3Npb25TY29wZSIsIl9fZ2V0IiwibGVuZ3RoIiwidXBwZXIiLCJhY3F1aXJlIiwiYmxvY2siLCJfX25lc3RTY29wZSIsImlzTWV0aG9kRGVmaW5pdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7O3FqQkFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0JBOzs7O0FBQ0E7Ozs7QUFFQTs7Ozs7Ozs7QUFlQTs7O0lBR3FCQSxZO0FBQ2pCLDBCQUFZQyxPQUFaLEVBQXFCO0FBQUE7O0FBQ2pCLGFBQUtDLE1BQUwsR0FBYyxFQUFkO0FBQ0EsYUFBS0MsV0FBTCxHQUFtQixJQUFuQjtBQUNBLGFBQUtDLGFBQUwsR0FBcUIsMEJBQXJCO0FBQ0EsYUFBS0MsY0FBTCxHQUFzQixJQUF0QjtBQUNBLGFBQUtDLFNBQUwsR0FBaUJMLE9BQWpCO0FBQ0EsYUFBS00sbUJBQUwsR0FBMkIsMEJBQTNCO0FBQ0g7Ozs7eUNBRWdCO0FBQ2IsbUJBQU8sS0FBS0QsU0FBTCxDQUFlRSxTQUF0QjtBQUNIOzs7eUNBRWdCO0FBQ2IsbUJBQU8sS0FBS0YsU0FBTCxDQUFlRyxVQUF0QjtBQUNIOzs7dUNBRWM7QUFDWCxtQkFBTyxLQUFLSCxTQUFMLENBQWVJLFVBQXRCO0FBQ0g7OzswQ0FFaUI7QUFDZCxt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OzswQ0FFaUJBLEksRUFBTTtBQUNwQixtQkFBTyxLQUFLYyxXQUFMLENBQWlCLHVCQUFnQixJQUFoQixFQUFzQixLQUFLekIsY0FBM0IsRUFBMkNXLElBQTNDLENBQWpCLENBQVA7QUFDSDs7OzBDQUVpQkEsSSxFQUFNO0FBQ3BCLG1CQUFPLEtBQUtjLFdBQUwsQ0FBaUIsdUJBQWdCLElBQWhCLEVBQXNCLEtBQUt6QixjQUEzQixFQUEyQ1csSUFBM0MsQ0FBakIsQ0FBUDtBQUNIOzs7dUNBRWNBLEksRUFBTTtBQUNqQixtQkFBTyxLQUFLYyxXQUFMLENBQWlCLG9CQUFhLElBQWIsRUFBbUIsS0FBS3pCLGNBQXhCLEVBQXdDVyxJQUF4QyxDQUFqQixDQUFQO0FBQ0g7OzswREFFaUNBLEksRUFBTTtBQUNwQyxtQkFBTyxLQUFLYyxXQUFMLENBQWlCLHVDQUFnQyxJQUFoQyxFQUFzQyxLQUFLekIsY0FBM0MsRUFBMkRXLElBQTNELENBQWpCLENBQVA7QUFDSDs7O2tDQUVTO0FBQ04sbUJBQU8sS0FBS1YsU0FBTCxDQUFlUyxXQUFmLElBQThCLENBQXJDO0FBQ0g7Ozs7OztBQUdMOzs7a0JBNU1xQmYsWSIsImZpbGUiOiJzY29wZS1tYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAgQ29weXJpZ2h0IChDKSAyMDE1IFl1c3VrZSBTdXp1a2kgPHV0YXRhbmUudGVhQGdtYWlsLmNvbT5cblxuICBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAgbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG5cbiAgICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0XG4gICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gICAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodFxuICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZVxuICAgICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cblxuICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIlxuICBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFXG4gIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFXG4gIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCA8Q09QWVJJR0hUIEhPTERFUj4gQkUgTElBQkxFIEZPUiBBTllcbiAgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVNcbiAgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTO1xuICBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkRcbiAgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbiAgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GXG4gIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4qL1xuXG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQgV2Vha01hcCBmcm9tICdlczYtd2Vhay1tYXAnO1xuXG5pbXBvcnQgU2NvcGUgZnJvbSAnLi9zY29wZSc7XG5pbXBvcnQge1xuICAgIEdsb2JhbFNjb3BlLFxuICAgIENhdGNoU2NvcGUsXG4gICAgV2l0aFNjb3BlLFxuICAgIE1vZHVsZVNjb3BlLFxuICAgIENsYXNzU2NvcGUsXG4gICAgU3dpdGNoU2NvcGUsXG4gICAgRnVuY3Rpb25TY29wZSxcbiAgICBGb3JTY29wZSxcbiAgICBURFpTY29wZSxcbiAgICBGdW5jdGlvbkV4cHJlc3Npb25OYW1lU2NvcGUsXG4gICAgQmxvY2tTY29wZVxufSBmcm9tICcuL3Njb3BlJztcblxuLyoqXG4gKiBAY2xhc3MgU2NvcGVNYW5hZ2VyXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNjb3BlTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICB0aGlzLnNjb3BlcyA9IFtdO1xuICAgICAgICB0aGlzLmdsb2JhbFNjb3BlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fX25vZGVUb1Njb3BlID0gbmV3IFdlYWtNYXAoKTtcbiAgICAgICAgdGhpcy5fX2N1cnJlbnRTY29wZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX19vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5fX2RlY2xhcmVkVmFyaWFibGVzID0gbmV3IFdlYWtNYXAoKTtcbiAgICB9XG5cbiAgICBfX3VzZURpcmVjdGl2ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19vcHRpb25zLmRpcmVjdGl2ZTtcbiAgICB9XG5cbiAgICBfX2lzT3B0aW1pc3RpYygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19vcHRpb25zLm9wdGltaXN0aWM7XG4gICAgfVxuXG4gICAgX19pZ25vcmVFdmFsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX29wdGlvbnMuaWdub3JlRXZhbDtcbiAgICB9XG5cbiAgICBfX2lzTm9kZWpzU2NvcGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fb3B0aW9ucy5ub2RlanNTY29wZTtcbiAgICB9XG5cbiAgICBpc01vZHVsZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19vcHRpb25zLnNvdXJjZVR5cGUgPT09ICdtb2R1bGUnO1xuICAgIH1cblxuICAgIGlzSW5zdHJ1bWVudGluZ1RyZWUgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX29wdGlvbnMuaW5zdHJ1bWVudFRyZWU7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJucyBhcHByb3BsaWF0ZSBzY29wZSBmb3IgdGhpcyBub2RlLlxuICAgIGlzSW1wbGllZFN0cmljdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19vcHRpb25zLmltcGxpZWRTdHJpY3Q7XG4gICAgfVxuXG4gICAgaXNTdHJpY3RNb2RlU3VwcG9ydGVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX29wdGlvbnMuZWNtYVZlcnNpb24gPj0gNTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIGFwcHJvcHJpYXRlIHNjb3BlIGZvciB0aGlzIG5vZGUuXG4gICAgX19nZXQobm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX25vZGVUb1Njb3BlLmdldChub2RlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdmFyaWFibGVzIHRoYXQgYXJlIGRlY2xhcmVkIGJ5IHRoZSBub2RlLlxuICAgICAqXG4gICAgICogXCJhcmUgZGVjbGFyZWQgYnkgdGhlIG5vZGVcIiBtZWFucyB0aGUgbm9kZSBpcyBzYW1lIGFzIGBWYXJpYWJsZS5kZWZzW10ubm9kZWAgb3IgYFZhcmlhYmxlLmRlZnNbXS5wYXJlbnRgLlxuICAgICAqIElmIHRoZSBub2RlIGRlY2xhcmVzIG5vdGhpbmcsIHRoaXMgbWV0aG9kIHJldHVybnMgYW4gZW1wdHkgYXJyYXkuXG4gICAgICogQ0FVVElPTjogVGhpcyBBUEkgaXMgZXhwZXJpbWVudGFsLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2VzdG9vbHMvZXNjb3BlL3B1bGwvNjkgZm9yIG1vcmUgZGV0YWlscy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXNwcmltYS5Ob2RlfSBub2RlIC0gYSBub2RlIHRvIGdldC5cbiAgICAgKiBAcmV0dXJucyB7VmFyaWFibGVbXX0gdmFyaWFibGVzIHRoYXQgZGVjbGFyZWQgYnkgdGhlIG5vZGUuXG4gICAgICovXG4gICAgZ2V0RGVjbGFyZWRWYXJpYWJsZXMobm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX2RlY2xhcmVkVmFyaWFibGVzLmdldChub2RlKSB8fCBbXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBhY3F1aXJlIHNjb3BlIGZyb20gbm9kZS5cbiAgICAgKiBAbWV0aG9kIFNjb3BlTWFuYWdlciNhY3F1aXJlXG4gICAgICogQHBhcmFtIHtFc3ByaW1hLk5vZGV9IG5vZGUgLSBub2RlIGZvciB0aGUgYWNxdWlyZWQgc2NvcGUuXG4gICAgICogQHBhcmFtIHtib29sZWFuPX0gaW5uZXIgLSBsb29rIHVwIHRoZSBtb3N0IGlubmVyIHNjb3BlLCBkZWZhdWx0IHZhbHVlIGlzIGZhbHNlLlxuICAgICAqIEByZXR1cm4ge1Njb3BlP31cbiAgICAgKi9cbiAgICBhY3F1aXJlKG5vZGUsIGlubmVyKSB7XG4gICAgICAgIHZhciBzY29wZXMsIHNjb3BlLCBpLCBpejtcblxuICAgICAgICBmdW5jdGlvbiBwcmVkaWNhdGUoc2NvcGUpIHtcbiAgICAgICAgICAgIGlmIChzY29wZS50eXBlID09PSAnZnVuY3Rpb24nICYmIHNjb3BlLmZ1bmN0aW9uRXhwcmVzc2lvblNjb3BlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHNjb3BlLnR5cGUgPT09ICdURFonKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBzY29wZXMgPSB0aGlzLl9fZ2V0KG5vZGUpO1xuICAgICAgICBpZiAoIXNjb3BlcyB8fCBzY29wZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhldXJpc3RpYyBzZWxlY3Rpb24gZnJvbSBhbGwgc2NvcGVzLlxuICAgICAgICAvLyBJZiB5b3Ugd291bGQgbGlrZSB0byBnZXQgYWxsIHNjb3BlcywgcGxlYXNlIHVzZSBTY29wZU1hbmFnZXIjYWNxdWlyZUFsbC5cbiAgICAgICAgaWYgKHNjb3Blcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiBzY29wZXNbMF07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5uZXIpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IHNjb3Blcy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgICAgIHNjb3BlID0gc2NvcGVzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChwcmVkaWNhdGUoc2NvcGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzY29wZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBpeiA9IHNjb3Blcy5sZW5ndGg7IGkgPCBpejsgKytpKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUgPSBzY29wZXNbaV07XG4gICAgICAgICAgICAgICAgaWYgKHByZWRpY2F0ZShzY29wZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjb3BlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGFjcXVpcmUgYWxsIHNjb3BlcyBmcm9tIG5vZGUuXG4gICAgICogQG1ldGhvZCBTY29wZU1hbmFnZXIjYWNxdWlyZUFsbFxuICAgICAqIEBwYXJhbSB7RXNwcmltYS5Ob2RlfSBub2RlIC0gbm9kZSBmb3IgdGhlIGFjcXVpcmVkIHNjb3BlLlxuICAgICAqIEByZXR1cm4ge1Njb3BlW10/fVxuICAgICAqL1xuICAgIGFjcXVpcmVBbGwobm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX2dldChub2RlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiByZWxlYXNlIHRoZSBub2RlLlxuICAgICAqIEBtZXRob2QgU2NvcGVNYW5hZ2VyI3JlbGVhc2VcbiAgICAgKiBAcGFyYW0ge0VzcHJpbWEuTm9kZX0gbm9kZSAtIHJlbGVhc2luZyBub2RlLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbj19IGlubmVyIC0gbG9vayB1cCB0aGUgbW9zdCBpbm5lciBzY29wZSwgZGVmYXVsdCB2YWx1ZSBpcyBmYWxzZS5cbiAgICAgKiBAcmV0dXJuIHtTY29wZT99IHVwcGVyIHNjb3BlIGZvciB0aGUgbm9kZS5cbiAgICAgKi9cbiAgICByZWxlYXNlKG5vZGUsIGlubmVyKSB7XG4gICAgICAgIHZhciBzY29wZXMsIHNjb3BlO1xuICAgICAgICBzY29wZXMgPSB0aGlzLl9fZ2V0KG5vZGUpO1xuICAgICAgICBpZiAoc2NvcGVzICYmIHNjb3Blcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHNjb3BlID0gc2NvcGVzWzBdLnVwcGVyO1xuICAgICAgICAgICAgaWYgKCFzY29wZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWNxdWlyZShzY29wZS5ibG9jaywgaW5uZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGF0dGFjaCgpIHsgfVxuXG4gICAgZGV0YWNoKCkgeyB9XG5cbiAgICBfX25lc3RTY29wZShzY29wZSkge1xuICAgICAgICBpZiAoc2NvcGUgaW5zdGFuY2VvZiBHbG9iYWxTY29wZSkge1xuICAgICAgICAgICAgYXNzZXJ0KHRoaXMuX19jdXJyZW50U2NvcGUgPT09IG51bGwpO1xuICAgICAgICAgICAgdGhpcy5nbG9iYWxTY29wZSA9IHNjb3BlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX19jdXJyZW50U2NvcGUgPSBzY29wZTtcbiAgICAgICAgcmV0dXJuIHNjb3BlO1xuICAgIH1cblxuICAgIF9fbmVzdEdsb2JhbFNjb3BlKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19uZXN0U2NvcGUobmV3IEdsb2JhbFNjb3BlKHRoaXMsIG5vZGUpKTtcbiAgICB9XG5cbiAgICBfX25lc3RCbG9ja1Njb3BlKG5vZGUsIGlzTWV0aG9kRGVmaW5pdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcy5fX25lc3RTY29wZShuZXcgQmxvY2tTY29wZSh0aGlzLCB0aGlzLl9fY3VycmVudFNjb3BlLCBub2RlKSk7XG4gICAgfVxuXG4gICAgX19uZXN0RnVuY3Rpb25TY29wZShub2RlLCBpc01ldGhvZERlZmluaXRpb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19uZXN0U2NvcGUobmV3IEZ1bmN0aW9uU2NvcGUodGhpcywgdGhpcy5fX2N1cnJlbnRTY29wZSwgbm9kZSwgaXNNZXRob2REZWZpbml0aW9uKSk7XG4gICAgfVxuXG4gICAgX19uZXN0Rm9yU2NvcGUobm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX25lc3RTY29wZShuZXcgRm9yU2NvcGUodGhpcywgdGhpcy5fX2N1cnJlbnRTY29wZSwgbm9kZSkpO1xuICAgIH1cblxuICAgIF9fbmVzdENhdGNoU2NvcGUobm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX25lc3RTY29wZShuZXcgQ2F0Y2hTY29wZSh0aGlzLCB0aGlzLl9fY3VycmVudFNjb3BlLCBub2RlKSk7XG4gICAgfVxuXG4gICAgX19uZXN0V2l0aFNjb3BlKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19uZXN0U2NvcGUobmV3IFdpdGhTY29wZSh0aGlzLCB0aGlzLl9fY3VycmVudFNjb3BlLCBub2RlKSk7XG4gICAgfVxuXG4gICAgX19uZXN0Q2xhc3NTY29wZShub2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fbmVzdFNjb3BlKG5ldyBDbGFzc1Njb3BlKHRoaXMsIHRoaXMuX19jdXJyZW50U2NvcGUsIG5vZGUpKTtcbiAgICB9XG5cbiAgICBfX25lc3RTd2l0Y2hTY29wZShub2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fbmVzdFNjb3BlKG5ldyBTd2l0Y2hTY29wZSh0aGlzLCB0aGlzLl9fY3VycmVudFNjb3BlLCBub2RlKSk7XG4gICAgfVxuXG4gICAgX19uZXN0TW9kdWxlU2NvcGUobm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX25lc3RTY29wZShuZXcgTW9kdWxlU2NvcGUodGhpcywgdGhpcy5fX2N1cnJlbnRTY29wZSwgbm9kZSkpO1xuICAgIH1cblxuICAgIF9fbmVzdFREWlNjb3BlKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19uZXN0U2NvcGUobmV3IFREWlNjb3BlKHRoaXMsIHRoaXMuX19jdXJyZW50U2NvcGUsIG5vZGUpKTtcbiAgICB9XG5cbiAgICBfX25lc3RGdW5jdGlvbkV4cHJlc3Npb25OYW1lU2NvcGUobm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX25lc3RTY29wZShuZXcgRnVuY3Rpb25FeHByZXNzaW9uTmFtZVNjb3BlKHRoaXMsIHRoaXMuX19jdXJyZW50U2NvcGUsIG5vZGUpKTtcbiAgICB9XG5cbiAgICBfX2lzRVM2KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX29wdGlvbnMuZWNtYVZlcnNpb24gPj0gNjtcbiAgICB9XG59XG5cbi8qIHZpbTogc2V0IHN3PTQgdHM9NCBldCB0dz04MCA6ICovXG4iXX0=
