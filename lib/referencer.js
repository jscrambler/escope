'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _esrecurse = require('esrecurse');

var _esrecurse2 = _interopRequireDefault(_esrecurse);

var _estraverse = require('estraverse');

var _reference = require('./reference');

var _reference2 = _interopRequireDefault(_reference);

var _variable = require('./variable');

var _variable2 = _interopRequireDefault(_variable);

var _patternVisitor = require('./pattern-visitor');

var _patternVisitor2 = _interopRequireDefault(_patternVisitor);

var _definition = require('./definition');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
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

function traverseIdentifierInPattern(options, rootPattern, referencer, callback) {
    // Call the callback at left hand identifier nodes, and Collect right hand nodes.
    var visitor = new _patternVisitor2.default(options, rootPattern, callback);
    visitor.visit(rootPattern);

    // Process the right hand nodes recursively.
    if (referencer != null) {
        visitor.rightHandNodes.forEach(referencer.visit, referencer);
    }
}

// Importing ImportDeclaration.
// http://people.mozilla.org/~jorendorff/es6-draft.html#sec-moduledeclarationinstantiation
// https://github.com/estree/estree/blob/master/es6.md#importdeclaration
// FIXME: Now, we don't create module environment, because the context is
// implementation dependent.

var Importer = function (_esrecurse$Visitor) {
    _inherits(Importer, _esrecurse$Visitor);

    function Importer(declaration, referencer) {
        _classCallCheck(this, Importer);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Importer).call(this, null, referencer.options));

        _this.declaration = declaration;
        _this.referencer = referencer;
        return _this;
    }

    _createClass(Importer, [{
        key: 'visitImport',
        value: function visitImport(id, specifier) {
            var _this2 = this;

            this.referencer.visitPattern(id, function (pattern) {
                _this2.referencer.currentScope().__define(pattern, new _definition.Definition(_variable2.default.ImportBinding, pattern, specifier, _this2.declaration, null, null));
            });
        }
    }, {
        key: 'ImportNamespaceSpecifier',
        value: function ImportNamespaceSpecifier(node) {
            var local = node.local || node.id;
            if (local) {
                this.visitImport(local, node);
            }
        }
    }, {
        key: 'ImportDefaultSpecifier',
        value: function ImportDefaultSpecifier(node) {
            var local = node.local || node.id;
            this.visitImport(local, node);
        }
    }, {
        key: 'ImportSpecifier',
        value: function ImportSpecifier(node) {
            var local = node.local || node.id;
            if (node.name) {
                this.visitImport(node.name, node);
            } else {
                this.visitImport(local, node);
            }
        }
    }]);

    return Importer;
}(_esrecurse2.default.Visitor);

// Referencing variables and creating bindings.


var Referencer = function (_esrecurse$Visitor2) {
    _inherits(Referencer, _esrecurse$Visitor2);

    function Referencer(options, scopeManager) {
        _classCallCheck(this, Referencer);

        var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(Referencer).call(this, null, options));

        _this3.options = options;
        _this3.scopeManager = scopeManager;
        _this3.parent = null;
        _this3.isInnerMethodDefinition = false;
        return _this3;
    }

    _createClass(Referencer, [{
        key: 'currentScope',
        value: function currentScope() {
            return this.scopeManager.__currentScope;
        }
    }, {
        key: 'close',
        value: function close(node) {
            if (this.scopeManager.isInstrumentingTree()) {
                node.scope = this.currentScope();
            } else if (node.scope) {
                delete node.scope;
            }
            while (this.currentScope() && node === this.currentScope().block) {
                this.scopeManager.__currentScope = this.currentScope().__close(this.scopeManager);
            }
        }
    }, {
        key: 'pushInnerMethodDefinition',
        value: function pushInnerMethodDefinition(isInnerMethodDefinition) {
            var previous = this.isInnerMethodDefinition;
            this.isInnerMethodDefinition = isInnerMethodDefinition;
            return previous;
        }
    }, {
        key: 'popInnerMethodDefinition',
        value: function popInnerMethodDefinition(isInnerMethodDefinition) {
            this.isInnerMethodDefinition = isInnerMethodDefinition;
        }
    }, {
        key: 'materializeTDZScope',
        value: function materializeTDZScope(node, iterationNode) {
            // http://people.mozilla.org/~jorendorff/es6-draft.html#sec-runtime-semantics-forin-div-ofexpressionevaluation-abstract-operation
            // TDZ scope hides the declaration's names.
            this.scopeManager.__nestTDZScope(node, iterationNode);
            this.visitVariableDeclaration(this.currentScope(), _variable2.default.TDZ, iterationNode.left, 0, true);
        }
    }, {
        key: 'materializeIterationScope',
        value: function materializeIterationScope(node) {
            var _this4 = this;

            // Generate iteration scope for upper ForIn/ForOf Statements.
            var letOrConstDecl;
            this.scopeManager.__nestForScope(node);
            letOrConstDecl = node.left;
            this.visitVariableDeclaration(this.currentScope(), _variable2.default.Variable, letOrConstDecl, 0);
            this.visitPattern(letOrConstDecl.declarations[0].id, function (pattern) {
                _this4.currentScope().__referencing(pattern, _reference2.default.WRITE, node.right, null, true, true);
            });
        }
    }, {
        key: 'referencingDefaultValue',
        value: function referencingDefaultValue(pattern, assignments, maybeImplicitGlobal, init) {
            var scope = this.currentScope();
            assignments.forEach(function (assignment) {
                scope.__referencing(pattern, _reference2.default.WRITE, assignment.right, maybeImplicitGlobal, pattern !== assignment.left, init);
            });
        }
    }, {
        key: 'visitPattern',
        value: function visitPattern(node, options, callback) {
            if (typeof options === 'function') {
                callback = options;
                options = { processRightHandNodes: false };
            }
            traverseIdentifierInPattern(this.options, node, options.processRightHandNodes ? this : null, callback);
        }
    }, {
        key: 'visitFunction',
        value: function visitFunction(node) {
            var _this5 = this;

            var i, iz;
            // FunctionDeclaration name is defined in upper scope
            // NOTE: Not referring variableScope. It is intended.
            // Since
            //  in ES5, FunctionDeclaration should be in FunctionBody.
            //  in ES6, FunctionDeclaration should be block scoped.
            if (node.type === _estraverse.Syntax.FunctionDeclaration) {
                // id is defined in upper scope
                this.currentScope().__define(node.id, new _definition.Definition(_variable2.default.FunctionName, node.id, node, null, null, null));
            }

            // FunctionExpression with name creates its special scope;
            // FunctionExpressionNameScope.
            if (node.type === _estraverse.Syntax.FunctionExpression && node.id) {
                this.scopeManager.__nestFunctionExpressionNameScope(node);
            }

            // Consider this function is in the MethodDefinition.
            this.scopeManager.__nestFunctionScope(node, this.isInnerMethodDefinition);

            // Process parameter declarations.
            for (i = 0, iz = node.params.length; i < iz; ++i) {
                this.visitPattern(node.params[i], { processRightHandNodes: true }, function (pattern, info) {
                    _this5.currentScope().__define(pattern, new _definition.ParameterDefinition(pattern, node, i, info.rest));

                    _this5.referencingDefaultValue(pattern, info.assignments, null, true);
                });
            }

            // if there's a rest argument, add that
            if (node.rest) {
                this.visitPattern({
                    type: 'RestElement',
                    argument: node.rest
                }, function (pattern) {
                    _this5.currentScope().__define(pattern, new _definition.ParameterDefinition(pattern, node, node.params.length, true));
                });
            }

            // Skip BlockStatement to prevent creating BlockStatement scope.
            if (node.body.type === _estraverse.Syntax.BlockStatement) {
                this.visitChildren(node.body);
            } else {
                this.visit(node.body);
            }

            this.close(node);
        }
    }, {
        key: 'visitClass',
        value: function visitClass(node) {
            if (node.type === _estraverse.Syntax.ClassDeclaration) {
                this.currentScope().__define(node.id, new _definition.Definition(_variable2.default.ClassName, node.id, node, null, null, null));
            }

            // FIXME: Maybe consider TDZ.
            this.visit(node.superClass);

            this.scopeManager.__nestClassScope(node);

            if (node.id) {
                this.currentScope().__define(node.id, new _definition.Definition(_variable2.default.ClassName, node.id, node));
            }
            this.visit(node.body);

            this.close(node);
        }
    }, {
        key: 'visitProperty',
        value: function visitProperty(node) {
            var previous, isMethodDefinition;
            if (node.computed) {
                this.visit(node.key);
            }

            isMethodDefinition = node.type === _estraverse.Syntax.MethodDefinition;
            if (isMethodDefinition) {
                previous = this.pushInnerMethodDefinition(true);
            }
            this.visit(node.value);
            if (isMethodDefinition) {
                this.popInnerMethodDefinition(previous);
            }
        }
    }, {
        key: 'visitForIn',
        value: function visitForIn(node) {
            var _this6 = this;

            if (node.left.type === _estraverse.Syntax.VariableDeclaration && node.left.kind !== 'var') {
                this.materializeTDZScope(node.right, node);
                this.visit(node.right);
                this.close(node.right);

                this.materializeIterationScope(node);
                this.visit(node.body);
                this.close(node);
            } else {
                if (node.left.type === _estraverse.Syntax.VariableDeclaration) {
                    this.visit(node.left);
                    this.visitPattern(node.left.declarations[0].id, function (pattern) {
                        _this6.currentScope().__referencing(pattern, _reference2.default.WRITE, node.right, null, true, true);
                    });
                } else {
                    this.visitPattern(node.left, { processRightHandNodes: true }, function (pattern, info) {
                        var maybeImplicitGlobal = null;
                        if (!_this6.currentScope().isStrict) {
                            maybeImplicitGlobal = {
                                pattern: pattern,
                                node: node
                            };
                        }
                        _this6.referencingDefaultValue(pattern, info.assignments, maybeImplicitGlobal, false);
                        _this6.currentScope().__referencing(pattern, _reference2.default.WRITE, node.right, maybeImplicitGlobal, true, false);
                    });
                }
                this.visit(node.right);
                this.visit(node.body);
            }
        }
    }, {
        key: 'visitVariableDeclaration',
        value: function visitVariableDeclaration(variableTargetScope, type, node, index, fromTDZ) {
            var _this7 = this;

            // If this was called to initialize a TDZ scope, this needs to make definitions, but doesn't make references.
            var decl, init;

            decl = node.declarations[index];
            init = decl.init;
            this.visitPattern(decl.id, { processRightHandNodes: !fromTDZ }, function (pattern, info) {
                variableTargetScope.__define(pattern, new _definition.Definition(type, pattern, decl, node, index, node.kind));

                if (!fromTDZ) {
                    _this7.referencingDefaultValue(pattern, info.assignments, null, true);
                }
                if (init) {
                    _this7.currentScope().__referencing(pattern, _reference2.default.WRITE, init, null, !info.topLevel, true);
                }
            });
        }
    }, {
        key: 'AssignmentExpression',
        value: function AssignmentExpression(node) {
            var _this8 = this;

            if (_patternVisitor2.default.isPattern(node.left)) {
                if (node.operator === '=') {
                    this.visitPattern(node.left, { processRightHandNodes: true }, function (pattern, info) {
                        var maybeImplicitGlobal = null;
                        if (!_this8.currentScope().isStrict) {
                            maybeImplicitGlobal = {
                                pattern: pattern,
                                node: node
                            };
                        }
                        _this8.referencingDefaultValue(pattern, info.assignments, maybeImplicitGlobal, false);
                        _this8.currentScope().__referencing(pattern, _reference2.default.WRITE, node.right, maybeImplicitGlobal, !info.topLevel, false);
                    });
                } else {
                    this.currentScope().__referencing(node.left, _reference2.default.RW, node.right);
                }
            } else {
                this.visit(node.left);
            }
            this.visit(node.right);
        }
    }, {
        key: 'CatchClause',
        value: function CatchClause(node) {
            var _this9 = this;

            this.scopeManager.__nestCatchScope(node);

            this.visitPattern(node.param, { processRightHandNodes: true }, function (pattern, info) {
                _this9.currentScope().__define(pattern, new _definition.Definition(_variable2.default.CatchClause, node.param, node, null, null, null));
                _this9.referencingDefaultValue(pattern, info.assignments, null, true);
            });
            this.visit(node.body);

            this.close(node);
        }
    }, {
        key: 'Program',
        value: function Program(node) {
            this.scopeManager.__nestGlobalScope(node);

            if (this.scopeManager.__isNodejsScope()) {
                // Force strictness of GlobalScope to false when using node.js scope.
                this.currentScope().isStrict = false;
                this.scopeManager.__nestFunctionScope(node, false);
            }

            if (this.scopeManager.__isES6() && this.scopeManager.isModule()) {
                this.scopeManager.__nestModuleScope(node);
            }

            if (this.scopeManager.isStrictModeSupported() && this.scopeManager.isImpliedStrict()) {
                this.currentScope().isStrict = true;
            }

            this.visitChildren(node);
            this.close(node);
        }
    }, {
        key: 'Identifier',
        value: function Identifier(node) {
            this.currentScope().__referencing(node);
        }
    }, {
        key: 'UpdateExpression',
        value: function UpdateExpression(node) {
            if (_patternVisitor2.default.isPattern(node.argument)) {
                this.currentScope().__referencing(node.argument, _reference2.default.RW, null);
            } else {
                this.visitChildren(node);
            }
        }
    }, {
        key: 'MemberExpression',
        value: function MemberExpression(node) {
            this.visit(node.object);
            if (node.computed) {
                this.visit(node.property);
            }
        }
    }, {
        key: 'Property',
        value: function Property(node) {
            this.visitProperty(node);
        }
    }, {
        key: 'MethodDefinition',
        value: function MethodDefinition(node) {
            this.visitProperty(node);
        }
    }, {
        key: 'BreakStatement',
        value: function BreakStatement() {}
    }, {
        key: 'ContinueStatement',
        value: function ContinueStatement() {}
    }, {
        key: 'LabeledStatement',
        value: function LabeledStatement(node) {
            this.visit(node.body);
        }
    }, {
        key: 'ForStatement',
        value: function ForStatement(node) {
            // Create ForStatement declaration.
            // NOTE: In ES6, ForStatement dynamically generates
            // per iteration environment. However, escope is
            // a static analyzer, we only generate one scope for ForStatement.
            if (node.init && node.init.type === _estraverse.Syntax.VariableDeclaration && node.init.kind !== 'var') {
                this.scopeManager.__nestForScope(node);
            }

            this.visitChildren(node);

            this.close(node);
        }
    }, {
        key: 'ClassExpression',
        value: function ClassExpression(node) {
            this.visitClass(node);
        }
    }, {
        key: 'ClassDeclaration',
        value: function ClassDeclaration(node) {
            this.visitClass(node);
        }
    }, {
        key: 'CallExpression',
        value: function CallExpression(node) {
            // Check this is direct call to eval
            if (!this.scopeManager.__ignoreEval() && node.callee.type === _estraverse.Syntax.Identifier && node.callee.name === 'eval') {
                // NOTE: This should be `variableScope`. Since direct eval call always creates Lexical environment and
                // let / const should be enclosed into it. Only VariableDeclaration affects on the caller's environment.
                this.currentScope().variableScope.__detectEval();
            }
            this.visitChildren(node);
        }
    }, {
        key: 'BlockStatement',
        value: function BlockStatement(node) {
            if (this.scopeManager.__isES6()) {
                this.scopeManager.__nestBlockScope(node);
            }

            this.visitChildren(node);

            this.close(node);
        }
    }, {
        key: 'ThisExpression',
        value: function ThisExpression() {
            this.currentScope().variableScope.__detectThis();
        }
    }, {
        key: 'WithStatement',
        value: function WithStatement(node) {
            this.visit(node.object);
            // Then nest scope for WithStatement.
            this.scopeManager.__nestWithScope(node);

            this.visit(node.body);

            this.close(node);
        }
    }, {
        key: 'VariableDeclaration',
        value: function VariableDeclaration(node) {
            var variableTargetScope, i, iz, decl;
            variableTargetScope = node.kind === 'var' ? this.currentScope().variableScope : this.currentScope();
            for (i = 0, iz = node.declarations.length; i < iz; ++i) {
                decl = node.declarations[i];
                this.visitVariableDeclaration(variableTargetScope, _variable2.default.Variable, node, i);
                if (decl.init) {
                    this.visit(decl.init);
                }
            }
        }

        // sec 13.11.8

    }, {
        key: 'SwitchStatement',
        value: function SwitchStatement(node) {
            var i, iz;

            this.visit(node.discriminant);

            if (this.scopeManager.__isES6()) {
                this.scopeManager.__nestSwitchScope(node);
            }

            for (i = 0, iz = node.cases.length; i < iz; ++i) {
                this.visit(node.cases[i]);
            }

            this.close(node);
        }
    }, {
        key: 'FunctionDeclaration',
        value: function FunctionDeclaration(node) {
            this.visitFunction(node);
        }
    }, {
        key: 'FunctionExpression',
        value: function FunctionExpression(node) {
            this.visitFunction(node);
        }
    }, {
        key: 'ForOfStatement',
        value: function ForOfStatement(node) {
            this.visitForIn(node);
        }
    }, {
        key: 'ForInStatement',
        value: function ForInStatement(node) {
            this.visitForIn(node);
        }
    }, {
        key: 'ArrowFunctionExpression',
        value: function ArrowFunctionExpression(node) {
            this.visitFunction(node);
        }
    }, {
        key: 'ImportDeclaration',
        value: function ImportDeclaration(node) {
            var importer;

            (0, _assert2.default)(this.scopeManager.__isES6() && this.scopeManager.isModule(), 'ImportDeclaration should appear when the mode is ES6 and in the module context.');

            importer = new Importer(node, this);
            importer.visit(node);
        }
    }, {
        key: 'visitExportDeclaration',
        value: function visitExportDeclaration(node) {
            if (node.source) {
                return;
            }
            if (node.declaration) {
                this.visit(node.declaration);
                return;
            }

            this.visitChildren(node);
        }
    }, {
        key: 'ExportDeclaration',
        value: function ExportDeclaration(node) {
            this.visitExportDeclaration(node);
        }
    }, {
        key: 'ExportNamedDeclaration',
        value: function ExportNamedDeclaration(node) {
            this.visitExportDeclaration(node);
        }
    }, {
        key: 'ExportSpecifier',
        value: function ExportSpecifier(node) {
            var local = node.id || node.local;
            this.visit(local);
        }
    }, {
        key: 'MetaProperty',
        value: function MetaProperty() {
            // do nothing.
        }
    }]);

    return Referencer;
}(_esrecurse2.default.Visitor);

/* vim: set sw=4 ts=4 et tw=80 : */


exports.default = Referencer;
//# sourceMappingURL=data:application/json;base64,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SUFBaEI7QUFDSDs7O2dEQUV1QixJLEVBQU07QUFDMUIsaUJBQUssYUFBTCxDQUFtQixJQUFuQjtBQUNIOzs7MENBRWlCLEksRUFBTTtBQUNwQixnQkFBSSxRQUFKOztBQUVBLGtDQUFPLEtBQUssWUFBTCxDQUFrQixPQUFsQixNQUErQixLQUFLLFlBQUwsQ0FBa0IsUUFBbEIsRUFBdEMsRUFBb0UsaUZBQXBFOztBQUVBLHVCQUFXLElBQUksUUFBSixDQUFhLElBQWIsRUFBbUIsSUFBbkIsQ0FBWDtBQUNBLHFCQUFTLEtBQVQsQ0FBZSxJQUFmO0FBQ0g7OzsrQ0FFc0IsSSxFQUFNO0FBQ3pCLGdCQUFJLEtBQUssTUFBVCxFQUFpQjtBQUNiO0FBQ0g7QUFDRCxnQkFBSSxLQUFLLFdBQVQsRUFBc0I7QUFDbEIscUJBQUssS0FBTCxDQUFXLEtBQUssV0FBaEI7QUFDQTtBQUNIOztBQUVELGlCQUFLLGFBQUwsQ0FBbUIsSUFBbkI7QUFDSDs7OzBDQUVpQixJLEVBQU07QUFDcEIsaUJBQUssc0JBQUwsQ0FBNEIsSUFBNUI7QUFDSDs7OytDQUVzQixJLEVBQU07QUFDekIsaUJBQUssc0JBQUwsQ0FBNEIsSUFBNUI7QUFDSDs7O3dDQUVlLEksRUFBTTtBQUNsQixnQkFBSSxRQUFTLEtBQUssRUFBTCxJQUFXLEtBQUssS0FBN0I7QUFDQSxpQkFBSyxLQUFMLENBQVcsS0FBWDtBQUNIOzs7dUNBRWM7O0FBRWQ7Ozs7RUE3ZW1DLG9CQUFVLE87Ozs7O2tCQUE3QixVIiwiZmlsZSI6InJlZmVyZW5jZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICBDb3B5cmlnaHQgKEMpIDIwMTUgWXVzdWtlIFN1enVraSA8dXRhdGFuZS50ZWFAZ21haWwuY29tPlxuXG4gIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxuICBtb2RpZmljYXRpb24sIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcblxuICAgICogUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAgICAqIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0XG4gICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlXG4gICAgICBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuXG4gIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiXG4gIEFORCBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEVcbiAgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0VcbiAgQVJFIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIDxDT1BZUklHSFQgSE9MREVSPiBCRSBMSUFCTEUgRk9SIEFOWVxuICBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFU1xuICAoSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7XG4gIExPU1MgT0YgVVNFLCBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORFxuICBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVFxuICAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0ZcbiAgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiovXG5cbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCBlc3JlY3Vyc2UgZnJvbSAnZXNyZWN1cnNlJztcbmltcG9ydCB7IFN5bnRheCB9IGZyb20gJ2VzdHJhdmVyc2UnO1xuXG5pbXBvcnQgUmVmZXJlbmNlIGZyb20gJy4vcmVmZXJlbmNlJztcbmltcG9ydCBWYXJpYWJsZSBmcm9tICcuL3ZhcmlhYmxlJztcbmltcG9ydCBQYXR0ZXJuVmlzaXRvciBmcm9tICcuL3BhdHRlcm4tdmlzaXRvcic7XG5pbXBvcnQgeyBQYXJhbWV0ZXJEZWZpbml0aW9uLCBEZWZpbml0aW9uIH0gZnJvbSAnLi9kZWZpbml0aW9uJztcblxuZnVuY3Rpb24gdHJhdmVyc2VJZGVudGlmaWVySW5QYXR0ZXJuKG9wdGlvbnMsIHJvb3RQYXR0ZXJuLCByZWZlcmVuY2VyLCBjYWxsYmFjaykge1xuICAgIC8vIENhbGwgdGhlIGNhbGxiYWNrIGF0IGxlZnQgaGFuZCBpZGVudGlmaWVyIG5vZGVzLCBhbmQgQ29sbGVjdCByaWdodCBoYW5kIG5vZGVzLlxuICAgIHZhciB2aXNpdG9yID0gbmV3IFBhdHRlcm5WaXNpdG9yKG9wdGlvbnMsIHJvb3RQYXR0ZXJuLCBjYWxsYmFjayk7XG4gICAgdmlzaXRvci52aXNpdChyb290UGF0dGVybik7XG5cbiAgICAvLyBQcm9jZXNzIHRoZSByaWdodCBoYW5kIG5vZGVzIHJlY3Vyc2l2ZWx5LlxuICAgIGlmIChyZWZlcmVuY2VyICE9IG51bGwpIHtcbiAgICAgICAgdmlzaXRvci5yaWdodEhhbmROb2Rlcy5mb3JFYWNoKHJlZmVyZW5jZXIudmlzaXQsIHJlZmVyZW5jZXIpO1xuICAgIH1cbn1cblxuLy8gSW1wb3J0aW5nIEltcG9ydERlY2xhcmF0aW9uLlxuLy8gaHR0cDovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtbW9kdWxlZGVjbGFyYXRpb25pbnN0YW50aWF0aW9uXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZXN0cmVlL2VzdHJlZS9ibG9iL21hc3Rlci9lczYubWQjaW1wb3J0ZGVjbGFyYXRpb25cbi8vIEZJWE1FOiBOb3csIHdlIGRvbid0IGNyZWF0ZSBtb2R1bGUgZW52aXJvbm1lbnQsIGJlY2F1c2UgdGhlIGNvbnRleHQgaXNcbi8vIGltcGxlbWVudGF0aW9uIGRlcGVuZGVudC5cblxuY2xhc3MgSW1wb3J0ZXIgZXh0ZW5kcyBlc3JlY3Vyc2UuVmlzaXRvciB7XG4gICAgY29uc3RydWN0b3IoZGVjbGFyYXRpb24sIHJlZmVyZW5jZXIpIHtcbiAgICAgICAgc3VwZXIobnVsbCwgcmVmZXJlbmNlci5vcHRpb25zKTtcbiAgICAgICAgdGhpcy5kZWNsYXJhdGlvbiA9IGRlY2xhcmF0aW9uO1xuICAgICAgICB0aGlzLnJlZmVyZW5jZXIgPSByZWZlcmVuY2VyO1xuICAgIH1cblxuICAgIHZpc2l0SW1wb3J0KGlkLCBzcGVjaWZpZXIpIHtcbiAgICAgICAgdGhpcy5yZWZlcmVuY2VyLnZpc2l0UGF0dGVybihpZCwgKHBhdHRlcm4pID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVmZXJlbmNlci5jdXJyZW50U2NvcGUoKS5fX2RlZmluZShwYXR0ZXJuLFxuICAgICAgICAgICAgICAgIG5ldyBEZWZpbml0aW9uKFxuICAgICAgICAgICAgICAgICAgICBWYXJpYWJsZS5JbXBvcnRCaW5kaW5nLFxuICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuLFxuICAgICAgICAgICAgICAgICAgICBzcGVjaWZpZXIsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGVjbGFyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgIG51bGxcbiAgICAgICAgICAgICAgICAgICAgKSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIEltcG9ydE5hbWVzcGFjZVNwZWNpZmllcihub2RlKSB7XG4gICAgICAgIGxldCBsb2NhbCA9IChub2RlLmxvY2FsIHx8IG5vZGUuaWQpO1xuICAgICAgICBpZiAobG9jYWwpIHtcbiAgICAgICAgICAgIHRoaXMudmlzaXRJbXBvcnQobG9jYWwsIG5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgSW1wb3J0RGVmYXVsdFNwZWNpZmllcihub2RlKSB7XG4gICAgICAgIGxldCBsb2NhbCA9IChub2RlLmxvY2FsIHx8IG5vZGUuaWQpO1xuICAgICAgICB0aGlzLnZpc2l0SW1wb3J0KGxvY2FsLCBub2RlKTtcbiAgICB9XG5cbiAgICBJbXBvcnRTcGVjaWZpZXIobm9kZSkge1xuICAgICAgICBsZXQgbG9jYWwgPSAobm9kZS5sb2NhbCB8fCBub2RlLmlkKTtcbiAgICAgICAgaWYgKG5vZGUubmFtZSkge1xuICAgICAgICAgICAgdGhpcy52aXNpdEltcG9ydChub2RlLm5hbWUsIG5vZGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy52aXNpdEltcG9ydChsb2NhbCwgbm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIFJlZmVyZW5jaW5nIHZhcmlhYmxlcyBhbmQgY3JlYXRpbmcgYmluZGluZ3MuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZWZlcmVuY2VyIGV4dGVuZHMgZXNyZWN1cnNlLlZpc2l0b3Ige1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMsIHNjb3BlTWFuYWdlcikge1xuICAgICAgICBzdXBlcihudWxsLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5zY29wZU1hbmFnZXIgPSBzY29wZU1hbmFnZXI7XG4gICAgICAgIHRoaXMucGFyZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5pc0lubmVyTWV0aG9kRGVmaW5pdGlvbiA9IGZhbHNlO1xuICAgIH1cblxuICAgIGN1cnJlbnRTY29wZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NvcGVNYW5hZ2VyLl9fY3VycmVudFNjb3BlO1xuICAgIH1cblxuICAgIGNsb3NlKG5vZGUpIHtcbiAgICAgICAgaWYgKHRoaXMuc2NvcGVNYW5hZ2VyLmlzSW5zdHJ1bWVudGluZ1RyZWUoKSkge1xuICAgICAgICAgICAgbm9kZS5zY29wZSA9IHRoaXMuY3VycmVudFNjb3BlKCk7XG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS5zY29wZSkge1xuICAgICAgICAgICAgZGVsZXRlIG5vZGUuc2NvcGU7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKHRoaXMuY3VycmVudFNjb3BlKCkgJiYgbm9kZSA9PT0gdGhpcy5jdXJyZW50U2NvcGUoKS5ibG9jaykge1xuICAgICAgICAgICAgdGhpcy5zY29wZU1hbmFnZXIuX19jdXJyZW50U2NvcGUgPSB0aGlzLmN1cnJlbnRTY29wZSgpLl9fY2xvc2UodGhpcy5zY29wZU1hbmFnZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVzaElubmVyTWV0aG9kRGVmaW5pdGlvbihpc0lubmVyTWV0aG9kRGVmaW5pdGlvbikge1xuICAgICAgICB2YXIgcHJldmlvdXMgPSB0aGlzLmlzSW5uZXJNZXRob2REZWZpbml0aW9uO1xuICAgICAgICB0aGlzLmlzSW5uZXJNZXRob2REZWZpbml0aW9uID0gaXNJbm5lck1ldGhvZERlZmluaXRpb247XG4gICAgICAgIHJldHVybiBwcmV2aW91cztcbiAgICB9XG5cbiAgICBwb3BJbm5lck1ldGhvZERlZmluaXRpb24oaXNJbm5lck1ldGhvZERlZmluaXRpb24pIHtcbiAgICAgICAgdGhpcy5pc0lubmVyTWV0aG9kRGVmaW5pdGlvbiA9IGlzSW5uZXJNZXRob2REZWZpbml0aW9uO1xuICAgIH1cblxuICAgIG1hdGVyaWFsaXplVERaU2NvcGUobm9kZSwgaXRlcmF0aW9uTm9kZSkge1xuICAgICAgICAvLyBodHRwOi8vcGVvcGxlLm1vemlsbGEub3JnL35qb3JlbmRvcmZmL2VzNi1kcmFmdC5odG1sI3NlYy1ydW50aW1lLXNlbWFudGljcy1mb3Jpbi1kaXYtb2ZleHByZXNzaW9uZXZhbHVhdGlvbi1hYnN0cmFjdC1vcGVyYXRpb25cbiAgICAgICAgLy8gVERaIHNjb3BlIGhpZGVzIHRoZSBkZWNsYXJhdGlvbidzIG5hbWVzLlxuICAgICAgICB0aGlzLnNjb3BlTWFuYWdlci5fX25lc3RURFpTY29wZShub2RlLCBpdGVyYXRpb25Ob2RlKTtcbiAgICAgICAgdGhpcy52aXNpdFZhcmlhYmxlRGVjbGFyYXRpb24odGhpcy5jdXJyZW50U2NvcGUoKSwgVmFyaWFibGUuVERaLCBpdGVyYXRpb25Ob2RlLmxlZnQsIDAsIHRydWUpO1xuICAgIH1cblxuICAgIG1hdGVyaWFsaXplSXRlcmF0aW9uU2NvcGUobm9kZSkge1xuICAgICAgICAvLyBHZW5lcmF0ZSBpdGVyYXRpb24gc2NvcGUgZm9yIHVwcGVyIEZvckluL0Zvck9mIFN0YXRlbWVudHMuXG4gICAgICAgIHZhciBsZXRPckNvbnN0RGVjbDtcbiAgICAgICAgdGhpcy5zY29wZU1hbmFnZXIuX19uZXN0Rm9yU2NvcGUobm9kZSk7XG4gICAgICAgIGxldE9yQ29uc3REZWNsID0gbm9kZS5sZWZ0O1xuICAgICAgICB0aGlzLnZpc2l0VmFyaWFibGVEZWNsYXJhdGlvbih0aGlzLmN1cnJlbnRTY29wZSgpLCBWYXJpYWJsZS5WYXJpYWJsZSwgbGV0T3JDb25zdERlY2wsIDApO1xuICAgICAgICB0aGlzLnZpc2l0UGF0dGVybihsZXRPckNvbnN0RGVjbC5kZWNsYXJhdGlvbnNbMF0uaWQsIChwYXR0ZXJuKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLl9fcmVmZXJlbmNpbmcocGF0dGVybiwgUmVmZXJlbmNlLldSSVRFLCBub2RlLnJpZ2h0LCBudWxsLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVmZXJlbmNpbmdEZWZhdWx0VmFsdWUocGF0dGVybiwgYXNzaWdubWVudHMsIG1heWJlSW1wbGljaXRHbG9iYWwsIGluaXQpIHtcbiAgICAgICAgY29uc3Qgc2NvcGUgPSB0aGlzLmN1cnJlbnRTY29wZSgpO1xuICAgICAgICBhc3NpZ25tZW50cy5mb3JFYWNoKGFzc2lnbm1lbnQgPT4ge1xuICAgICAgICAgICAgc2NvcGUuX19yZWZlcmVuY2luZyhcbiAgICAgICAgICAgICAgICBwYXR0ZXJuLFxuICAgICAgICAgICAgICAgIFJlZmVyZW5jZS5XUklURSxcbiAgICAgICAgICAgICAgICBhc3NpZ25tZW50LnJpZ2h0LFxuICAgICAgICAgICAgICAgIG1heWJlSW1wbGljaXRHbG9iYWwsXG4gICAgICAgICAgICAgICAgcGF0dGVybiAhPT0gYXNzaWdubWVudC5sZWZ0LFxuICAgICAgICAgICAgICAgIGluaXQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB2aXNpdFBhdHRlcm4obm9kZSwgb3B0aW9ucywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gICAgICAgICAgICBvcHRpb25zID0ge3Byb2Nlc3NSaWdodEhhbmROb2RlczogZmFsc2V9XG4gICAgICAgIH1cbiAgICAgICAgdHJhdmVyc2VJZGVudGlmaWVySW5QYXR0ZXJuKFxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIG9wdGlvbnMucHJvY2Vzc1JpZ2h0SGFuZE5vZGVzID8gdGhpcyA6IG51bGwsXG4gICAgICAgICAgICBjYWxsYmFjayk7XG4gICAgfVxuXG4gICAgdmlzaXRGdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciBpLCBpejtcbiAgICAgICAgLy8gRnVuY3Rpb25EZWNsYXJhdGlvbiBuYW1lIGlzIGRlZmluZWQgaW4gdXBwZXIgc2NvcGVcbiAgICAgICAgLy8gTk9URTogTm90IHJlZmVycmluZyB2YXJpYWJsZVNjb3BlLiBJdCBpcyBpbnRlbmRlZC5cbiAgICAgICAgLy8gU2luY2VcbiAgICAgICAgLy8gIGluIEVTNSwgRnVuY3Rpb25EZWNsYXJhdGlvbiBzaG91bGQgYmUgaW4gRnVuY3Rpb25Cb2R5LlxuICAgICAgICAvLyAgaW4gRVM2LCBGdW5jdGlvbkRlY2xhcmF0aW9uIHNob3VsZCBiZSBibG9jayBzY29wZWQuXG4gICAgICAgIGlmIChub2RlLnR5cGUgPT09IFN5bnRheC5GdW5jdGlvbkRlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAvLyBpZCBpcyBkZWZpbmVkIGluIHVwcGVyIHNjb3BlXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLl9fZGVmaW5lKG5vZGUuaWQsXG4gICAgICAgICAgICAgICAgICAgIG5ldyBEZWZpbml0aW9uKFxuICAgICAgICAgICAgICAgICAgICAgICAgVmFyaWFibGUuRnVuY3Rpb25OYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bGxcbiAgICAgICAgICAgICAgICAgICAgKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGdW5jdGlvbkV4cHJlc3Npb24gd2l0aCBuYW1lIGNyZWF0ZXMgaXRzIHNwZWNpYWwgc2NvcGU7XG4gICAgICAgIC8vIEZ1bmN0aW9uRXhwcmVzc2lvbk5hbWVTY29wZS5cbiAgICAgICAgaWYgKG5vZGUudHlwZSA9PT0gU3ludGF4LkZ1bmN0aW9uRXhwcmVzc2lvbiAmJiBub2RlLmlkKSB7XG4gICAgICAgICAgICB0aGlzLnNjb3BlTWFuYWdlci5fX25lc3RGdW5jdGlvbkV4cHJlc3Npb25OYW1lU2NvcGUobm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDb25zaWRlciB0aGlzIGZ1bmN0aW9uIGlzIGluIHRoZSBNZXRob2REZWZpbml0aW9uLlxuICAgICAgICB0aGlzLnNjb3BlTWFuYWdlci5fX25lc3RGdW5jdGlvblNjb3BlKG5vZGUsIHRoaXMuaXNJbm5lck1ldGhvZERlZmluaXRpb24pO1xuXG4gICAgICAgIC8vIFByb2Nlc3MgcGFyYW1ldGVyIGRlY2xhcmF0aW9ucy5cbiAgICAgICAgZm9yIChpID0gMCwgaXogPSBub2RlLnBhcmFtcy5sZW5ndGg7IGkgPCBpejsgKytpKSB7XG4gICAgICAgICAgICB0aGlzLnZpc2l0UGF0dGVybihub2RlLnBhcmFtc1tpXSwge3Byb2Nlc3NSaWdodEhhbmROb2RlczogdHJ1ZX0sIChwYXR0ZXJuLCBpbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50U2NvcGUoKS5fX2RlZmluZShwYXR0ZXJuLFxuICAgICAgICAgICAgICAgICAgICBuZXcgUGFyYW1ldGVyRGVmaW5pdGlvbihcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdHRlcm4sXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucmVzdFxuICAgICAgICAgICAgICAgICAgICApKTtcblxuICAgICAgICAgICAgICAgIHRoaXMucmVmZXJlbmNpbmdEZWZhdWx0VmFsdWUocGF0dGVybiwgaW5mby5hc3NpZ25tZW50cywgbnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHRoZXJlJ3MgYSByZXN0IGFyZ3VtZW50LCBhZGQgdGhhdFxuICAgICAgICBpZiAobm9kZS5yZXN0KSB7XG4gICAgICAgICAgICB0aGlzLnZpc2l0UGF0dGVybih7XG4gICAgICAgICAgICAgICAgdHlwZTogJ1Jlc3RFbGVtZW50JyxcbiAgICAgICAgICAgICAgICBhcmd1bWVudDogbm9kZS5yZXN0XG4gICAgICAgICAgICB9LCAocGF0dGVybikgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFNjb3BlKCkuX19kZWZpbmUocGF0dGVybixcbiAgICAgICAgICAgICAgICAgICAgbmV3IFBhcmFtZXRlckRlZmluaXRpb24oXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUucGFyYW1zLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNraXAgQmxvY2tTdGF0ZW1lbnQgdG8gcHJldmVudCBjcmVhdGluZyBCbG9ja1N0YXRlbWVudCBzY29wZS5cbiAgICAgICAgaWYgKG5vZGUuYm9keS50eXBlID09PSBTeW50YXguQmxvY2tTdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMudmlzaXRDaGlsZHJlbihub2RlLmJvZHkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy52aXNpdChub2RlLmJvZHkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jbG9zZShub2RlKTtcbiAgICB9XG5cbiAgICB2aXNpdENsYXNzKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUudHlwZSA9PT0gU3ludGF4LkNsYXNzRGVjbGFyYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFNjb3BlKCkuX19kZWZpbmUobm9kZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgbmV3IERlZmluaXRpb24oXG4gICAgICAgICAgICAgICAgICAgICAgICBWYXJpYWJsZS5DbGFzc05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgbnVsbFxuICAgICAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZJWE1FOiBNYXliZSBjb25zaWRlciBURFouXG4gICAgICAgIHRoaXMudmlzaXQobm9kZS5zdXBlckNsYXNzKTtcblxuICAgICAgICB0aGlzLnNjb3BlTWFuYWdlci5fX25lc3RDbGFzc1Njb3BlKG5vZGUpO1xuXG4gICAgICAgIGlmIChub2RlLmlkKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLl9fZGVmaW5lKG5vZGUuaWQsXG4gICAgICAgICAgICAgICAgICAgIG5ldyBEZWZpbml0aW9uKFxuICAgICAgICAgICAgICAgICAgICAgICAgVmFyaWFibGUuQ2xhc3NOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVcbiAgICAgICAgICAgICAgICAgICAgKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy52aXNpdChub2RlLmJvZHkpO1xuXG4gICAgICAgIHRoaXMuY2xvc2Uobm9kZSk7XG4gICAgfVxuXG4gICAgdmlzaXRQcm9wZXJ0eShub2RlKSB7XG4gICAgICAgIHZhciBwcmV2aW91cywgaXNNZXRob2REZWZpbml0aW9uO1xuICAgICAgICBpZiAobm9kZS5jb21wdXRlZCkge1xuICAgICAgICAgICAgdGhpcy52aXNpdChub2RlLmtleSk7XG4gICAgICAgIH1cblxuICAgICAgICBpc01ldGhvZERlZmluaXRpb24gPSBub2RlLnR5cGUgPT09IFN5bnRheC5NZXRob2REZWZpbml0aW9uO1xuICAgICAgICBpZiAoaXNNZXRob2REZWZpbml0aW9uKSB7XG4gICAgICAgICAgICBwcmV2aW91cyA9IHRoaXMucHVzaElubmVyTWV0aG9kRGVmaW5pdGlvbih0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnZpc2l0KG5vZGUudmFsdWUpO1xuICAgICAgICBpZiAoaXNNZXRob2REZWZpbml0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnBvcElubmVyTWV0aG9kRGVmaW5pdGlvbihwcmV2aW91cyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2aXNpdEZvckluKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUubGVmdC50eXBlID09PSBTeW50YXguVmFyaWFibGVEZWNsYXJhdGlvbiAmJiBub2RlLmxlZnQua2luZCAhPT0gJ3ZhcicpIHtcbiAgICAgICAgICAgIHRoaXMubWF0ZXJpYWxpemVURFpTY29wZShub2RlLnJpZ2h0LCBub2RlKTtcbiAgICAgICAgICAgIHRoaXMudmlzaXQobm9kZS5yaWdodCk7XG4gICAgICAgICAgICB0aGlzLmNsb3NlKG5vZGUucmlnaHQpO1xuXG4gICAgICAgICAgICB0aGlzLm1hdGVyaWFsaXplSXRlcmF0aW9uU2NvcGUobm9kZSk7XG4gICAgICAgICAgICB0aGlzLnZpc2l0KG5vZGUuYm9keSk7XG4gICAgICAgICAgICB0aGlzLmNsb3NlKG5vZGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKG5vZGUubGVmdC50eXBlID09PSBTeW50YXguVmFyaWFibGVEZWNsYXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMudmlzaXQobm9kZS5sZWZ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnZpc2l0UGF0dGVybihub2RlLmxlZnQuZGVjbGFyYXRpb25zWzBdLmlkLCAocGF0dGVybikgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLl9fcmVmZXJlbmNpbmcocGF0dGVybiwgUmVmZXJlbmNlLldSSVRFLCBub2RlLnJpZ2h0LCBudWxsLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy52aXNpdFBhdHRlcm4obm9kZS5sZWZ0LCB7cHJvY2Vzc1JpZ2h0SGFuZE5vZGVzOiB0cnVlfSwgKHBhdHRlcm4sIGluZm8pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1heWJlSW1wbGljaXRHbG9iYWwgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuY3VycmVudFNjb3BlKCkuaXNTdHJpY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlSW1wbGljaXRHbG9iYWwgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0dGVybjogcGF0dGVybixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlOiBub2RlXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVmZXJlbmNpbmdEZWZhdWx0VmFsdWUocGF0dGVybiwgaW5mby5hc3NpZ25tZW50cywgbWF5YmVJbXBsaWNpdEdsb2JhbCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLl9fcmVmZXJlbmNpbmcocGF0dGVybiwgUmVmZXJlbmNlLldSSVRFLCBub2RlLnJpZ2h0LCBtYXliZUltcGxpY2l0R2xvYmFsLCB0cnVlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnZpc2l0KG5vZGUucmlnaHQpO1xuICAgICAgICAgICAgdGhpcy52aXNpdChub2RlLmJvZHkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmlzaXRWYXJpYWJsZURlY2xhcmF0aW9uKHZhcmlhYmxlVGFyZ2V0U2NvcGUsIHR5cGUsIG5vZGUsIGluZGV4LCBmcm9tVERaKSB7XG4gICAgICAgIC8vIElmIHRoaXMgd2FzIGNhbGxlZCB0byBpbml0aWFsaXplIGEgVERaIHNjb3BlLCB0aGlzIG5lZWRzIHRvIG1ha2UgZGVmaW5pdGlvbnMsIGJ1dCBkb2Vzbid0IG1ha2UgcmVmZXJlbmNlcy5cbiAgICAgICAgdmFyIGRlY2wsIGluaXQ7XG5cbiAgICAgICAgZGVjbCA9IG5vZGUuZGVjbGFyYXRpb25zW2luZGV4XTtcbiAgICAgICAgaW5pdCA9IGRlY2wuaW5pdDtcbiAgICAgICAgdGhpcy52aXNpdFBhdHRlcm4oZGVjbC5pZCwge3Byb2Nlc3NSaWdodEhhbmROb2RlczogIWZyb21URFp9LCAocGF0dGVybiwgaW5mbykgPT4ge1xuICAgICAgICAgICAgdmFyaWFibGVUYXJnZXRTY29wZS5fX2RlZmluZShwYXR0ZXJuLFxuICAgICAgICAgICAgICAgIG5ldyBEZWZpbml0aW9uKFxuICAgICAgICAgICAgICAgICAgICB0eXBlLFxuICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuLFxuICAgICAgICAgICAgICAgICAgICBkZWNsLFxuICAgICAgICAgICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgICAgICAgICBpbmRleCxcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5raW5kXG4gICAgICAgICAgICAgICAgKSk7XG5cbiAgICAgICAgICAgIGlmICghZnJvbVREWikge1xuICAgICAgICAgICAgICAgIHRoaXMucmVmZXJlbmNpbmdEZWZhdWx0VmFsdWUocGF0dGVybiwgaW5mby5hc3NpZ25tZW50cywgbnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaW5pdCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFNjb3BlKCkuX19yZWZlcmVuY2luZyhwYXR0ZXJuLCBSZWZlcmVuY2UuV1JJVEUsIGluaXQsIG51bGwsICFpbmZvLnRvcExldmVsLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgQXNzaWdubWVudEV4cHJlc3Npb24obm9kZSkge1xuICAgICAgICBpZiAoUGF0dGVyblZpc2l0b3IuaXNQYXR0ZXJuKG5vZGUubGVmdCkpIHtcbiAgICAgICAgICAgIGlmIChub2RlLm9wZXJhdG9yID09PSAnPScpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZpc2l0UGF0dGVybihub2RlLmxlZnQsIHtwcm9jZXNzUmlnaHRIYW5kTm9kZXM6IHRydWV9LCAocGF0dGVybiwgaW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbWF5YmVJbXBsaWNpdEdsb2JhbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5jdXJyZW50U2NvcGUoKS5pc1N0cmljdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVJbXBsaWNpdEdsb2JhbCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuOiBwYXR0ZXJuLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGU6IG5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWZlcmVuY2luZ0RlZmF1bHRWYWx1ZShwYXR0ZXJuLCBpbmZvLmFzc2lnbm1lbnRzLCBtYXliZUltcGxpY2l0R2xvYmFsLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFNjb3BlKCkuX19yZWZlcmVuY2luZyhwYXR0ZXJuLCBSZWZlcmVuY2UuV1JJVEUsIG5vZGUucmlnaHQsIG1heWJlSW1wbGljaXRHbG9iYWwsICFpbmZvLnRvcExldmVsLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFNjb3BlKCkuX19yZWZlcmVuY2luZyhub2RlLmxlZnQsIFJlZmVyZW5jZS5SVywgbm9kZS5yaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnZpc2l0KG5vZGUubGVmdCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy52aXNpdChub2RlLnJpZ2h0KTtcbiAgICB9XG5cbiAgICBDYXRjaENsYXVzZShub2RlKSB7XG4gICAgICAgIHRoaXMuc2NvcGVNYW5hZ2VyLl9fbmVzdENhdGNoU2NvcGUobm9kZSk7XG5cbiAgICAgICAgdGhpcy52aXNpdFBhdHRlcm4obm9kZS5wYXJhbSwge3Byb2Nlc3NSaWdodEhhbmROb2RlczogdHJ1ZX0sIChwYXR0ZXJuLCBpbmZvKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLl9fZGVmaW5lKHBhdHRlcm4sXG4gICAgICAgICAgICAgICAgbmV3IERlZmluaXRpb24oXG4gICAgICAgICAgICAgICAgICAgIFZhcmlhYmxlLkNhdGNoQ2xhdXNlLFxuICAgICAgICAgICAgICAgICAgICBub2RlLnBhcmFtLFxuICAgICAgICAgICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICBudWxsXG4gICAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICB0aGlzLnJlZmVyZW5jaW5nRGVmYXVsdFZhbHVlKHBhdHRlcm4sIGluZm8uYXNzaWdubWVudHMsIG51bGwsIHRydWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy52aXNpdChub2RlLmJvZHkpO1xuXG4gICAgICAgIHRoaXMuY2xvc2Uobm9kZSk7XG4gICAgfVxuXG4gICAgUHJvZ3JhbShub2RlKSB7XG4gICAgICAgIHRoaXMuc2NvcGVNYW5hZ2VyLl9fbmVzdEdsb2JhbFNjb3BlKG5vZGUpO1xuXG4gICAgICAgIGlmICh0aGlzLnNjb3BlTWFuYWdlci5fX2lzTm9kZWpzU2NvcGUoKSkge1xuICAgICAgICAgICAgLy8gRm9yY2Ugc3RyaWN0bmVzcyBvZiBHbG9iYWxTY29wZSB0byBmYWxzZSB3aGVuIHVzaW5nIG5vZGUuanMgc2NvcGUuXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLmlzU3RyaWN0ID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnNjb3BlTWFuYWdlci5fX25lc3RGdW5jdGlvblNjb3BlKG5vZGUsIGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNjb3BlTWFuYWdlci5fX2lzRVM2KCkgJiYgdGhpcy5zY29wZU1hbmFnZXIuaXNNb2R1bGUoKSkge1xuICAgICAgICAgICAgdGhpcy5zY29wZU1hbmFnZXIuX19uZXN0TW9kdWxlU2NvcGUobm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zY29wZU1hbmFnZXIuaXNTdHJpY3RNb2RlU3VwcG9ydGVkKCkgJiYgdGhpcy5zY29wZU1hbmFnZXIuaXNJbXBsaWVkU3RyaWN0KCkpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFNjb3BlKCkuaXNTdHJpY3QgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy52aXNpdENoaWxkcmVuKG5vZGUpO1xuICAgICAgICB0aGlzLmNsb3NlKG5vZGUpO1xuICAgIH1cblxuICAgIElkZW50aWZpZXIobm9kZSkge1xuICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLl9fcmVmZXJlbmNpbmcobm9kZSk7XG4gICAgfVxuXG4gICAgVXBkYXRlRXhwcmVzc2lvbihub2RlKSB7XG4gICAgICAgIGlmIChQYXR0ZXJuVmlzaXRvci5pc1BhdHRlcm4obm9kZS5hcmd1bWVudCkpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFNjb3BlKCkuX19yZWZlcmVuY2luZyhub2RlLmFyZ3VtZW50LCBSZWZlcmVuY2UuUlcsIG51bGwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy52aXNpdENoaWxkcmVuKG5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgTWVtYmVyRXhwcmVzc2lvbihub2RlKSB7XG4gICAgICAgIHRoaXMudmlzaXQobm9kZS5vYmplY3QpO1xuICAgICAgICBpZiAobm9kZS5jb21wdXRlZCkge1xuICAgICAgICAgICAgdGhpcy52aXNpdChub2RlLnByb3BlcnR5KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIFByb3BlcnR5KG5vZGUpIHtcbiAgICAgICAgdGhpcy52aXNpdFByb3BlcnR5KG5vZGUpO1xuICAgIH1cblxuICAgIE1ldGhvZERlZmluaXRpb24obm9kZSkge1xuICAgICAgICB0aGlzLnZpc2l0UHJvcGVydHkobm9kZSk7XG4gICAgfVxuXG4gICAgQnJlYWtTdGF0ZW1lbnQoKSB7fVxuXG4gICAgQ29udGludWVTdGF0ZW1lbnQoKSB7fVxuXG4gICAgTGFiZWxlZFN0YXRlbWVudChub2RlKSB7XG4gICAgICAgIHRoaXMudmlzaXQobm9kZS5ib2R5KTtcbiAgICB9XG5cbiAgICBGb3JTdGF0ZW1lbnQobm9kZSkge1xuICAgICAgICAvLyBDcmVhdGUgRm9yU3RhdGVtZW50IGRlY2xhcmF0aW9uLlxuICAgICAgICAvLyBOT1RFOiBJbiBFUzYsIEZvclN0YXRlbWVudCBkeW5hbWljYWxseSBnZW5lcmF0ZXNcbiAgICAgICAgLy8gcGVyIGl0ZXJhdGlvbiBlbnZpcm9ubWVudC4gSG93ZXZlciwgZXNjb3BlIGlzXG4gICAgICAgIC8vIGEgc3RhdGljIGFuYWx5emVyLCB3ZSBvbmx5IGdlbmVyYXRlIG9uZSBzY29wZSBmb3IgRm9yU3RhdGVtZW50LlxuICAgICAgICBpZiAobm9kZS5pbml0ICYmIG5vZGUuaW5pdC50eXBlID09PSBTeW50YXguVmFyaWFibGVEZWNsYXJhdGlvbiAmJiBub2RlLmluaXQua2luZCAhPT0gJ3ZhcicpIHtcbiAgICAgICAgICAgIHRoaXMuc2NvcGVNYW5hZ2VyLl9fbmVzdEZvclNjb3BlKG5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy52aXNpdENoaWxkcmVuKG5vZGUpO1xuXG4gICAgICAgIHRoaXMuY2xvc2Uobm9kZSk7XG4gICAgfVxuXG4gICAgQ2xhc3NFeHByZXNzaW9uKG5vZGUpIHtcbiAgICAgICAgdGhpcy52aXNpdENsYXNzKG5vZGUpO1xuICAgIH1cblxuICAgIENsYXNzRGVjbGFyYXRpb24obm9kZSkge1xuICAgICAgICB0aGlzLnZpc2l0Q2xhc3Mobm9kZSk7XG4gICAgfVxuXG4gICAgQ2FsbEV4cHJlc3Npb24obm9kZSkge1xuICAgICAgICAvLyBDaGVjayB0aGlzIGlzIGRpcmVjdCBjYWxsIHRvIGV2YWxcbiAgICAgICAgaWYgKCF0aGlzLnNjb3BlTWFuYWdlci5fX2lnbm9yZUV2YWwoKSAmJiBub2RlLmNhbGxlZS50eXBlID09PSBTeW50YXguSWRlbnRpZmllciAmJiBub2RlLmNhbGxlZS5uYW1lID09PSAnZXZhbCcpIHtcbiAgICAgICAgICAgIC8vIE5PVEU6IFRoaXMgc2hvdWxkIGJlIGB2YXJpYWJsZVNjb3BlYC4gU2luY2UgZGlyZWN0IGV2YWwgY2FsbCBhbHdheXMgY3JlYXRlcyBMZXhpY2FsIGVudmlyb25tZW50IGFuZFxuICAgICAgICAgICAgLy8gbGV0IC8gY29uc3Qgc2hvdWxkIGJlIGVuY2xvc2VkIGludG8gaXQuIE9ubHkgVmFyaWFibGVEZWNsYXJhdGlvbiBhZmZlY3RzIG9uIHRoZSBjYWxsZXIncyBlbnZpcm9ubWVudC5cbiAgICAgICAgICAgIHRoaXMuY3VycmVudFNjb3BlKCkudmFyaWFibGVTY29wZS5fX2RldGVjdEV2YWwoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnZpc2l0Q2hpbGRyZW4obm9kZSk7XG4gICAgfVxuXG4gICAgQmxvY2tTdGF0ZW1lbnQobm9kZSkge1xuICAgICAgICBpZiAodGhpcy5zY29wZU1hbmFnZXIuX19pc0VTNigpKSB7XG4gICAgICAgICAgICB0aGlzLnNjb3BlTWFuYWdlci5fX25lc3RCbG9ja1Njb3BlKG5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy52aXNpdENoaWxkcmVuKG5vZGUpO1xuXG4gICAgICAgIHRoaXMuY2xvc2Uobm9kZSk7XG4gICAgfVxuXG4gICAgVGhpc0V4cHJlc3Npb24oKSB7XG4gICAgICAgIHRoaXMuY3VycmVudFNjb3BlKCkudmFyaWFibGVTY29wZS5fX2RldGVjdFRoaXMoKTtcbiAgICB9XG5cbiAgICBXaXRoU3RhdGVtZW50KG5vZGUpIHtcbiAgICAgICAgdGhpcy52aXNpdChub2RlLm9iamVjdCk7XG4gICAgICAgIC8vIFRoZW4gbmVzdCBzY29wZSBmb3IgV2l0aFN0YXRlbWVudC5cbiAgICAgICAgdGhpcy5zY29wZU1hbmFnZXIuX19uZXN0V2l0aFNjb3BlKG5vZGUpO1xuXG4gICAgICAgIHRoaXMudmlzaXQobm9kZS5ib2R5KTtcblxuICAgICAgICB0aGlzLmNsb3NlKG5vZGUpO1xuICAgIH1cblxuICAgIFZhcmlhYmxlRGVjbGFyYXRpb24obm9kZSkge1xuICAgICAgICB2YXIgdmFyaWFibGVUYXJnZXRTY29wZSwgaSwgaXosIGRlY2w7XG4gICAgICAgIHZhcmlhYmxlVGFyZ2V0U2NvcGUgPSAobm9kZS5raW5kID09PSAndmFyJykgPyB0aGlzLmN1cnJlbnRTY29wZSgpLnZhcmlhYmxlU2NvcGUgOiB0aGlzLmN1cnJlbnRTY29wZSgpO1xuICAgICAgICBmb3IgKGkgPSAwLCBpeiA9IG5vZGUuZGVjbGFyYXRpb25zLmxlbmd0aDsgaSA8IGl6OyArK2kpIHtcbiAgICAgICAgICAgIGRlY2wgPSBub2RlLmRlY2xhcmF0aW9uc1tpXTtcbiAgICAgICAgICAgIHRoaXMudmlzaXRWYXJpYWJsZURlY2xhcmF0aW9uKHZhcmlhYmxlVGFyZ2V0U2NvcGUsIFZhcmlhYmxlLlZhcmlhYmxlLCBub2RlLCBpKTtcbiAgICAgICAgICAgIGlmIChkZWNsLmluaXQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZpc2l0KGRlY2wuaW5pdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBzZWMgMTMuMTEuOFxuICAgIFN3aXRjaFN0YXRlbWVudChub2RlKSB7XG4gICAgICAgIHZhciBpLCBpejtcblxuICAgICAgICB0aGlzLnZpc2l0KG5vZGUuZGlzY3JpbWluYW50KTtcblxuICAgICAgICBpZiAodGhpcy5zY29wZU1hbmFnZXIuX19pc0VTNigpKSB7XG4gICAgICAgICAgICB0aGlzLnNjb3BlTWFuYWdlci5fX25lc3RTd2l0Y2hTY29wZShub2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDAsIGl6ID0gbm9kZS5jYXNlcy5sZW5ndGg7IGkgPCBpejsgKytpKSB7XG4gICAgICAgICAgICB0aGlzLnZpc2l0KG5vZGUuY2FzZXNbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jbG9zZShub2RlKTtcbiAgICB9XG5cbiAgICBGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUpIHtcbiAgICAgICAgdGhpcy52aXNpdEZ1bmN0aW9uKG5vZGUpO1xuICAgIH1cblxuICAgIEZ1bmN0aW9uRXhwcmVzc2lvbihub2RlKSB7XG4gICAgICAgIHRoaXMudmlzaXRGdW5jdGlvbihub2RlKTtcbiAgICB9XG5cbiAgICBGb3JPZlN0YXRlbWVudChub2RlKSB7XG4gICAgICAgIHRoaXMudmlzaXRGb3JJbihub2RlKTtcbiAgICB9XG5cbiAgICBGb3JJblN0YXRlbWVudChub2RlKSB7XG4gICAgICAgIHRoaXMudmlzaXRGb3JJbihub2RlKTtcbiAgICB9XG5cbiAgICBBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbihub2RlKSB7XG4gICAgICAgIHRoaXMudmlzaXRGdW5jdGlvbihub2RlKTtcbiAgICB9XG5cbiAgICBJbXBvcnREZWNsYXJhdGlvbihub2RlKSB7XG4gICAgICAgIHZhciBpbXBvcnRlcjtcblxuICAgICAgICBhc3NlcnQodGhpcy5zY29wZU1hbmFnZXIuX19pc0VTNigpICYmIHRoaXMuc2NvcGVNYW5hZ2VyLmlzTW9kdWxlKCksICdJbXBvcnREZWNsYXJhdGlvbiBzaG91bGQgYXBwZWFyIHdoZW4gdGhlIG1vZGUgaXMgRVM2IGFuZCBpbiB0aGUgbW9kdWxlIGNvbnRleHQuJyk7XG5cbiAgICAgICAgaW1wb3J0ZXIgPSBuZXcgSW1wb3J0ZXIobm9kZSwgdGhpcyk7XG4gICAgICAgIGltcG9ydGVyLnZpc2l0KG5vZGUpO1xuICAgIH1cblxuICAgIHZpc2l0RXhwb3J0RGVjbGFyYXRpb24obm9kZSkge1xuICAgICAgICBpZiAobm9kZS5zb3VyY2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5kZWNsYXJhdGlvbikge1xuICAgICAgICAgICAgdGhpcy52aXNpdChub2RlLmRlY2xhcmF0aW9uKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudmlzaXRDaGlsZHJlbihub2RlKTtcbiAgICB9XG5cbiAgICBFeHBvcnREZWNsYXJhdGlvbihub2RlKSB7XG4gICAgICAgIHRoaXMudmlzaXRFeHBvcnREZWNsYXJhdGlvbihub2RlKTtcbiAgICB9XG5cbiAgICBFeHBvcnROYW1lZERlY2xhcmF0aW9uKG5vZGUpIHtcbiAgICAgICAgdGhpcy52aXNpdEV4cG9ydERlY2xhcmF0aW9uKG5vZGUpO1xuICAgIH1cblxuICAgIEV4cG9ydFNwZWNpZmllcihub2RlKSB7XG4gICAgICAgIGxldCBsb2NhbCA9IChub2RlLmlkIHx8IG5vZGUubG9jYWwpO1xuICAgICAgICB0aGlzLnZpc2l0KGxvY2FsKTtcbiAgICB9XG5cbiAgICBNZXRhUHJvcGVydHkoKSB7XG4gICAgICAgIC8vIGRvIG5vdGhpbmcuXG4gICAgfVxufVxuXG4vKiB2aW06IHNldCBzdz00IHRzPTQgZXQgdHc9ODAgOiAqL1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
