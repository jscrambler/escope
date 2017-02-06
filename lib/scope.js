'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ClassScope = exports.ForScope = exports.FunctionScope = exports.SwitchScope = exports.BlockScope = exports.TDZScope = exports.WithScope = exports.CatchScope = exports.FunctionExpressionNameScope = exports.ModuleScope = exports.GlobalScope = undefined;

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

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

var _estraverse = require('estraverse');

var _es6Map = require('es6-map');

var _es6Map2 = _interopRequireDefault(_es6Map);

var _reference = require('./reference');

var _reference2 = _interopRequireDefault(_reference);

var _variable = require('./variable');

var _variable2 = _interopRequireDefault(_variable);

var _definition = require('./definition');

var _definition2 = _interopRequireDefault(_definition);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function isStrictScope(scope, block, isMethodDefinition, useDirective) {
    var body, i, iz, stmt, expr;

    // When upper scope is exists and strict, inner scope is also strict.
    if (scope.upper && scope.upper.isStrict) {
        return true;
    }

    // ArrowFunctionExpression's scope is always strict scope.
    if (block.type === _estraverse.Syntax.ArrowFunctionExpression) {
        return true;
    }

    if (isMethodDefinition) {
        return true;
    }

    if (scope.type === 'class' || scope.type === 'module') {
        return true;
    }

    if (scope.type === 'block' || scope.type === 'switch') {
        return false;
    }

    if (scope.type === 'function') {
        if (block.type === _estraverse.Syntax.Program) {
            body = block;
        } else {
            body = block.body;
        }
    } else if (scope.type === 'global') {
        body = block;
    } else {
        return false;
    }

    // Search 'use strict' directive.
    if (useDirective) {
        for (i = 0, iz = body.body.length; i < iz; ++i) {
            stmt = body.body[i];
            if (stmt.type !== _estraverse.Syntax.DirectiveStatement) {
                break;
            }
            if (stmt.raw === '"use strict"' || stmt.raw === '\'use strict\'') {
                return true;
            }
        }
    } else {
        for (i = 0, iz = body.body.length; i < iz; ++i) {
            stmt = body.body[i];
            if (stmt.type !== _estraverse.Syntax.ExpressionStatement) {
                break;
            }
            expr = stmt.expression;
            if (expr.type !== _estraverse.Syntax.Literal || typeof expr.value !== 'string') {
                break;
            }
            if (expr.raw != null) {
                if (expr.raw === '"use strict"' || expr.raw === '\'use strict\'') {
                    return true;
                }
            } else {
                if (expr.value === 'use strict') {
                    return true;
                }
            }
        }
    }
    return false;
}

function registerScope(scopeManager, scope) {
    var scopes;

    scopeManager.scopes.push(scope);

    scopes = scopeManager.__nodeToScope.get(scope.block);
    if (scopes) {
        scopes.push(scope);
    } else {
        scopeManager.__nodeToScope.set(scope.block, [scope]);
    }
}

function shouldBeStatically(def) {
    return def.type === _variable2.default.ClassName || def.type === _variable2.default.Variable && def.parent.kind !== 'var';
}

/**
 * @class Scope
 */

var Scope = function () {
    function Scope(scopeManager, type, upperScope, block, isMethodDefinition) {
        _classCallCheck(this, Scope);

        /**
         * One of 'TDZ', 'module', 'block', 'switch', 'function', 'catch', 'with', 'function', 'class', 'global'.
         * @member {String} Scope#type
         */
        this.type = type;
        /**
        * The scoped {@link Variable}s of this scope, as <code>{ Variable.name
        * : Variable }</code>.
        * @member {Map} Scope#set
        */
        this.set = new _es6Map2.default();
        /**
         * The tainted variables of this scope, as <code>{ Variable.name :
         * boolean }</code>.
         * @member {Map} Scope#taints */
        this.taints = new _es6Map2.default();
        /**
         * Generally, through the lexical scoping of JS you can always know
         * which variable an identifier in the source code refers to. There are
         * a few exceptions to this rule. With 'global' and 'with' scopes you
         * can only decide at runtime which variable a reference refers to.
         * Moreover, if 'eval()' is used in a scope, it might introduce new
         * bindings in this or its parent scopes.
         * All those scopes are considered 'dynamic'.
         * @member {boolean} Scope#dynamic
         */
        this.dynamic = this.type === 'global' || this.type === 'with';
        /**
         * A reference to the scope-defining syntax node.
         * @member {esprima.Node} Scope#block
         */
        this.block = block;
        /**
        * The {@link Reference|references} that are not resolved with this scope.
        * @member {Reference[]} Scope#through
        */
        this.through = [];
        /**
        * The scoped {@link Variable}s of this scope. In the case of a
        * 'function' scope this includes the automatic argument <em>arguments</em> as
        * its first element, as well as all further formal arguments.
        * @member {Variable[]} Scope#variables
        */
        this.variables = [];
        /**
        * Any variable {@link Reference|reference} found in this scope. This
        * includes occurrences of local variables as well as variables from
        * parent scopes (including the global scope). For local variables
        * this also includes defining occurrences (like in a 'var' statement).
        * In a 'function' scope this does not include the occurrences of the
        * formal parameter in the parameter list.
        * @member {Reference[]} Scope#references
        */
        this.references = [];

        /**
        * For 'global' and 'function' scopes, this is a self-reference. For
        * other scope types this is the <em>variableScope</em> value of the
        * parent scope.
        * @member {Scope} Scope#variableScope
        */
        this.variableScope = this.type === 'global' || this.type === 'function' || this.type === 'module' ? this : upperScope.variableScope;
        /**
        * Whether this scope is created by a FunctionExpression.
        * @member {boolean} Scope#functionExpressionScope
        */
        this.functionExpressionScope = false;
        /**
        * Whether this is a scope that contains an 'eval()' invocation.
        * @member {boolean} Scope#directCallToEvalScope
        */
        this.directCallToEvalScope = false;
        /**
        * @member {boolean} Scope#thisFound
        */
        this.thisFound = false;

        this.__left = [];

        /**
        * Reference to the parent {@link Scope|scope}.
        * @member {Scope} Scope#upper
        */
        this.upper = upperScope;
        /**
        * Whether 'use strict' is in effect in this scope.
        * @member {boolean} Scope#isStrict
        */
        this.isStrict = isStrictScope(this, block, isMethodDefinition, scopeManager.__useDirective());

        /**
        * List of nested {@link Scope}s.
        * @member {Scope[]} Scope#childScopes
        */
        this.childScopes = [];
        if (this.upper) {
            this.upper.childScopes.push(this);
        }

        this.__declaredVariables = scopeManager.__declaredVariables;

        registerScope(scopeManager, this);
    }

    _createClass(Scope, [{
        key: '__shouldStaticallyClose',
        value: function __shouldStaticallyClose(scopeManager) {
            return !this.dynamic || scopeManager.__isOptimistic();
        }
    }, {
        key: '__shouldStaticallyCloseForGlobal',
        value: function __shouldStaticallyCloseForGlobal(ref) {
            // On global scope, let/const/class declarations should be resolved statically.
            var name = ref.identifier.name;
            if (!this.set.has(name)) {
                return false;
            }

            var variable = this.set.get(name);
            var defs = variable.defs;
            return defs.length > 0 && defs.every(shouldBeStatically);
        }
    }, {
        key: '__staticCloseRef',
        value: function __staticCloseRef(ref) {
            if (!this.__resolve(ref)) {
                this.__delegateToUpperScope(ref);
            }
        }
    }, {
        key: '__dynamicCloseRef',
        value: function __dynamicCloseRef(ref) {
            // notify all names are through to global
            var current = this;
            do {
                current.through.push(ref);
                current = current.upper;
            } while (current);
        }
    }, {
        key: '__globalCloseRef',
        value: function __globalCloseRef(ref) {
            // let/const/class declarations should be resolved statically.
            // others should be resolved dynamically.
            if (this.__shouldStaticallyCloseForGlobal(ref)) {
                this.__staticCloseRef(ref);
            } else {
                this.__dynamicCloseRef(ref);
            }
        }
    }, {
        key: '__close',
        value: function __close(scopeManager) {
            var closeRef;
            if (this.__shouldStaticallyClose(scopeManager)) {
                closeRef = this.__staticCloseRef;
            } else if (this.type !== 'global') {
                closeRef = this.__dynamicCloseRef;
            } else {
                closeRef = this.__globalCloseRef;
            }

            // Try Resolving all references in this scope.
            for (var i = 0, iz = this.__left.length; i < iz; ++i) {
                var ref = this.__left[i];
                closeRef.call(this, ref);
            }
            this.__left = null;

            return this.upper;
        }
    }, {
        key: '__resolve',
        value: function __resolve(ref) {
            var variable, name;
            name = ref.identifier.name;
            if (this.set.has(name)) {
                variable = this.set.get(name);
                variable.references.push(ref);
                variable.stack = variable.stack && ref.from.variableScope === this.variableScope;
                if (ref.tainted) {
                    variable.tainted = true;
                    this.taints.set(variable.name, true);
                }
                ref.resolved = variable;
                return true;
            }
            return false;
        }
    }, {
        key: '__delegateToUpperScope',
        value: function __delegateToUpperScope(ref) {
            if (this.upper) {
                this.upper.__left.push(ref);
            }
            this.through.push(ref);
        }
    }, {
        key: '__addDeclaredVariablesOfNode',
        value: function __addDeclaredVariablesOfNode(variable, node) {
            if (node == null) {
                return;
            }

            var variables = this.__declaredVariables.get(node);
            if (variables == null) {
                variables = [];
                this.__declaredVariables.set(node, variables);
            }
            if (variables.indexOf(variable) === -1) {
                variables.push(variable);
            }
        }
    }, {
        key: '__defineGeneric',
        value: function __defineGeneric(name, set, variables, node, def) {
            var variable;

            variable = set.get(name);
            if (!variable) {
                variable = new _variable2.default(name, this);
                set.set(name, variable);
                variables.push(variable);
            }

            if (def) {
                variable.defs.push(def);
                if (def.type !== _variable2.default.TDZ) {
                    this.__addDeclaredVariablesOfNode(variable, def.node);
                    this.__addDeclaredVariablesOfNode(variable, def.parent);
                }
            }
            if (node) {
                variable.identifiers.push(node);
            }
        }
    }, {
        key: '__define',
        value: function __define(node, def) {
            if (node && node.type === _estraverse.Syntax.Identifier) {
                this.__defineGeneric(node.name, this.set, this.variables, node, def);
            }
        }
    }, {
        key: '__referencing',
        value: function __referencing(node, assign, writeExpr, maybeImplicitGlobal, partial, init) {
            // because Array element may be null
            if (!node || node.type !== _estraverse.Syntax.Identifier) {
                return;
            }

            // Specially handle like `this`.
            if (node.name === 'super') {
                return;
            }

            var ref = new _reference2.default(node, this, assign || _reference2.default.READ, writeExpr, maybeImplicitGlobal, !!partial, !!init);
            this.references.push(ref);
            this.__left.push(ref);
        }
    }, {
        key: '__detectEval',
        value: function __detectEval() {
            var current;
            current = this;
            this.directCallToEvalScope = true;
            do {
                current.dynamic = true;
                current = current.upper;
            } while (current);
        }
    }, {
        key: '__detectThis',
        value: function __detectThis() {
            this.thisFound = true;
        }
    }, {
        key: '__isClosed',
        value: function __isClosed() {
            return this.__left === null;
        }

        /**
         * returns resolved {Reference}
         * @method Scope#resolve
         * @param {Esprima.Identifier} ident - identifier to be resolved.
         * @return {Reference}
         */

    }, {
        key: 'resolve',
        value: function resolve(ident) {
            var ref, i, iz;
            (0, _assert2.default)(this.__isClosed(), 'Scope should be closed.');
            (0, _assert2.default)(ident.type === _estraverse.Syntax.Identifier, 'Target should be identifier.');
            for (i = 0, iz = this.references.length; i < iz; ++i) {
                ref = this.references[i];
                if (ref.identifier === ident) {
                    return ref;
                }
            }
            return null;
        }

        /**
         * returns this scope is static
         * @method Scope#isStatic
         * @return {boolean}
         */

    }, {
        key: 'isStatic',
        value: function isStatic() {
            return !this.dynamic;
        }

        /**
         * returns this scope has materialized arguments
         * @method Scope#isArgumentsMaterialized
         * @return {boolean}
         */

    }, {
        key: 'isArgumentsMaterialized',
        value: function isArgumentsMaterialized() {
            return true;
        }

        /**
         * returns this scope has materialized `this` reference
         * @method Scope#isThisMaterialized
         * @return {boolean}
         */

    }, {
        key: 'isThisMaterialized',
        value: function isThisMaterialized() {
            return true;
        }
    }, {
        key: 'isUsedName',
        value: function isUsedName(name) {
            if (this.set.has(name)) {
                return true;
            }
            for (var i = 0, iz = this.through.length; i < iz; ++i) {
                if (this.through[i].identifier.name === name) {
                    return true;
                }
            }
            return false;
        }
    }]);

    return Scope;
}();

exports.default = Scope;

var GlobalScope = exports.GlobalScope = function (_Scope) {
    _inherits(GlobalScope, _Scope);

    function GlobalScope(scopeManager, block) {
        _classCallCheck(this, GlobalScope);

        var _this = _possibleConstructorReturn(this, (GlobalScope.__proto__ || Object.getPrototypeOf(GlobalScope)).call(this, scopeManager, 'global', null, block, false));

        _this.implicit = {
            set: new _es6Map2.default(),
            variables: [],
            /**
            * List of {@link Reference}s that are left to be resolved (i.e. which
            * need to be linked to the variable they refer to).
            * @member {Reference[]} Scope#implicit#left
            */
            left: []
        };
        return _this;
    }

    _createClass(GlobalScope, [{
        key: '__close',
        value: function __close(scopeManager) {
            var implicit = [];
            for (var i = 0, iz = this.__left.length; i < iz; ++i) {
                var ref = this.__left[i];
                if (ref.__maybeImplicitGlobal && !this.set.has(ref.identifier.name)) {
                    implicit.push(ref.__maybeImplicitGlobal);
                }
            }

            // create an implicit global variable from assignment expression
            for (var _i = 0, _iz = implicit.length; _i < _iz; ++_i) {
                var info = implicit[_i];
                this.__defineImplicit(info.pattern, new _definition2.default(_variable2.default.ImplicitGlobalVariable, info.pattern, info.node, null, null, null));
            }

            this.implicit.left = this.__left;

            return _get(GlobalScope.prototype.__proto__ || Object.getPrototypeOf(GlobalScope.prototype), '__close', this).call(this, scopeManager);
        }
    }, {
        key: '__defineImplicit',
        value: function __defineImplicit(node, def) {
            if (node && node.type === _estraverse.Syntax.Identifier) {
                this.__defineGeneric(node.name, this.implicit.set, this.implicit.variables, node, def);
            }
        }
    }]);

    return GlobalScope;
}(Scope);

var ModuleScope = exports.ModuleScope = function (_Scope2) {
    _inherits(ModuleScope, _Scope2);

    function ModuleScope(scopeManager, upperScope, block) {
        _classCallCheck(this, ModuleScope);

        return _possibleConstructorReturn(this, (ModuleScope.__proto__ || Object.getPrototypeOf(ModuleScope)).call(this, scopeManager, 'module', upperScope, block, false));
    }

    return ModuleScope;
}(Scope);

var FunctionExpressionNameScope = exports.FunctionExpressionNameScope = function (_Scope3) {
    _inherits(FunctionExpressionNameScope, _Scope3);

    function FunctionExpressionNameScope(scopeManager, upperScope, block) {
        _classCallCheck(this, FunctionExpressionNameScope);

        var _this3 = _possibleConstructorReturn(this, (FunctionExpressionNameScope.__proto__ || Object.getPrototypeOf(FunctionExpressionNameScope)).call(this, scopeManager, 'function-expression-name', upperScope, block, false));

        _this3.__define(block.id, new _definition2.default(_variable2.default.FunctionName, block.id, block, null, null, null));
        _this3.functionExpressionScope = true;
        return _this3;
    }

    return FunctionExpressionNameScope;
}(Scope);

var CatchScope = exports.CatchScope = function (_Scope4) {
    _inherits(CatchScope, _Scope4);

    function CatchScope(scopeManager, upperScope, block) {
        _classCallCheck(this, CatchScope);

        return _possibleConstructorReturn(this, (CatchScope.__proto__ || Object.getPrototypeOf(CatchScope)).call(this, scopeManager, 'catch', upperScope, block, false));
    }

    return CatchScope;
}(Scope);

var WithScope = exports.WithScope = function (_Scope5) {
    _inherits(WithScope, _Scope5);

    function WithScope(scopeManager, upperScope, block) {
        _classCallCheck(this, WithScope);

        return _possibleConstructorReturn(this, (WithScope.__proto__ || Object.getPrototypeOf(WithScope)).call(this, scopeManager, 'with', upperScope, block, false));
    }

    _createClass(WithScope, [{
        key: '__close',
        value: function __close(scopeManager) {
            if (this.__shouldStaticallyClose(scopeManager)) {
                return _get(WithScope.prototype.__proto__ || Object.getPrototypeOf(WithScope.prototype), '__close', this).call(this, scopeManager);
            }

            for (var i = 0, iz = this.__left.length; i < iz; ++i) {
                var ref = this.__left[i];
                ref.tainted = true;
                this.__delegateToUpperScope(ref);
            }
            this.__left = null;

            return this.upper;
        }
    }]);

    return WithScope;
}(Scope);

var TDZScope = exports.TDZScope = function (_Scope6) {
    _inherits(TDZScope, _Scope6);

    function TDZScope(scopeManager, upperScope, block) {
        _classCallCheck(this, TDZScope);

        return _possibleConstructorReturn(this, (TDZScope.__proto__ || Object.getPrototypeOf(TDZScope)).call(this, scopeManager, 'TDZ', upperScope, block, false));
    }

    return TDZScope;
}(Scope);

var BlockScope = exports.BlockScope = function (_Scope7) {
    _inherits(BlockScope, _Scope7);

    function BlockScope(scopeManager, upperScope, block) {
        _classCallCheck(this, BlockScope);

        return _possibleConstructorReturn(this, (BlockScope.__proto__ || Object.getPrototypeOf(BlockScope)).call(this, scopeManager, 'block', upperScope, block, false));
    }

    return BlockScope;
}(Scope);

var SwitchScope = exports.SwitchScope = function (_Scope8) {
    _inherits(SwitchScope, _Scope8);

    function SwitchScope(scopeManager, upperScope, block) {
        _classCallCheck(this, SwitchScope);

        return _possibleConstructorReturn(this, (SwitchScope.__proto__ || Object.getPrototypeOf(SwitchScope)).call(this, scopeManager, 'switch', upperScope, block, false));
    }

    return SwitchScope;
}(Scope);

var FunctionScope = exports.FunctionScope = function (_Scope9) {
    _inherits(FunctionScope, _Scope9);

    function FunctionScope(scopeManager, upperScope, block, isMethodDefinition) {
        _classCallCheck(this, FunctionScope);

        // section 9.2.13, FunctionDeclarationInstantiation.
        // NOTE Arrow functions never have an arguments objects.
        var _this9 = _possibleConstructorReturn(this, (FunctionScope.__proto__ || Object.getPrototypeOf(FunctionScope)).call(this, scopeManager, 'function', upperScope, block, isMethodDefinition));

        if (_this9.block.type !== _estraverse.Syntax.ArrowFunctionExpression) {
            _this9.__defineArguments();
        }
        return _this9;
    }

    _createClass(FunctionScope, [{
        key: 'isArgumentsMaterialized',
        value: function isArgumentsMaterialized() {
            // TODO(Constellation)
            // We can more aggressive on this condition like this.
            //
            // function t() {
            //     // arguments of t is always hidden.
            //     function arguments() {
            //     }
            // }
            if (this.block.type === _estraverse.Syntax.ArrowFunctionExpression) {
                return false;
            }

            if (!this.isStatic()) {
                return true;
            }

            var variable = this.set.get('arguments');
            (0, _assert2.default)(variable, 'Always have arguments variable.');
            return variable.tainted || variable.references.length !== 0;
        }
    }, {
        key: 'isThisMaterialized',
        value: function isThisMaterialized() {
            if (!this.isStatic()) {
                return true;
            }
            return this.thisFound;
        }
    }, {
        key: '__defineArguments',
        value: function __defineArguments() {
            this.__defineGeneric('arguments', this.set, this.variables, null, null);
            this.taints.set('arguments', true);
        }
    }]);

    return FunctionScope;
}(Scope);

var ForScope = exports.ForScope = function (_Scope10) {
    _inherits(ForScope, _Scope10);

    function ForScope(scopeManager, upperScope, block) {
        _classCallCheck(this, ForScope);

        return _possibleConstructorReturn(this, (ForScope.__proto__ || Object.getPrototypeOf(ForScope)).call(this, scopeManager, 'for', upperScope, block, false));
    }

    return ForScope;
}(Scope);

var ClassScope = exports.ClassScope = function (_Scope11) {
    _inherits(ClassScope, _Scope11);

    function ClassScope(scopeManager, upperScope, block) {
        _classCallCheck(this, ClassScope);

        return _possibleConstructorReturn(this, (ClassScope.__proto__ || Object.getPrototypeOf(ClassScope)).call(this, scopeManager, 'class', upperScope, block, false));
    }

    return ClassScope;
}(Scope);

/* vim: set sw=4 ts=4 et tw=80 : */
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNjb3BlLmpzIl0sIm5hbWVzIjpbImlzU3RyaWN0U2NvcGUiLCJzY29wZSIsImJsb2NrIiwiaXNNZXRob2REZWZpbml0aW9uIiwidXNlRGlyZWN0aXZlIiwiYm9keSIsImkiLCJpeiIsInN0bXQiLCJleHByIiwidXBwZXIiLCJpc1N0cmljdCIsInR5cGUiLCJBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbiIsIlByb2dyYW0iLCJsZW5ndGgiLCJEaXJlY3RpdmVTdGF0ZW1lbnQiLCJyYXciLCJFeHByZXNzaW9uU3RhdGVtZW50IiwiZXhwcmVzc2lvbiIsIkxpdGVyYWwiLCJ2YWx1ZSIsInJlZ2lzdGVyU2NvcGUiLCJzY29wZU1hbmFnZXIiLCJzY29wZXMiLCJwdXNoIiwiX19ub2RlVG9TY29wZSIsImdldCIsInNldCIsInNob3VsZEJlU3RhdGljYWxseSIsImRlZiIsIkNsYXNzTmFtZSIsIlZhcmlhYmxlIiwicGFyZW50Iiwia2luZCIsIlNjb3BlIiwidXBwZXJTY29wZSIsInRhaW50cyIsImR5bmFtaWMiLCJ0aHJvdWdoIiwidmFyaWFibGVzIiwicmVmZXJlbmNlcyIsInZhcmlhYmxlU2NvcGUiLCJmdW5jdGlvbkV4cHJlc3Npb25TY29wZSIsImRpcmVjdENhbGxUb0V2YWxTY29wZSIsInRoaXNGb3VuZCIsIl9fbGVmdCIsIl9fdXNlRGlyZWN0aXZlIiwiY2hpbGRTY29wZXMiLCJfX2RlY2xhcmVkVmFyaWFibGVzIiwiX19pc09wdGltaXN0aWMiLCJyZWYiLCJuYW1lIiwiaWRlbnRpZmllciIsImhhcyIsInZhcmlhYmxlIiwiZGVmcyIsImV2ZXJ5IiwiX19yZXNvbHZlIiwiX19kZWxlZ2F0ZVRvVXBwZXJTY29wZSIsImN1cnJlbnQiLCJfX3Nob3VsZFN0YXRpY2FsbHlDbG9zZUZvckdsb2JhbCIsIl9fc3RhdGljQ2xvc2VSZWYiLCJfX2R5bmFtaWNDbG9zZVJlZiIsImNsb3NlUmVmIiwiX19zaG91bGRTdGF0aWNhbGx5Q2xvc2UiLCJfX2dsb2JhbENsb3NlUmVmIiwiY2FsbCIsInN0YWNrIiwiZnJvbSIsInRhaW50ZWQiLCJyZXNvbHZlZCIsIm5vZGUiLCJpbmRleE9mIiwiVERaIiwiX19hZGREZWNsYXJlZFZhcmlhYmxlc09mTm9kZSIsImlkZW50aWZpZXJzIiwiSWRlbnRpZmllciIsIl9fZGVmaW5lR2VuZXJpYyIsImFzc2lnbiIsIndyaXRlRXhwciIsIm1heWJlSW1wbGljaXRHbG9iYWwiLCJwYXJ0aWFsIiwiaW5pdCIsIlJFQUQiLCJpZGVudCIsIl9faXNDbG9zZWQiLCJHbG9iYWxTY29wZSIsImltcGxpY2l0IiwibGVmdCIsIl9fbWF5YmVJbXBsaWNpdEdsb2JhbCIsImluZm8iLCJfX2RlZmluZUltcGxpY2l0IiwicGF0dGVybiIsIkltcGxpY2l0R2xvYmFsVmFyaWFibGUiLCJNb2R1bGVTY29wZSIsIkZ1bmN0aW9uRXhwcmVzc2lvbk5hbWVTY29wZSIsIl9fZGVmaW5lIiwiaWQiLCJGdW5jdGlvbk5hbWUiLCJDYXRjaFNjb3BlIiwiV2l0aFNjb3BlIiwiVERaU2NvcGUiLCJCbG9ja1Njb3BlIiwiU3dpdGNoU2NvcGUiLCJGdW5jdGlvblNjb3BlIiwiX19kZWZpbmVBcmd1bWVudHMiLCJpc1N0YXRpYyIsIkZvclNjb3BlIiwiQ2xhc3NTY29wZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O3FqQkFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0JBOztBQUNBOzs7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7OztBQUVBLFNBQVNBLGFBQVQsQ0FBdUJDLEtBQXZCLEVBQThCQyxLQUE5QixFQUFxQ0Msa0JBQXJDLEVBQXlEQyxZQUF6RCxFQUF1RTtBQUNuRSxRQUFJQyxJQUFKLEVBQVVDLENBQVYsRUFBYUMsRUFBYixFQUFpQkMsSUFBakIsRUFBdUJDLElBQXZCOztBQUVBO0FBQ0EsUUFBSVIsTUFBTVMsS0FBTixJQUFlVCxNQUFNUyxLQUFOLENBQVlDLFFBQS9CLEVBQXlDO0FBQ3JDLGVBQU8sSUFBUDtBQUNIOztBQUVEO0FBQ0Es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QUFFNUM7OztFQUgyQmlDLEs7O0FBTWhDIiwiZmlsZSI6InNjb3BlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAgQ29weXJpZ2h0IChDKSAyMDE1IFl1c3VrZSBTdXp1a2kgPHV0YXRhbmUudGVhQGdtYWlsLmNvbT5cblxuICBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAgbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG5cbiAgICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0XG4gICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gICAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodFxuICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZVxuICAgICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cblxuICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIlxuICBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFXG4gIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFXG4gIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCA8Q09QWVJJR0hUIEhPTERFUj4gQkUgTElBQkxFIEZPUiBBTllcbiAgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVNcbiAgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTO1xuICBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkRcbiAgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbiAgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GXG4gIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4qL1xuXG5pbXBvcnQgeyBTeW50YXggfSBmcm9tICdlc3RyYXZlcnNlJztcbmltcG9ydCBNYXAgZnJvbSAnZXM2LW1hcCc7XG5cbmltcG9ydCBSZWZlcmVuY2UgZnJvbSAnLi9yZWZlcmVuY2UnO1xuaW1wb3J0IFZhcmlhYmxlIGZyb20gJy4vdmFyaWFibGUnO1xuaW1wb3J0IERlZmluaXRpb24gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuZnVuY3Rpb24gaXNTdHJpY3RTY29wZShzY29wZSwgYmxvY2ssIGlzTWV0aG9kRGVmaW5pdGlvbiwgdXNlRGlyZWN0aXZlKSB7XG4gICAgdmFyIGJvZHksIGksIGl6LCBzdG10LCBleHByO1xuXG4gICAgLy8gV2hlbiB1cHBlciBzY29wZSBpcyBleGlzdHMgYW5kIHN0cmljdCwgaW5uZXIgc2NvcGUgaXMgYWxzbyBzdHJpY3QuXG4gICAgaWYgKHNjb3BlLnVwcGVyICYmIHNjb3BlLnVwcGVyLmlzU3RyaWN0KSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIEFycm93RnVuY3Rpb25FeHByZXNzaW9uJ3Mgc2NvcGUgaXMgYWx3YXlzIHN0cmljdCBzY29wZS5cbiAgICBpZiAoYmxvY2sudHlwZSA9PT0gU3ludGF4LkFycm93RnVuY3Rpb25FeHByZXNzaW9uKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmIChpc01ldGhvZERlZmluaXRpb24pIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHNjb3BlLnR5cGUgPT09ICdjbGFzcycgfHwgc2NvcGUudHlwZSA9PT0gJ21vZHVsZScpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHNjb3BlLnR5cGUgPT09ICdibG9jaycgfHwgc2NvcGUudHlwZSA9PT0gJ3N3aXRjaCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChzY29wZS50eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGlmIChibG9jay50eXBlID09PSBTeW50YXguUHJvZ3JhbSkge1xuICAgICAgICAgICAgYm9keSA9IGJsb2NrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYm9keSA9IGJsb2NrLmJvZHk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHNjb3BlLnR5cGUgPT09ICdnbG9iYWwnKSB7XG4gICAgICAgIGJvZHkgPSBibG9jaztcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gU2VhcmNoICd1c2Ugc3RyaWN0JyBkaXJlY3RpdmUuXG4gICAgaWYgKHVzZURpcmVjdGl2ZSkge1xuICAgICAgICBmb3IgKGkgPSAwLCBpeiA9IGJvZHkuYm9keS5sZW5ndGg7IGkgPCBpejsgKytpKSB7XG4gICAgICAgICAgICBzdG10ID0gYm9keS5ib2R5W2ldO1xuICAgICAgICAgICAgaWYgKHN0bXQudHlwZSAhPT0gU3ludGF4LkRpcmVjdGl2ZVN0YXRlbWVudCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN0bXQucmF3ID09PSAnXCJ1c2Ugc3RyaWN0XCInIHx8IHN0bXQucmF3ID09PSAnXFwndXNlIHN0cmljdFxcJycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoaSA9IDAsIGl6ID0gYm9keS5ib2R5Lmxlbmd0aDsgaSA8IGl6OyArK2kpIHtcbiAgICAgICAgICAgIHN0bXQgPSBib2R5LmJvZHlbaV07XG4gICAgICAgICAgICBpZiAoc3RtdC50eXBlICE9PSBTeW50YXguRXhwcmVzc2lvblN0YXRlbWVudCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXhwciA9IHN0bXQuZXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGlmIChleHByLnR5cGUgIT09IFN5bnRheC5MaXRlcmFsIHx8IHR5cGVvZiBleHByLnZhbHVlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGV4cHIucmF3ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXhwci5yYXcgPT09ICdcInVzZSBzdHJpY3RcIicgfHwgZXhwci5yYXcgPT09ICdcXCd1c2Ugc3RyaWN0XFwnJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChleHByLnZhbHVlID09PSAndXNlIHN0cmljdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gcmVnaXN0ZXJTY29wZShzY29wZU1hbmFnZXIsIHNjb3BlKSB7XG4gICAgdmFyIHNjb3BlcztcblxuICAgIHNjb3BlTWFuYWdlci5zY29wZXMucHVzaChzY29wZSk7XG5cbiAgICBzY29wZXMgPSBzY29wZU1hbmFnZXIuX19ub2RlVG9TY29wZS5nZXQoc2NvcGUuYmxvY2spO1xuICAgIGlmIChzY29wZXMpIHtcbiAgICAgICAgc2NvcGVzLnB1c2goc2NvcGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNjb3BlTWFuYWdlci5fX25vZGVUb1Njb3BlLnNldChzY29wZS5ibG9jaywgWyBzY29wZSBdKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNob3VsZEJlU3RhdGljYWxseShkZWYpIHtcbiAgICByZXR1cm4gKFxuICAgICAgICAoZGVmLnR5cGUgPT09IFZhcmlhYmxlLkNsYXNzTmFtZSkgfHxcbiAgICAgICAgKGRlZi50eXBlID09PSBWYXJpYWJsZS5WYXJpYWJsZSAmJiBkZWYucGFyZW50LmtpbmQgIT09ICd2YXInKVxuICAgICk7XG59XG5cbi8qKlxuICogQGNsYXNzIFNjb3BlXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNjb3BlIHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZU1hbmFnZXIsIHR5cGUsIHVwcGVyU2NvcGUsIGJsb2NrLCBpc01ldGhvZERlZmluaXRpb24pIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9uZSBvZiAnVERaJywgJ21vZHVsZScsICdibG9jaycsICdzd2l0Y2gnLCAnZnVuY3Rpb24nLCAnY2F0Y2gnLCAnd2l0aCcsICdmdW5jdGlvbicsICdjbGFzcycsICdnbG9iYWwnLlxuICAgICAgICAgKiBAbWVtYmVyIHtTdHJpbmd9IFNjb3BlI3R5cGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHNjb3BlZCB7QGxpbmsgVmFyaWFibGV9cyBvZiB0aGlzIHNjb3BlLCBhcyA8Y29kZT57IFZhcmlhYmxlLm5hbWVcbiAgICAgICAgICogOiBWYXJpYWJsZSB9PC9jb2RlPi5cbiAgICAgICAgICogQG1lbWJlciB7TWFwfSBTY29wZSNzZXRcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuc2V0ID0gbmV3IE1hcCgpO1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHRhaW50ZWQgdmFyaWFibGVzIG9mIHRoaXMgc2NvcGUsIGFzIDxjb2RlPnsgVmFyaWFibGUubmFtZSA6XG4gICAgICAgICAqIGJvb2xlYW4gfTwvY29kZT4uXG4gICAgICAgICAqIEBtZW1iZXIge01hcH0gU2NvcGUjdGFpbnRzICovXG4gICAgICAgIHRoaXMudGFpbnRzID0gbmV3IE1hcCgpO1xuICAgICAgICAvKipcbiAgICAgICAgICogR2VuZXJhbGx5LCB0aHJvdWdoIHRoZSBsZXhpY2FsIHNjb3Bpbmcgb2YgSlMgeW91IGNhbiBhbHdheXMga25vd1xuICAgICAgICAgKiB3aGljaCB2YXJpYWJsZSBhbiBpZGVudGlmaWVyIGluIHRoZSBzb3VyY2UgY29kZSByZWZlcnMgdG8uIFRoZXJlIGFyZVxuICAgICAgICAgKiBhIGZldyBleGNlcHRpb25zIHRvIHRoaXMgcnVsZS4gV2l0aCAnZ2xvYmFsJyBhbmQgJ3dpdGgnIHNjb3BlcyB5b3VcbiAgICAgICAgICogY2FuIG9ubHkgZGVjaWRlIGF0IHJ1bnRpbWUgd2hpY2ggdmFyaWFibGUgYSByZWZlcmVuY2UgcmVmZXJzIHRvLlxuICAgICAgICAgKiBNb3Jlb3ZlciwgaWYgJ2V2YWwoKScgaXMgdXNlZCBpbiBhIHNjb3BlLCBpdCBtaWdodCBpbnRyb2R1Y2UgbmV3XG4gICAgICAgICAqIGJpbmRpbmdzIGluIHRoaXMgb3IgaXRzIHBhcmVudCBzY29wZXMuXG4gICAgICAgICAqIEFsbCB0aG9zZSBzY29wZXMgYXJlIGNvbnNpZGVyZWQgJ2R5bmFtaWMnLlxuICAgICAgICAgKiBAbWVtYmVyIHtib29sZWFufSBTY29wZSNkeW5hbWljXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmR5bmFtaWMgPSB0aGlzLnR5cGUgPT09ICdnbG9iYWwnIHx8IHRoaXMudHlwZSA9PT0gJ3dpdGgnO1xuICAgICAgICAvKipcbiAgICAgICAgICogQSByZWZlcmVuY2UgdG8gdGhlIHNjb3BlLWRlZmluaW5nIHN5bnRheCBub2RlLlxuICAgICAgICAgKiBAbWVtYmVyIHtlc3ByaW1hLk5vZGV9IFNjb3BlI2Jsb2NrXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmJsb2NrID0gYmxvY2s7XG4gICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHtAbGluayBSZWZlcmVuY2V8cmVmZXJlbmNlc30gdGhhdCBhcmUgbm90IHJlc29sdmVkIHdpdGggdGhpcyBzY29wZS5cbiAgICAgICAgICogQG1lbWJlciB7UmVmZXJlbmNlW119IFNjb3BlI3Rocm91Z2hcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudGhyb3VnaCA9IFtdO1xuICAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBzY29wZWQge0BsaW5rIFZhcmlhYmxlfXMgb2YgdGhpcyBzY29wZS4gSW4gdGhlIGNhc2Ugb2YgYVxuICAgICAgICAgKiAnZnVuY3Rpb24nIHNjb3BlIHRoaXMgaW5jbHVkZXMgdGhlIGF1dG9tYXRpYyBhcmd1bWVudCA8ZW0+YXJndW1lbnRzPC9lbT4gYXNcbiAgICAgICAgICogaXRzIGZpcnN0IGVsZW1lbnQsIGFzIHdlbGwgYXMgYWxsIGZ1cnRoZXIgZm9ybWFsIGFyZ3VtZW50cy5cbiAgICAgICAgICogQG1lbWJlciB7VmFyaWFibGVbXX0gU2NvcGUjdmFyaWFibGVzXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnZhcmlhYmxlcyA9IFtdO1xuICAgICAgICAgLyoqXG4gICAgICAgICAqIEFueSB2YXJpYWJsZSB7QGxpbmsgUmVmZXJlbmNlfHJlZmVyZW5jZX0gZm91bmQgaW4gdGhpcyBzY29wZS4gVGhpc1xuICAgICAgICAgKiBpbmNsdWRlcyBvY2N1cnJlbmNlcyBvZiBsb2NhbCB2YXJpYWJsZXMgYXMgd2VsbCBhcyB2YXJpYWJsZXMgZnJvbVxuICAgICAgICAgKiBwYXJlbnQgc2NvcGVzIChpbmNsdWRpbmcgdGhlIGdsb2JhbCBzY29wZSkuIEZvciBsb2NhbCB2YXJpYWJsZXNcbiAgICAgICAgICogdGhpcyBhbHNvIGluY2x1ZGVzIGRlZmluaW5nIG9jY3VycmVuY2VzIChsaWtlIGluIGEgJ3Zhcicgc3RhdGVtZW50KS5cbiAgICAgICAgICogSW4gYSAnZnVuY3Rpb24nIHNjb3BlIHRoaXMgZG9lcyBub3QgaW5jbHVkZSB0aGUgb2NjdXJyZW5jZXMgb2YgdGhlXG4gICAgICAgICAqIGZvcm1hbCBwYXJhbWV0ZXIgaW4gdGhlIHBhcmFtZXRlciBsaXN0LlxuICAgICAgICAgKiBAbWVtYmVyIHtSZWZlcmVuY2VbXX0gU2NvcGUjcmVmZXJlbmNlc1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZWZlcmVuY2VzID0gW107XG5cbiAgICAgICAgIC8qKlxuICAgICAgICAgKiBGb3IgJ2dsb2JhbCcgYW5kICdmdW5jdGlvbicgc2NvcGVzLCB0aGlzIGlzIGEgc2VsZi1yZWZlcmVuY2UuIEZvclxuICAgICAgICAgKiBvdGhlciBzY29wZSB0eXBlcyB0aGlzIGlzIHRoZSA8ZW0+dmFyaWFibGVTY29wZTwvZW0+IHZhbHVlIG9mIHRoZVxuICAgICAgICAgKiBwYXJlbnQgc2NvcGUuXG4gICAgICAgICAqIEBtZW1iZXIge1Njb3BlfSBTY29wZSN2YXJpYWJsZVNjb3BlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnZhcmlhYmxlU2NvcGUgPVxuICAgICAgICAgICAgKHRoaXMudHlwZSA9PT0gJ2dsb2JhbCcgfHwgdGhpcy50eXBlID09PSAnZnVuY3Rpb24nIHx8IHRoaXMudHlwZSA9PT0gJ21vZHVsZScpID8gdGhpcyA6IHVwcGVyU2NvcGUudmFyaWFibGVTY29wZTtcbiAgICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoaXMgc2NvcGUgaXMgY3JlYXRlZCBieSBhIEZ1bmN0aW9uRXhwcmVzc2lvbi5cbiAgICAgICAgICogQG1lbWJlciB7Ym9vbGVhbn0gU2NvcGUjZnVuY3Rpb25FeHByZXNzaW9uU2NvcGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZnVuY3Rpb25FeHByZXNzaW9uU2NvcGUgPSBmYWxzZTtcbiAgICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoaXMgaXMgYSBzY29wZSB0aGF0IGNvbnRhaW5zIGFuICdldmFsKCknIGludm9jYXRpb24uXG4gICAgICAgICAqIEBtZW1iZXIge2Jvb2xlYW59IFNjb3BlI2RpcmVjdENhbGxUb0V2YWxTY29wZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5kaXJlY3RDYWxsVG9FdmFsU2NvcGUgPSBmYWxzZTtcbiAgICAgICAgIC8qKlxuICAgICAgICAgKiBAbWVtYmVyIHtib29sZWFufSBTY29wZSN0aGlzRm91bmRcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudGhpc0ZvdW5kID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5fX2xlZnQgPSBbXTtcblxuICAgICAgICAgLyoqXG4gICAgICAgICAqIFJlZmVyZW5jZSB0byB0aGUgcGFyZW50IHtAbGluayBTY29wZXxzY29wZX0uXG4gICAgICAgICAqIEBtZW1iZXIge1Njb3BlfSBTY29wZSN1cHBlclxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy51cHBlciA9IHVwcGVyU2NvcGU7XG4gICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciAndXNlIHN0cmljdCcgaXMgaW4gZWZmZWN0IGluIHRoaXMgc2NvcGUuXG4gICAgICAgICAqIEBtZW1iZXIge2Jvb2xlYW59IFNjb3BlI2lzU3RyaWN0XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzU3RyaWN0ID0gaXNTdHJpY3RTY29wZSh0aGlzLCBibG9jaywgaXNNZXRob2REZWZpbml0aW9uLCBzY29wZU1hbmFnZXIuX191c2VEaXJlY3RpdmUoKSk7XG5cbiAgICAgICAgIC8qKlxuICAgICAgICAgKiBMaXN0IG9mIG5lc3RlZCB7QGxpbmsgU2NvcGV9cy5cbiAgICAgICAgICogQG1lbWJlciB7U2NvcGVbXX0gU2NvcGUjY2hpbGRTY29wZXNcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY2hpbGRTY29wZXMgPSBbXTtcbiAgICAgICAgaWYgKHRoaXMudXBwZXIpIHtcbiAgICAgICAgICAgIHRoaXMudXBwZXIuY2hpbGRTY29wZXMucHVzaCh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX19kZWNsYXJlZFZhcmlhYmxlcyA9IHNjb3BlTWFuYWdlci5fX2RlY2xhcmVkVmFyaWFibGVzO1xuXG4gICAgICAgIHJlZ2lzdGVyU2NvcGUoc2NvcGVNYW5hZ2VyLCB0aGlzKTtcbiAgICB9XG5cbiAgICBfX3Nob3VsZFN0YXRpY2FsbHlDbG9zZShzY29wZU1hbmFnZXIpIHtcbiAgICAgICAgcmV0dXJuICghdGhpcy5keW5hbWljIHx8IHNjb3BlTWFuYWdlci5fX2lzT3B0aW1pc3RpYygpKTtcbiAgICB9XG5cbiAgICBfX3Nob3VsZFN0YXRpY2FsbHlDbG9zZUZvckdsb2JhbChyZWYpIHtcbiAgICAgICAgLy8gT24gZ2xvYmFsIHNjb3BlLCBsZXQvY29uc3QvY2xhc3MgZGVjbGFyYXRpb25zIHNob3VsZCBiZSByZXNvbHZlZCBzdGF0aWNhbGx5LlxuICAgICAgICB2YXIgbmFtZSA9IHJlZi5pZGVudGlmaWVyLm5hbWU7XG4gICAgICAgIGlmICghdGhpcy5zZXQuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdmFyaWFibGUgPSB0aGlzLnNldC5nZXQobmFtZSk7XG4gICAgICAgIHZhciBkZWZzID0gdmFyaWFibGUuZGVmcztcbiAgICAgICAgcmV0dXJuIGRlZnMubGVuZ3RoID4gMCAmJiBkZWZzLmV2ZXJ5KHNob3VsZEJlU3RhdGljYWxseSk7XG4gICAgfVxuXG4gICAgX19zdGF0aWNDbG9zZVJlZihyZWYpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9fcmVzb2x2ZShyZWYpKSB7XG4gICAgICAgICAgICB0aGlzLl9fZGVsZWdhdGVUb1VwcGVyU2NvcGUocmVmKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9fZHluYW1pY0Nsb3NlUmVmKHJlZikge1xuICAgICAgICAvLyBub3RpZnkgYWxsIG5hbWVzIGFyZSB0aHJvdWdoIHRvIGdsb2JhbFxuICAgICAgICBsZXQgY3VycmVudCA9IHRoaXM7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIGN1cnJlbnQudGhyb3VnaC5wdXNoKHJlZik7XG4gICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudC51cHBlcjtcbiAgICAgICAgfSB3aGlsZSAoY3VycmVudCk7XG4gICAgfVxuXG4gICAgX19nbG9iYWxDbG9zZVJlZihyZWYpIHtcbiAgICAgICAgLy8gbGV0L2NvbnN0L2NsYXNzIGRlY2xhcmF0aW9ucyBzaG91bGQgYmUgcmVzb2x2ZWQgc3RhdGljYWxseS5cbiAgICAgICAgLy8gb3RoZXJzIHNob3VsZCBiZSByZXNvbHZlZCBkeW5hbWljYWxseS5cbiAgICAgICAgaWYgKHRoaXMuX19zaG91bGRTdGF0aWNhbGx5Q2xvc2VGb3JHbG9iYWwocmVmKSkge1xuICAgICAgICAgICAgdGhpcy5fX3N0YXRpY0Nsb3NlUmVmKHJlZik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9fZHluYW1pY0Nsb3NlUmVmKHJlZik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfX2Nsb3NlKHNjb3BlTWFuYWdlcikge1xuICAgICAgICB2YXIgY2xvc2VSZWY7XG4gICAgICAgIGlmICh0aGlzLl9fc2hvdWxkU3RhdGljYWxseUNsb3NlKHNjb3BlTWFuYWdlcikpIHtcbiAgICAgICAgICAgIGNsb3NlUmVmID0gdGhpcy5fX3N0YXRpY0Nsb3NlUmVmO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMudHlwZSAhPT0gJ2dsb2JhbCcpIHtcbiAgICAgICAgICAgIGNsb3NlUmVmID0gdGhpcy5fX2R5bmFtaWNDbG9zZVJlZjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNsb3NlUmVmID0gdGhpcy5fX2dsb2JhbENsb3NlUmVmO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVHJ5IFJlc29sdmluZyBhbGwgcmVmZXJlbmNlcyBpbiB0aGlzIHNjb3BlLlxuICAgICAgICBmb3IgKGxldCBpID0gMCwgaXogPSB0aGlzLl9fbGVmdC5sZW5ndGg7IGkgPCBpejsgKytpKSB7XG4gICAgICAgICAgICBsZXQgcmVmID0gdGhpcy5fX2xlZnRbaV07XG4gICAgICAgICAgICBjbG9zZVJlZi5jYWxsKHRoaXMsIHJlZik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fX2xlZnQgPSBudWxsO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnVwcGVyO1xuICAgIH1cblxuICAgIF9fcmVzb2x2ZShyZWYpIHtcbiAgICAgICAgdmFyIHZhcmlhYmxlLCBuYW1lO1xuICAgICAgICBuYW1lID0gcmVmLmlkZW50aWZpZXIubmFtZTtcbiAgICAgICAgaWYgKHRoaXMuc2V0LmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgdmFyaWFibGUgPSB0aGlzLnNldC5nZXQobmFtZSk7XG4gICAgICAgICAgICB2YXJpYWJsZS5yZWZlcmVuY2VzLnB1c2gocmVmKTtcbiAgICAgICAgICAgIHZhcmlhYmxlLnN0YWNrID0gdmFyaWFibGUuc3RhY2sgJiYgcmVmLmZyb20udmFyaWFibGVTY29wZSA9PT0gdGhpcy52YXJpYWJsZVNjb3BlO1xuICAgICAgICAgICAgaWYgKHJlZi50YWludGVkKSB7XG4gICAgICAgICAgICAgICAgdmFyaWFibGUudGFpbnRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy50YWludHMuc2V0KHZhcmlhYmxlLm5hbWUsIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVmLnJlc29sdmVkID0gdmFyaWFibGU7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgX19kZWxlZ2F0ZVRvVXBwZXJTY29wZShyZWYpIHtcbiAgICAgICAgaWYgKHRoaXMudXBwZXIpIHtcbiAgICAgICAgICAgIHRoaXMudXBwZXIuX19sZWZ0LnB1c2gocmVmKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRocm91Z2gucHVzaChyZWYpO1xuICAgIH1cblxuICAgIF9fYWRkRGVjbGFyZWRWYXJpYWJsZXNPZk5vZGUodmFyaWFibGUsIG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHZhcmlhYmxlcyA9IHRoaXMuX19kZWNsYXJlZFZhcmlhYmxlcy5nZXQobm9kZSk7XG4gICAgICAgIGlmICh2YXJpYWJsZXMgPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyaWFibGVzID0gW107XG4gICAgICAgICAgICB0aGlzLl9fZGVjbGFyZWRWYXJpYWJsZXMuc2V0KG5vZGUsIHZhcmlhYmxlcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhcmlhYmxlcy5pbmRleE9mKHZhcmlhYmxlKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHZhcmlhYmxlcy5wdXNoKHZhcmlhYmxlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9fZGVmaW5lR2VuZXJpYyhuYW1lLCBzZXQsIHZhcmlhYmxlcywgbm9kZSwgZGVmKSB7XG4gICAgICAgIHZhciB2YXJpYWJsZTtcblxuICAgICAgICB2YXJpYWJsZSA9IHNldC5nZXQobmFtZSk7XG4gICAgICAgIGlmICghdmFyaWFibGUpIHtcbiAgICAgICAgICAgIHZhcmlhYmxlID0gbmV3IFZhcmlhYmxlKG5hbWUsIHRoaXMpO1xuICAgICAgICAgICAgc2V0LnNldChuYW1lLCB2YXJpYWJsZSk7XG4gICAgICAgICAgICB2YXJpYWJsZXMucHVzaCh2YXJpYWJsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGVmKSB7XG4gICAgICAgICAgICB2YXJpYWJsZS5kZWZzLnB1c2goZGVmKTtcbiAgICAgICAgICAgIGlmIChkZWYudHlwZSAhPT0gVmFyaWFibGUuVERaKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fX2FkZERlY2xhcmVkVmFyaWFibGVzT2ZOb2RlKHZhcmlhYmxlLCBkZWYubm9kZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fX2FkZERlY2xhcmVkVmFyaWFibGVzT2ZOb2RlKHZhcmlhYmxlLCBkZWYucGFyZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgdmFyaWFibGUuaWRlbnRpZmllcnMucHVzaChub2RlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9fZGVmaW5lKG5vZGUsIGRlZikge1xuICAgICAgICBpZiAobm9kZSAmJiBub2RlLnR5cGUgPT09IFN5bnRheC5JZGVudGlmaWVyKSB7XG4gICAgICAgICAgICB0aGlzLl9fZGVmaW5lR2VuZXJpYyhcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldCxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52YXJpYWJsZXMsXG4gICAgICAgICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgICAgICAgIGRlZik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfX3JlZmVyZW5jaW5nKG5vZGUsIGFzc2lnbiwgd3JpdGVFeHByLCBtYXliZUltcGxpY2l0R2xvYmFsLCBwYXJ0aWFsLCBpbml0KSB7XG4gICAgICAgIC8vIGJlY2F1c2UgQXJyYXkgZWxlbWVudCBtYXkgYmUgbnVsbFxuICAgICAgICBpZiAoIW5vZGUgfHwgbm9kZS50eXBlICE9PSBTeW50YXguSWRlbnRpZmllcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3BlY2lhbGx5IGhhbmRsZSBsaWtlIGB0aGlzYC5cbiAgICAgICAgaWYgKG5vZGUubmFtZSA9PT0gJ3N1cGVyJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlZiA9IG5ldyBSZWZlcmVuY2Uobm9kZSwgdGhpcywgYXNzaWduIHx8IFJlZmVyZW5jZS5SRUFELCB3cml0ZUV4cHIsIG1heWJlSW1wbGljaXRHbG9iYWwsICEhcGFydGlhbCwgISFpbml0KTtcbiAgICAgICAgdGhpcy5yZWZlcmVuY2VzLnB1c2gocmVmKTtcbiAgICAgICAgdGhpcy5fX2xlZnQucHVzaChyZWYpO1xuICAgIH1cblxuICAgIF9fZGV0ZWN0RXZhbCgpIHtcbiAgICAgICAgdmFyIGN1cnJlbnQ7XG4gICAgICAgIGN1cnJlbnQgPSB0aGlzO1xuICAgICAgICB0aGlzLmRpcmVjdENhbGxUb0V2YWxTY29wZSA9IHRydWU7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIGN1cnJlbnQuZHluYW1pYyA9IHRydWU7XG4gICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudC51cHBlcjtcbiAgICAgICAgfSB3aGlsZSAoY3VycmVudCk7XG4gICAgfVxuXG4gICAgX19kZXRlY3RUaGlzKCkge1xuICAgICAgICB0aGlzLnRoaXNGb3VuZCA9IHRydWU7XG4gICAgfVxuXG4gICAgX19pc0Nsb3NlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19sZWZ0ID09PSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHJldHVybnMgcmVzb2x2ZWQge1JlZmVyZW5jZX1cbiAgICAgKiBAbWV0aG9kIFNjb3BlI3Jlc29sdmVcbiAgICAgKiBAcGFyYW0ge0VzcHJpbWEuSWRlbnRpZmllcn0gaWRlbnQgLSBpZGVudGlmaWVyIHRvIGJlIHJlc29sdmVkLlxuICAgICAqIEByZXR1cm4ge1JlZmVyZW5jZX1cbiAgICAgKi9cbiAgICByZXNvbHZlKGlkZW50KSB7XG4gICAgICAgIHZhciByZWYsIGksIGl6O1xuICAgICAgICBhc3NlcnQodGhpcy5fX2lzQ2xvc2VkKCksICdTY29wZSBzaG91bGQgYmUgY2xvc2VkLicpO1xuICAgICAgICBhc3NlcnQoaWRlbnQudHlwZSA9PT0gU3ludGF4LklkZW50aWZpZXIsICdUYXJnZXQgc2hvdWxkIGJlIGlkZW50aWZpZXIuJyk7XG4gICAgICAgIGZvciAoaSA9IDAsIGl6ID0gdGhpcy5yZWZlcmVuY2VzLmxlbmd0aDsgaSA8IGl6OyArK2kpIHtcbiAgICAgICAgICAgIHJlZiA9IHRoaXMucmVmZXJlbmNlc1tpXTtcbiAgICAgICAgICAgIGlmIChyZWYuaWRlbnRpZmllciA9PT0gaWRlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVmO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHJldHVybnMgdGhpcyBzY29wZSBpcyBzdGF0aWNcbiAgICAgKiBAbWV0aG9kIFNjb3BlI2lzU3RhdGljXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBpc1N0YXRpYygpIHtcbiAgICAgICAgcmV0dXJuICF0aGlzLmR5bmFtaWM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogcmV0dXJucyB0aGlzIHNjb3BlIGhhcyBtYXRlcmlhbGl6ZWQgYXJndW1lbnRzXG4gICAgICogQG1ldGhvZCBTY29wZSNpc0FyZ3VtZW50c01hdGVyaWFsaXplZFxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAgICovXG4gICAgaXNBcmd1bWVudHNNYXRlcmlhbGl6ZWQoKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHJldHVybnMgdGhpcyBzY29wZSBoYXMgbWF0ZXJpYWxpemVkIGB0aGlzYCByZWZlcmVuY2VcbiAgICAgKiBAbWV0aG9kIFNjb3BlI2lzVGhpc01hdGVyaWFsaXplZFxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAgICovXG4gICAgaXNUaGlzTWF0ZXJpYWxpemVkKCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpc1VzZWROYW1lKG5hbWUpIHtcbiAgICAgICAgaWYgKHRoaXMuc2V0LmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGl6ID0gdGhpcy50aHJvdWdoLmxlbmd0aDsgaSA8IGl6OyArK2kpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRocm91Z2hbaV0uaWRlbnRpZmllci5uYW1lID09PSBuYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEdsb2JhbFNjb3BlIGV4dGVuZHMgU2NvcGUge1xuICAgIGNvbnN0cnVjdG9yKHNjb3BlTWFuYWdlciwgYmxvY2spIHtcbiAgICAgICAgc3VwZXIoc2NvcGVNYW5hZ2VyLCAnZ2xvYmFsJywgbnVsbCwgYmxvY2ssIGZhbHNlKTtcbiAgICAgICAgdGhpcy5pbXBsaWNpdCA9IHtcbiAgICAgICAgICAgIHNldDogbmV3IE1hcCgpLFxuICAgICAgICAgICAgdmFyaWFibGVzOiBbXSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgKiBMaXN0IG9mIHtAbGluayBSZWZlcmVuY2V9cyB0aGF0IGFyZSBsZWZ0IHRvIGJlIHJlc29sdmVkIChpLmUuIHdoaWNoXG4gICAgICAgICAgICAqIG5lZWQgdG8gYmUgbGlua2VkIHRvIHRoZSB2YXJpYWJsZSB0aGV5IHJlZmVyIHRvKS5cbiAgICAgICAgICAgICogQG1lbWJlciB7UmVmZXJlbmNlW119IFNjb3BlI2ltcGxpY2l0I2xlZnRcbiAgICAgICAgICAgICovXG4gICAgICAgICAgICBsZWZ0OiBbXVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIF9fY2xvc2Uoc2NvcGVNYW5hZ2VyKSB7XG4gICAgICAgIGxldCBpbXBsaWNpdCA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaXogPSB0aGlzLl9fbGVmdC5sZW5ndGg7IGkgPCBpejsgKytpKSB7XG4gICAgICAgICAgICBsZXQgcmVmID0gdGhpcy5fX2xlZnRbaV07XG4gICAgICAgICAgICBpZiAocmVmLl9fbWF5YmVJbXBsaWNpdEdsb2JhbCAmJiAhdGhpcy5zZXQuaGFzKHJlZi5pZGVudGlmaWVyLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgaW1wbGljaXQucHVzaChyZWYuX19tYXliZUltcGxpY2l0R2xvYmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNyZWF0ZSBhbiBpbXBsaWNpdCBnbG9iYWwgdmFyaWFibGUgZnJvbSBhc3NpZ25tZW50IGV4cHJlc3Npb25cbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGl6ID0gaW1wbGljaXQubGVuZ3RoOyBpIDwgaXo7ICsraSkge1xuICAgICAgICAgICAgbGV0IGluZm8gPSBpbXBsaWNpdFtpXTtcbiAgICAgICAgICAgIHRoaXMuX19kZWZpbmVJbXBsaWNpdChpbmZvLnBhdHRlcm4sXG4gICAgICAgICAgICAgICAgICAgIG5ldyBEZWZpbml0aW9uKFxuICAgICAgICAgICAgICAgICAgICAgICAgVmFyaWFibGUuSW1wbGljaXRHbG9iYWxWYXJpYWJsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucGF0dGVybixcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgbnVsbFxuICAgICAgICAgICAgICAgICAgICApKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbXBsaWNpdC5sZWZ0ID0gdGhpcy5fX2xlZnQ7XG5cbiAgICAgICAgcmV0dXJuIHN1cGVyLl9fY2xvc2Uoc2NvcGVNYW5hZ2VyKTtcbiAgICB9XG5cbiAgICBfX2RlZmluZUltcGxpY2l0KG5vZGUsIGRlZikge1xuICAgICAgICBpZiAobm9kZSAmJiBub2RlLnR5cGUgPT09IFN5bnRheC5JZGVudGlmaWVyKSB7XG4gICAgICAgICAgICB0aGlzLl9fZGVmaW5lR2VuZXJpYyhcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmltcGxpY2l0LnNldCxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbXBsaWNpdC52YXJpYWJsZXMsXG4gICAgICAgICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgICAgICAgIGRlZik7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBNb2R1bGVTY29wZSBleHRlbmRzIFNjb3BlIHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZU1hbmFnZXIsIHVwcGVyU2NvcGUsIGJsb2NrKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlTWFuYWdlciwgJ21vZHVsZScsIHVwcGVyU2NvcGUsIGJsb2NrLCBmYWxzZSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRnVuY3Rpb25FeHByZXNzaW9uTmFtZVNjb3BlIGV4dGVuZHMgU2NvcGUge1xuICAgIGNvbnN0cnVjdG9yKHNjb3BlTWFuYWdlciwgdXBwZXJTY29wZSwgYmxvY2spIHtcbiAgICAgICAgc3VwZXIoc2NvcGVNYW5hZ2VyLCAnZnVuY3Rpb24tZXhwcmVzc2lvbi1uYW1lJywgdXBwZXJTY29wZSwgYmxvY2ssIGZhbHNlKTtcbiAgICAgICAgdGhpcy5fX2RlZmluZShibG9jay5pZCxcbiAgICAgICAgICAgICAgICBuZXcgRGVmaW5pdGlvbihcbiAgICAgICAgICAgICAgICAgICAgVmFyaWFibGUuRnVuY3Rpb25OYW1lLFxuICAgICAgICAgICAgICAgICAgICBibG9jay5pZCxcbiAgICAgICAgICAgICAgICAgICAgYmxvY2ssXG4gICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgIG51bGxcbiAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgdGhpcy5mdW5jdGlvbkV4cHJlc3Npb25TY29wZSA9IHRydWU7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ2F0Y2hTY29wZSBleHRlbmRzIFNjb3BlIHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZU1hbmFnZXIsIHVwcGVyU2NvcGUsIGJsb2NrKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlTWFuYWdlciwgJ2NhdGNoJywgdXBwZXJTY29wZSwgYmxvY2ssIGZhbHNlKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBXaXRoU2NvcGUgZXh0ZW5kcyBTY29wZSB7XG4gICAgY29uc3RydWN0b3Ioc2NvcGVNYW5hZ2VyLCB1cHBlclNjb3BlLCBibG9jaykge1xuICAgICAgICBzdXBlcihzY29wZU1hbmFnZXIsICd3aXRoJywgdXBwZXJTY29wZSwgYmxvY2ssIGZhbHNlKTtcbiAgICB9XG5cbiAgICBfX2Nsb3NlKHNjb3BlTWFuYWdlcikge1xuICAgICAgICBpZiAodGhpcy5fX3Nob3VsZFN0YXRpY2FsbHlDbG9zZShzY29wZU1hbmFnZXIpKSB7XG4gICAgICAgICAgICByZXR1cm4gc3VwZXIuX19jbG9zZShzY29wZU1hbmFnZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGl6ID0gdGhpcy5fX2xlZnQubGVuZ3RoOyBpIDwgaXo7ICsraSkge1xuICAgICAgICAgICAgbGV0IHJlZiA9IHRoaXMuX19sZWZ0W2ldO1xuICAgICAgICAgICAgcmVmLnRhaW50ZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5fX2RlbGVnYXRlVG9VcHBlclNjb3BlKHJlZik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fX2xlZnQgPSBudWxsO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnVwcGVyO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFREWlNjb3BlIGV4dGVuZHMgU2NvcGUge1xuICAgIGNvbnN0cnVjdG9yKHNjb3BlTWFuYWdlciwgdXBwZXJTY29wZSwgYmxvY2spIHtcbiAgICAgICAgc3VwZXIoc2NvcGVNYW5hZ2VyLCAnVERaJywgdXBwZXJTY29wZSwgYmxvY2ssIGZhbHNlKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBCbG9ja1Njb3BlIGV4dGVuZHMgU2NvcGUge1xuICAgIGNvbnN0cnVjdG9yKHNjb3BlTWFuYWdlciwgdXBwZXJTY29wZSwgYmxvY2spIHtcbiAgICAgICAgc3VwZXIoc2NvcGVNYW5hZ2VyLCAnYmxvY2snLCB1cHBlclNjb3BlLCBibG9jaywgZmFsc2UpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFN3aXRjaFNjb3BlIGV4dGVuZHMgU2NvcGUge1xuICAgIGNvbnN0cnVjdG9yKHNjb3BlTWFuYWdlciwgdXBwZXJTY29wZSwgYmxvY2spIHtcbiAgICAgICAgc3VwZXIoc2NvcGVNYW5hZ2VyLCAnc3dpdGNoJywgdXBwZXJTY29wZSwgYmxvY2ssIGZhbHNlKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBGdW5jdGlvblNjb3BlIGV4dGVuZHMgU2NvcGUge1xuICAgIGNvbnN0cnVjdG9yKHNjb3BlTWFuYWdlciwgdXBwZXJTY29wZSwgYmxvY2ssIGlzTWV0aG9kRGVmaW5pdGlvbikge1xuICAgICAgICBzdXBlcihzY29wZU1hbmFnZXIsICdmdW5jdGlvbicsIHVwcGVyU2NvcGUsIGJsb2NrLCBpc01ldGhvZERlZmluaXRpb24pO1xuXG4gICAgICAgIC8vIHNlY3Rpb24gOS4yLjEzLCBGdW5jdGlvbkRlY2xhcmF0aW9uSW5zdGFudGlhdGlvbi5cbiAgICAgICAgLy8gTk9URSBBcnJvdyBmdW5jdGlvbnMgbmV2ZXIgaGF2ZSBhbiBhcmd1bWVudHMgb2JqZWN0cy5cbiAgICAgICAgaWYgKHRoaXMuYmxvY2sudHlwZSAhPT0gU3ludGF4LkFycm93RnVuY3Rpb25FeHByZXNzaW9uKSB7XG4gICAgICAgICAgICB0aGlzLl9fZGVmaW5lQXJndW1lbnRzKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc0FyZ3VtZW50c01hdGVyaWFsaXplZCgpIHtcbiAgICAgICAgLy8gVE9ETyhDb25zdGVsbGF0aW9uKVxuICAgICAgICAvLyBXZSBjYW4gbW9yZSBhZ2dyZXNzaXZlIG9uIHRoaXMgY29uZGl0aW9uIGxpa2UgdGhpcy5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gZnVuY3Rpb24gdCgpIHtcbiAgICAgICAgLy8gICAgIC8vIGFyZ3VtZW50cyBvZiB0IGlzIGFsd2F5cyBoaWRkZW4uXG4gICAgICAgIC8vICAgICBmdW5jdGlvbiBhcmd1bWVudHMoKSB7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cbiAgICAgICAgaWYgKHRoaXMuYmxvY2sudHlwZSA9PT0gU3ludGF4LkFycm93RnVuY3Rpb25FeHByZXNzaW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuaXNTdGF0aWMoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdmFyaWFibGUgPSB0aGlzLnNldC5nZXQoJ2FyZ3VtZW50cycpO1xuICAgICAgICBhc3NlcnQodmFyaWFibGUsICdBbHdheXMgaGF2ZSBhcmd1bWVudHMgdmFyaWFibGUuJyk7XG4gICAgICAgIHJldHVybiB2YXJpYWJsZS50YWludGVkIHx8IHZhcmlhYmxlLnJlZmVyZW5jZXMubGVuZ3RoICAhPT0gMDtcbiAgICB9XG5cbiAgICBpc1RoaXNNYXRlcmlhbGl6ZWQoKSB7XG4gICAgICAgIGlmICghdGhpcy5pc1N0YXRpYygpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy50aGlzRm91bmQ7XG4gICAgfVxuXG4gICAgX19kZWZpbmVBcmd1bWVudHMoKSB7XG4gICAgICAgIHRoaXMuX19kZWZpbmVHZW5lcmljKFxuICAgICAgICAgICAgICAgICdhcmd1bWVudHMnLFxuICAgICAgICAgICAgICAgIHRoaXMuc2V0LFxuICAgICAgICAgICAgICAgIHRoaXMudmFyaWFibGVzLFxuICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgbnVsbCk7XG4gICAgICAgIHRoaXMudGFpbnRzLnNldCgnYXJndW1lbnRzJywgdHJ1ZSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRm9yU2NvcGUgZXh0ZW5kcyBTY29wZSB7XG4gICAgY29uc3RydWN0b3Ioc2NvcGVNYW5hZ2VyLCB1cHBlclNjb3BlLCBibG9jaykge1xuICAgICAgICBzdXBlcihzY29wZU1hbmFnZXIsICdmb3InLCB1cHBlclNjb3BlLCBibG9jaywgZmFsc2UpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENsYXNzU2NvcGUgZXh0ZW5kcyBTY29wZSB7XG4gICAgY29uc3RydWN0b3Ioc2NvcGVNYW5hZ2VyLCB1cHBlclNjb3BlLCBibG9jaykge1xuICAgICAgICBzdXBlcihzY29wZU1hbmFnZXIsICdjbGFzcycsIHVwcGVyU2NvcGUsIGJsb2NrLCBmYWxzZSk7XG4gICAgfVxufVxuXG4vKiB2aW06IHNldCBzdz00IHRzPTQgZXQgdHc9ODAgOiAqL1xuIl19
