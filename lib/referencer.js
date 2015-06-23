"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

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

var Syntax = require("estraverse").Syntax;

var esrecurse = _interopRequire(require("esrecurse"));

var Reference = _interopRequire(require("./reference"));

var Variable = _interopRequire(require("./variable"));

var _definition = require("./definition");

var ParameterDefinition = _definition.ParameterDefinition;
var Definition = _definition.Definition;

var assert = _interopRequire(require("assert"));

var PatternVisitor = (function (_esrecurse$Visitor) {
    function PatternVisitor(rootPattern, referencer, callback) {
        _classCallCheck(this, PatternVisitor);

        _get(Object.getPrototypeOf(PatternVisitor.prototype), "constructor", this).call(this);
        this.referencer = referencer;
        this.callback = callback;
    }

    _inherits(PatternVisitor, _esrecurse$Visitor);

    _createClass(PatternVisitor, {
        perform: {
            value: function perform(pattern) {
                if (pattern.type === Syntax.Identifier) {
                    this.callback(pattern, true);
                    return;
                }
                this.visit(pattern);
            }
        },
        Identifier: {
            value: function Identifier(pattern) {
                this.callback(pattern, false);
            }
        },
        ObjectPattern: {
            value: function ObjectPattern(pattern) {
                var i, iz, property;
                for (i = 0, iz = pattern.properties.length; i < iz; ++i) {
                    property = pattern.properties[i];
                    if (property.shorthand) {
                        this.visit(property.key);
                        continue;
                    }
                    this.visit(property.value);
                }
            }
        },
        ArrayPattern: {
            value: function ArrayPattern(pattern) {
                var i, iz, element;
                for (i = 0, iz = pattern.elements.length; i < iz; ++i) {
                    element = pattern.elements[i];
                    if (element) {
                        this.visit(element);
                    }
                }
            }
        },
        AssignmentPattern: {
            value: function AssignmentPattern(pattern) {
                this.visit(pattern.left);
                // FIXME: Condier TDZ scope.
                this.referencer.visit(pattern.right);
            }
        }
    });

    return PatternVisitor;
})(esrecurse.Visitor);

function traverseIdentifierInPattern(rootPattern, referencer, callback) {
    var visitor = new PatternVisitor(rootPattern, referencer, callback);
    visitor.perform(rootPattern);
}

function isPattern(node) {
    var nodeType = node.type;
    return nodeType === Syntax.Identifier || nodeType === Syntax.ObjectPattern || nodeType === Syntax.ArrayPattern || nodeType === Syntax.SpreadElement || nodeType === Syntax.RestElement || nodeType === Syntax.AssignmentPattern;
}

// Importing ImportDeclaration.
// http://people.mozilla.org/~jorendorff/es6-draft.html#sec-moduledeclarationinstantiation
// https://github.com/estree/estree/blob/master/es6.md#importdeclaration
// FIXME: Now, we don't create module environment, because the context is
// implementation dependent.

var Importer = (function (_esrecurse$Visitor2) {
    function Importer(declaration, referencer) {
        _classCallCheck(this, Importer);

        _get(Object.getPrototypeOf(Importer.prototype), "constructor", this).call(this);
        this.declaration = declaration;
        this.referencer = referencer;
    }

    _inherits(Importer, _esrecurse$Visitor2);

    _createClass(Importer, {
        visitImport: {
            value: function visitImport(id, specifier) {
                var _this = this;

                this.referencer.visitPattern(id, function (pattern) {
                    _this.referencer.currentScope().__define(pattern, new Definition(Variable.ImportBinding, pattern, specifier, _this.declaration, null, null));
                });
            }
        },
        ImportNamespaceSpecifier: {
            value: function ImportNamespaceSpecifier(node) {
                var local = node.local || node.id;
                if (local) {
                    this.visitImport(local, node);
                }
            }
        },
        ImportDefaultSpecifier: {
            value: function ImportDefaultSpecifier(node) {
                var local = node.local || node.id;
                this.visitImport(local, node);
            }
        },
        ImportSpecifier: {
            value: function ImportSpecifier(node) {
                var local = node.local || node.id;
                if (node.name) {
                    this.visitImport(node.name, node);
                } else {
                    this.visitImport(local, node);
                }
            }
        }
    });

    return Importer;
})(esrecurse.Visitor);

// Referencing variables and creating bindings.

var Referencer = (function (_esrecurse$Visitor3) {
    function Referencer(scopeManager) {
        _classCallCheck(this, Referencer);

        _get(Object.getPrototypeOf(Referencer.prototype), "constructor", this).call(this);
        this.scopeManager = scopeManager;
        this.parent = null;
        this.isInnerMethodDefinition = false;
    }

    _inherits(Referencer, _esrecurse$Visitor3);

    _createClass(Referencer, {
        currentScope: {
            value: function currentScope() {
                return this.scopeManager.__currentScope;
            }
        },
        close: {
            value: function close(node) {
                if (this.scopeManager.isInstrumentingTree()) {
                    node.scope = this.currentScope();
                }
                while (this.currentScope() && node === this.currentScope().block) {
                    this.scopeManager.__currentScope = this.currentScope().__close(this.scopeManager);
                }
            }
        },
        pushInnerMethodDefinition: {
            value: function pushInnerMethodDefinition(isInnerMethodDefinition) {
                var previous = this.isInnerMethodDefinition;
                this.isInnerMethodDefinition = isInnerMethodDefinition;
                return previous;
            }
        },
        popInnerMethodDefinition: {
            value: function popInnerMethodDefinition(isInnerMethodDefinition) {
                this.isInnerMethodDefinition = isInnerMethodDefinition;
            }
        },
        materializeTDZScope: {
            value: function materializeTDZScope(node, iterationNode) {
                // http://people.mozilla.org/~jorendorff/es6-draft.html#sec-runtime-semantics-forin-div-ofexpressionevaluation-abstract-operation
                // TDZ scope hides the declaration's names.
                this.scopeManager.__nestTDZScope(node, iterationNode);
                this.visitVariableDeclaration(this.currentScope(), Variable.TDZ, iterationNode.left, 0);
            }
        },
        materializeIterationScope: {
            value: function materializeIterationScope(node) {
                var _this = this;

                // Generate iteration scope for upper ForIn/ForOf Statements.
                var letOrConstDecl;
                this.scopeManager.__nestForScope(node);
                letOrConstDecl = node.left;
                this.visitVariableDeclaration(this.currentScope(), Variable.Variable, letOrConstDecl, 0);
                this.visitPattern(letOrConstDecl.declarations[0].id, function (pattern) {
                    _this.currentScope().__referencing(pattern, Reference.WRITE, node.right, null, true);
                });
            }
        },
        visitPattern: {
            value: function visitPattern(node, callback) {
                traverseIdentifierInPattern(node, this, callback);
            }
        },
        visitFunction: {
            value: function visitFunction(node) {
                var _this = this;

                var i, iz;
                // FunctionDeclaration name is defined in upper scope
                // NOTE: Not referring variableScope. It is intended.
                // Since
                //  in ES5, FunctionDeclaration should be in FunctionBody.
                //  in ES6, FunctionDeclaration should be block scoped.
                if (node.type === Syntax.FunctionDeclaration) {
                    // id is defined in upper scope
                    this.currentScope().__define(node.id, new Definition(Variable.FunctionName, node.id, node, null, null, null));
                }

                // FunctionExpression with name creates its special scope;
                // FunctionExpressionNameScope.
                if (node.type === Syntax.FunctionExpression && node.id) {
                    this.scopeManager.__nestFunctionExpressionNameScope(node);
                }

                // Consider this function is in the MethodDefinition.
                this.scopeManager.__nestFunctionScope(node, this.isInnerMethodDefinition);

                for (i = 0, iz = node.params.length; i < iz; ++i) {
                    this.visitPattern(node.params[i], function (pattern) {
                        _this.currentScope().__define(pattern, new ParameterDefinition(pattern, node, i, false));
                    });
                }

                // if there's a rest argument, add that
                if (node.rest) {
                    this.visitPattern({
                        type: "RestElement",
                        argument: node.rest
                    }, function (pattern) {
                        _this.currentScope().__define(pattern, new ParameterDefinition(pattern, node, node.params.length, true));
                    });
                }

                // Skip BlockStatement to prevent creating BlockStatement scope.
                if (node.body.type === Syntax.BlockStatement) {
                    this.visitChildren(node.body);
                } else {
                    this.visit(node.body);
                }

                this.close(node);
            }
        },
        visitClass: {
            value: function visitClass(node) {
                if (node.type === Syntax.ClassDeclaration) {
                    this.currentScope().__define(node.id, new Definition(Variable.ClassName, node.id, node, null, null, null));
                }

                // FIXME: Maybe consider TDZ.
                this.visit(node.superClass);

                this.scopeManager.__nestClassScope(node);

                if (node.id) {
                    this.currentScope().__define(node.id, new Definition(Variable.ClassName, node.id, node));
                }
                this.visit(node.body);

                this.close(node);
            }
        },
        visitProperty: {
            value: function visitProperty(node) {
                var previous, isMethodDefinition;
                if (node.computed) {
                    this.visit(node.key);
                }

                isMethodDefinition = node.type === Syntax.MethodDefinition || node.method;
                if (isMethodDefinition) {
                    previous = this.pushInnerMethodDefinition(true);
                }
                this.visit(node.value);
                if (isMethodDefinition) {
                    this.popInnerMethodDefinition(previous);
                }
            }
        },
        visitForIn: {
            value: function visitForIn(node) {
                var _this = this;

                if (node.left.type === Syntax.VariableDeclaration && node.left.kind !== "var") {
                    this.materializeTDZScope(node.right, node);
                    this.visit(node.right);
                    this.close(node.right);

                    this.materializeIterationScope(node);
                    this.visit(node.body);
                    this.close(node);
                } else {
                    if (node.left.type === Syntax.VariableDeclaration) {
                        this.visit(node.left);
                        this.visitPattern(node.left.declarations[0].id, function (pattern) {
                            _this.currentScope().__referencing(pattern, Reference.WRITE, node.right, null, true);
                        });
                    } else {
                        if (!isPattern(node.left)) {
                            this.visit(node.left);
                        }
                        this.visitPattern(node.left, function (pattern) {
                            var maybeImplicitGlobal = null;
                            if (!_this.currentScope().isStrict) {
                                maybeImplicitGlobal = {
                                    pattern: pattern,
                                    node: node
                                };
                            }
                            _this.currentScope().__referencing(pattern, Reference.WRITE, node.right, maybeImplicitGlobal, true);
                        });
                    }
                    this.visit(node.right);
                    this.visit(node.body);
                }
            }
        },
        visitVariableDeclaration: {
            value: function visitVariableDeclaration(variableTargetScope, type, node, index) {
                var _this = this;

                var decl, init;

                decl = node.declarations[index];
                init = decl.init;
                this.visitPattern(decl.id, function (pattern, toplevel) {
                    variableTargetScope.__define(pattern, new Definition(type, pattern, decl, node, index, node.kind));

                    if (init) {
                        _this.currentScope().__referencing(pattern, Reference.WRITE, init, null, !toplevel);
                    }
                });
            }
        },
        AssignmentExpression: {
            value: function AssignmentExpression(node) {
                var _this = this;

                if (isPattern(node.left)) {
                    if (node.operator === "=") {
                        this.visitPattern(node.left, function (pattern, toplevel) {
                            var maybeImplicitGlobal = null;
                            if (!_this.currentScope().isStrict) {
                                maybeImplicitGlobal = {
                                    pattern: pattern,
                                    node: node
                                };
                            }
                            _this.currentScope().__referencing(pattern, Reference.WRITE, node.right, maybeImplicitGlobal, !toplevel);
                        });
                    } else {
                        this.currentScope().__referencing(node.left, Reference.RW, node.right);
                    }
                } else {
                    this.visit(node.left);
                }
                this.visit(node.right);
            }
        },
        CatchClause: {
            value: function CatchClause(node) {
                var _this = this;

                this.scopeManager.__nestCatchScope(node);

                this.visitPattern(node.param, function (pattern) {
                    _this.currentScope().__define(pattern, new Definition(Variable.CatchClause, node.param, node, null, null, null));
                });
                this.visit(node.body);

                this.close(node);
            }
        },
        Program: {
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

                this.visitChildren(node);
                this.close(node);
            }
        },
        Identifier: {
            value: function Identifier(node) {
                this.currentScope().__referencing(node);
            }
        },
        UpdateExpression: {
            value: function UpdateExpression(node) {
                if (isPattern(node.argument)) {
                    this.currentScope().__referencing(node.argument, Reference.RW, null);
                } else {
                    this.visitChildren(node);
                }
            }
        },
        MemberExpression: {
            value: function MemberExpression(node) {
                this.visit(node.object);
                if (node.computed) {
                    this.visit(node.property);
                }
            }
        },
        Property: {
            value: function Property(node) {
                this.visitProperty(node);
            }
        },
        MethodDefinition: {
            value: function MethodDefinition(node) {
                this.visitProperty(node);
            }
        },
        BreakStatement: {
            value: function BreakStatement() {}
        },
        ContinueStatement: {
            value: function ContinueStatement() {}
        },
        LabeledStatement: {
            value: function LabeledStatement(node) {
                this.visit(node.body);
            }
        },
        ForStatement: {
            value: function ForStatement(node) {
                // Create ForStatement declaration.
                // NOTE: In ES6, ForStatement dynamically generates
                // per iteration environment. However, escope is
                // a static analyzer, we only generate one scope for ForStatement.
                if (node.init && node.init.type === Syntax.VariableDeclaration && node.init.kind !== "var") {
                    this.scopeManager.__nestForScope(node);
                }

                this.visitChildren(node);

                this.close(node);
            }
        },
        ClassExpression: {
            value: function ClassExpression(node) {
                this.visitClass(node);
            }
        },
        ClassDeclaration: {
            value: function ClassDeclaration(node) {
                this.visitClass(node);
            }
        },
        CallExpression: {
            value: function CallExpression(node) {
                // Check this is direct call to eval
                if (!this.scopeManager.__ignoreEval() && node.callee.type === Syntax.Identifier && node.callee.name === "eval") {
                    // NOTE: This should be `variableScope`. Since direct eval call always creates Lexical environment and
                    // let / const should be enclosed into it. Only VariableDeclaration affects on the caller's environment.
                    this.currentScope().variableScope.__detectEval();
                }
                this.visitChildren(node);
            }
        },
        BlockStatement: {
            value: function BlockStatement(node) {
                if (this.scopeManager.__isES6()) {
                    this.scopeManager.__nestBlockScope(node);
                }

                this.visitChildren(node);

                this.close(node);
            }
        },
        ThisExpression: {
            value: function ThisExpression() {
                this.currentScope().variableScope.__detectThis();
            }
        },
        WithStatement: {
            value: function WithStatement(node) {
                this.visit(node.object);
                // Then nest scope for WithStatement.
                this.scopeManager.__nestWithScope(node);

                this.visit(node.body);

                this.close(node);
            }
        },
        VariableDeclaration: {
            value: function VariableDeclaration(node) {
                var variableTargetScope, i, iz, decl;
                variableTargetScope = node.kind === "var" ? this.currentScope().variableScope : this.currentScope();
                for (i = 0, iz = node.declarations.length; i < iz; ++i) {
                    decl = node.declarations[i];
                    this.visitVariableDeclaration(variableTargetScope, Variable.Variable, node, i);
                    if (decl.init) {
                        this.visit(decl.init);
                    }
                }
            }
        },
        SwitchStatement: {

            // sec 13.11.8

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
        },
        FunctionDeclaration: {
            value: function FunctionDeclaration(node) {
                this.visitFunction(node);
            }
        },
        FunctionExpression: {
            value: function FunctionExpression(node) {
                this.visitFunction(node);
            }
        },
        ForOfStatement: {
            value: function ForOfStatement(node) {
                this.visitForIn(node);
            }
        },
        ForInStatement: {
            value: function ForInStatement(node) {
                this.visitForIn(node);
            }
        },
        ArrowFunctionExpression: {
            value: function ArrowFunctionExpression(node) {
                this.visitFunction(node);
            }
        },
        ImportDeclaration: {
            value: function ImportDeclaration(node) {
                var importer;

                assert(this.scopeManager.__isES6() && this.scopeManager.isModule(), "ImportDeclaration should appear when the mode is ES6 and in the module context.");

                importer = new Importer(node, this);
                importer.visit(node);
            }
        },
        visitExportDeclaration: {
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
        },
        ExportDeclaration: {
            value: function ExportDeclaration(node) {
                this.visitExportDeclaration(node);
            }
        },
        ExportNamedDeclaration: {
            value: function ExportNamedDeclaration(node) {
                this.visitExportDeclaration(node);
            }
        },
        ExportSpecifier: {
            value: function ExportSpecifier(node) {
                var local = node.id || node.local;
                this.visit(local);
            }
        }
    });

    return Referencer;
})(esrecurse.Visitor);

module.exports = Referencer;

/* vim: set sw=4 ts=4 et tw=80 : */
//# sourceMappingURL=data:application/json;base64,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QUFJLElBQUksQ0FBQyxLQUFLLEFBQUMsQ0FBQztBQUNwQyxvQkFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUNyQjs7OztXQXRjZ0IsVUFBVTtHQUFTLFNBQVMsQ0FBQyxPQUFPOztpQkFBcEMsVUFBVSIsImZpbGUiOiJyZWZlcmVuY2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAgQ29weXJpZ2h0IChDKSAyMDE1IFl1c3VrZSBTdXp1a2kgPHV0YXRhbmUudGVhQGdtYWlsLmNvbT5cblxuICBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAgbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG5cbiAgICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0XG4gICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gICAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodFxuICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZVxuICAgICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cblxuICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIlxuICBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFXG4gIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFXG4gIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCA8Q09QWVJJR0hUIEhPTERFUj4gQkUgTElBQkxFIEZPUiBBTllcbiAgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVNcbiAgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTO1xuICBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkRcbiAgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbiAgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GXG4gIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4qL1xuaW1wb3J0IHsgU3ludGF4IH0gZnJvbSAnZXN0cmF2ZXJzZSc7XG5pbXBvcnQgZXNyZWN1cnNlIGZyb20gJ2VzcmVjdXJzZSc7XG5pbXBvcnQgUmVmZXJlbmNlIGZyb20gJy4vcmVmZXJlbmNlJztcbmltcG9ydCBWYXJpYWJsZSBmcm9tICcuL3ZhcmlhYmxlJztcbmltcG9ydCB7IFBhcmFtZXRlckRlZmluaXRpb24sIERlZmluaXRpb24gfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5jbGFzcyBQYXR0ZXJuVmlzaXRvciBleHRlbmRzIGVzcmVjdXJzZS5WaXNpdG9yIHtcbiAgICBjb25zdHJ1Y3Rvcihyb290UGF0dGVybiwgcmVmZXJlbmNlciwgY2FsbGJhY2spIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5yZWZlcmVuY2VyID0gcmVmZXJlbmNlcjtcbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgIH1cblxuICAgIHBlcmZvcm0ocGF0dGVybikge1xuICAgICAgICBpZiAocGF0dGVybi50eXBlID09PSBTeW50YXguSWRlbnRpZmllcikge1xuICAgICAgICAgICAgdGhpcy5jYWxsYmFjayhwYXR0ZXJuLCB0cnVlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnZpc2l0KHBhdHRlcm4pO1xuICAgIH1cblxuICAgIElkZW50aWZpZXIocGF0dGVybikge1xuICAgICAgICB0aGlzLmNhbGxiYWNrKHBhdHRlcm4sIGZhbHNlKTtcbiAgICB9XG5cbiAgICBPYmplY3RQYXR0ZXJuKHBhdHRlcm4pIHtcbiAgICAgICAgdmFyIGksIGl6LCBwcm9wZXJ0eTtcbiAgICAgICAgZm9yIChpID0gMCwgaXogPSBwYXR0ZXJuLnByb3BlcnRpZXMubGVuZ3RoOyBpIDwgaXo7ICsraSkge1xuICAgICAgICAgICAgcHJvcGVydHkgPSBwYXR0ZXJuLnByb3BlcnRpZXNbaV07XG4gICAgICAgICAgICBpZiAocHJvcGVydHkuc2hvcnRoYW5kKSB7XG4gICAgICAgICAgICAgICAgdGhpcy52aXNpdChwcm9wZXJ0eS5rZXkpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy52aXNpdChwcm9wZXJ0eS52YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBBcnJheVBhdHRlcm4ocGF0dGVybikge1xuICAgICAgICB2YXIgaSwgaXosIGVsZW1lbnQ7XG4gICAgICAgIGZvciAoaSA9IDAsIGl6ID0gcGF0dGVybi5lbGVtZW50cy5sZW5ndGg7IGkgPCBpejsgKytpKSB7XG4gICAgICAgICAgICBlbGVtZW50ID0gcGF0dGVybi5lbGVtZW50c1tpXTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy52aXNpdChlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIEFzc2lnbm1lbnRQYXR0ZXJuKHBhdHRlcm4pIHtcbiAgICAgICAgdGhpcy52aXNpdChwYXR0ZXJuLmxlZnQpO1xuICAgICAgICAvLyBGSVhNRTogQ29uZGllciBURFogc2NvcGUuXG4gICAgICAgIHRoaXMucmVmZXJlbmNlci52aXNpdChwYXR0ZXJuLnJpZ2h0KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRyYXZlcnNlSWRlbnRpZmllckluUGF0dGVybihyb290UGF0dGVybiwgcmVmZXJlbmNlciwgY2FsbGJhY2spIHtcbiAgICB2YXIgdmlzaXRvciA9IG5ldyBQYXR0ZXJuVmlzaXRvcihyb290UGF0dGVybiwgcmVmZXJlbmNlciwgY2FsbGJhY2spO1xuICAgIHZpc2l0b3IucGVyZm9ybShyb290UGF0dGVybik7XG59XG5cbmZ1bmN0aW9uIGlzUGF0dGVybihub2RlKSB7XG4gICAgdmFyIG5vZGVUeXBlID0gbm9kZS50eXBlO1xuICAgIHJldHVybiBub2RlVHlwZSA9PT0gU3ludGF4LklkZW50aWZpZXIgfHwgbm9kZVR5cGUgPT09IFN5bnRheC5PYmplY3RQYXR0ZXJuIHx8IG5vZGVUeXBlID09PSBTeW50YXguQXJyYXlQYXR0ZXJuIHx8IG5vZGVUeXBlID09PSBTeW50YXguU3ByZWFkRWxlbWVudCB8fCBub2RlVHlwZSA9PT0gU3ludGF4LlJlc3RFbGVtZW50IHx8IG5vZGVUeXBlID09PSBTeW50YXguQXNzaWdubWVudFBhdHRlcm47XG59XG5cbi8vIEltcG9ydGluZyBJbXBvcnREZWNsYXJhdGlvbi5cbi8vIGh0dHA6Ly9wZW9wbGUubW96aWxsYS5vcmcvfmpvcmVuZG9yZmYvZXM2LWRyYWZ0Lmh0bWwjc2VjLW1vZHVsZWRlY2xhcmF0aW9uaW5zdGFudGlhdGlvblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2VzdHJlZS9lc3RyZWUvYmxvYi9tYXN0ZXIvZXM2Lm1kI2ltcG9ydGRlY2xhcmF0aW9uXG4vLyBGSVhNRTogTm93LCB3ZSBkb24ndCBjcmVhdGUgbW9kdWxlIGVudmlyb25tZW50LCBiZWNhdXNlIHRoZSBjb250ZXh0IGlzXG4vLyBpbXBsZW1lbnRhdGlvbiBkZXBlbmRlbnQuXG5cbmNsYXNzIEltcG9ydGVyIGV4dGVuZHMgZXNyZWN1cnNlLlZpc2l0b3Ige1xuICAgIGNvbnN0cnVjdG9yKGRlY2xhcmF0aW9uLCByZWZlcmVuY2VyKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuZGVjbGFyYXRpb24gPSBkZWNsYXJhdGlvbjtcbiAgICAgICAgdGhpcy5yZWZlcmVuY2VyID0gcmVmZXJlbmNlcjtcbiAgICB9XG5cbiAgICB2aXNpdEltcG9ydChpZCwgc3BlY2lmaWVyKSB7XG4gICAgICAgIHRoaXMucmVmZXJlbmNlci52aXNpdFBhdHRlcm4oaWQsIChwYXR0ZXJuKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlZmVyZW5jZXIuY3VycmVudFNjb3BlKCkuX19kZWZpbmUocGF0dGVybixcbiAgICAgICAgICAgICAgICBuZXcgRGVmaW5pdGlvbihcbiAgICAgICAgICAgICAgICAgICAgVmFyaWFibGUuSW1wb3J0QmluZGluZyxcbiAgICAgICAgICAgICAgICAgICAgcGF0dGVybixcbiAgICAgICAgICAgICAgICAgICAgc3BlY2lmaWVyLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRlY2xhcmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICBudWxsXG4gICAgICAgICAgICAgICAgICAgICkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXIobm9kZSkge1xuICAgICAgICBsZXQgbG9jYWwgPSAobm9kZS5sb2NhbCB8fCBub2RlLmlkKTtcbiAgICAgICAgaWYgKGxvY2FsKSB7XG4gICAgICAgICAgICB0aGlzLnZpc2l0SW1wb3J0KGxvY2FsLCBub2RlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIEltcG9ydERlZmF1bHRTcGVjaWZpZXIobm9kZSkge1xuICAgICAgICBsZXQgbG9jYWwgPSAobm9kZS5sb2NhbCB8fCBub2RlLmlkKTtcbiAgICAgICAgdGhpcy52aXNpdEltcG9ydChsb2NhbCwgbm9kZSk7XG4gICAgfVxuXG4gICAgSW1wb3J0U3BlY2lmaWVyKG5vZGUpIHtcbiAgICAgICAgbGV0IGxvY2FsID0gKG5vZGUubG9jYWwgfHwgbm9kZS5pZCk7XG4gICAgICAgIGlmIChub2RlLm5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMudmlzaXRJbXBvcnQobm9kZS5uYW1lLCBub2RlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudmlzaXRJbXBvcnQobG9jYWwsIG5vZGUpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBSZWZlcmVuY2luZyB2YXJpYWJsZXMgYW5kIGNyZWF0aW5nIGJpbmRpbmdzLlxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVmZXJlbmNlciBleHRlbmRzIGVzcmVjdXJzZS5WaXNpdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZU1hbmFnZXIpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5zY29wZU1hbmFnZXIgPSBzY29wZU1hbmFnZXI7XG4gICAgICAgIHRoaXMucGFyZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5pc0lubmVyTWV0aG9kRGVmaW5pdGlvbiA9IGZhbHNlO1xuICAgIH1cblxuICAgIGN1cnJlbnRTY29wZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NvcGVNYW5hZ2VyLl9fY3VycmVudFNjb3BlO1xuICAgIH1cblxuICAgIGNsb3NlKG5vZGUpIHtcbiAgICAgICAgaWYgKHRoaXMuc2NvcGVNYW5hZ2VyLmlzSW5zdHJ1bWVudGluZ1RyZWUoKSkge1xuICAgICAgICAgICAgbm9kZS5zY29wZSA9IHRoaXMuY3VycmVudFNjb3BlKCk7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKHRoaXMuY3VycmVudFNjb3BlKCkgJiYgbm9kZSA9PT0gdGhpcy5jdXJyZW50U2NvcGUoKS5ibG9jaykge1xuICAgICAgICAgICAgdGhpcy5zY29wZU1hbmFnZXIuX19jdXJyZW50U2NvcGUgPSB0aGlzLmN1cnJlbnRTY29wZSgpLl9fY2xvc2UodGhpcy5zY29wZU1hbmFnZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVzaElubmVyTWV0aG9kRGVmaW5pdGlvbihpc0lubmVyTWV0aG9kRGVmaW5pdGlvbikge1xuICAgICAgICB2YXIgcHJldmlvdXMgPSB0aGlzLmlzSW5uZXJNZXRob2REZWZpbml0aW9uO1xuICAgICAgICB0aGlzLmlzSW5uZXJNZXRob2REZWZpbml0aW9uID0gaXNJbm5lck1ldGhvZERlZmluaXRpb247XG4gICAgICAgIHJldHVybiBwcmV2aW91cztcbiAgICB9XG5cbiAgICBwb3BJbm5lck1ldGhvZERlZmluaXRpb24oaXNJbm5lck1ldGhvZERlZmluaXRpb24pIHtcbiAgICAgICAgdGhpcy5pc0lubmVyTWV0aG9kRGVmaW5pdGlvbiA9IGlzSW5uZXJNZXRob2REZWZpbml0aW9uO1xuICAgIH1cblxuICAgIG1hdGVyaWFsaXplVERaU2NvcGUobm9kZSwgaXRlcmF0aW9uTm9kZSkge1xuICAgICAgICAvLyBodHRwOi8vcGVvcGxlLm1vemlsbGEub3JnL35qb3JlbmRvcmZmL2VzNi1kcmFmdC5odG1sI3NlYy1ydW50aW1lLXNlbWFudGljcy1mb3Jpbi1kaXYtb2ZleHByZXNzaW9uZXZhbHVhdGlvbi1hYnN0cmFjdC1vcGVyYXRpb25cbiAgICAgICAgLy8gVERaIHNjb3BlIGhpZGVzIHRoZSBkZWNsYXJhdGlvbidzIG5hbWVzLlxuICAgICAgICB0aGlzLnNjb3BlTWFuYWdlci5fX25lc3RURFpTY29wZShub2RlLCBpdGVyYXRpb25Ob2RlKTtcbiAgICAgICAgdGhpcy52aXNpdFZhcmlhYmxlRGVjbGFyYXRpb24odGhpcy5jdXJyZW50U2NvcGUoKSwgVmFyaWFibGUuVERaLCBpdGVyYXRpb25Ob2RlLmxlZnQsIDApO1xuICAgIH1cblxuICAgIG1hdGVyaWFsaXplSXRlcmF0aW9uU2NvcGUobm9kZSkge1xuICAgICAgICAvLyBHZW5lcmF0ZSBpdGVyYXRpb24gc2NvcGUgZm9yIHVwcGVyIEZvckluL0Zvck9mIFN0YXRlbWVudHMuXG4gICAgICAgIHZhciBsZXRPckNvbnN0RGVjbDtcbiAgICAgICAgdGhpcy5zY29wZU1hbmFnZXIuX19uZXN0Rm9yU2NvcGUobm9kZSk7XG4gICAgICAgIGxldE9yQ29uc3REZWNsID0gbm9kZS5sZWZ0O1xuICAgICAgICB0aGlzLnZpc2l0VmFyaWFibGVEZWNsYXJhdGlvbih0aGlzLmN1cnJlbnRTY29wZSgpLCBWYXJpYWJsZS5WYXJpYWJsZSwgbGV0T3JDb25zdERlY2wsIDApO1xuICAgICAgICB0aGlzLnZpc2l0UGF0dGVybihsZXRPckNvbnN0RGVjbC5kZWNsYXJhdGlvbnNbMF0uaWQsIChwYXR0ZXJuKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLl9fcmVmZXJlbmNpbmcocGF0dGVybiwgUmVmZXJlbmNlLldSSVRFLCBub2RlLnJpZ2h0LCBudWxsLCB0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmlzaXRQYXR0ZXJuKG5vZGUsIGNhbGxiYWNrKSB7XG4gICAgICAgIHRyYXZlcnNlSWRlbnRpZmllckluUGF0dGVybihub2RlLCB0aGlzLCBjYWxsYmFjayk7XG4gICAgfVxuXG4gICAgdmlzaXRGdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciBpLCBpejtcbiAgICAgICAgLy8gRnVuY3Rpb25EZWNsYXJhdGlvbiBuYW1lIGlzIGRlZmluZWQgaW4gdXBwZXIgc2NvcGVcbiAgICAgICAgLy8gTk9URTogTm90IHJlZmVycmluZyB2YXJpYWJsZVNjb3BlLiBJdCBpcyBpbnRlbmRlZC5cbiAgICAgICAgLy8gU2luY2VcbiAgICAgICAgLy8gIGluIEVTNSwgRnVuY3Rpb25EZWNsYXJhdGlvbiBzaG91bGQgYmUgaW4gRnVuY3Rpb25Cb2R5LlxuICAgICAgICAvLyAgaW4gRVM2LCBGdW5jdGlvbkRlY2xhcmF0aW9uIHNob3VsZCBiZSBibG9jayBzY29wZWQuXG4gICAgICAgIGlmIChub2RlLnR5cGUgPT09IFN5bnRheC5GdW5jdGlvbkRlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAvLyBpZCBpcyBkZWZpbmVkIGluIHVwcGVyIHNjb3BlXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLl9fZGVmaW5lKG5vZGUuaWQsXG4gICAgICAgICAgICAgICAgICAgIG5ldyBEZWZpbml0aW9uKFxuICAgICAgICAgICAgICAgICAgICAgICAgVmFyaWFibGUuRnVuY3Rpb25OYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bGxcbiAgICAgICAgICAgICAgICAgICAgKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGdW5jdGlvbkV4cHJlc3Npb24gd2l0aCBuYW1lIGNyZWF0ZXMgaXRzIHNwZWNpYWwgc2NvcGU7XG4gICAgICAgIC8vIEZ1bmN0aW9uRXhwcmVzc2lvbk5hbWVTY29wZS5cbiAgICAgICAgaWYgKG5vZGUudHlwZSA9PT0gU3ludGF4LkZ1bmN0aW9uRXhwcmVzc2lvbiAmJiBub2RlLmlkKSB7XG4gICAgICAgICAgICB0aGlzLnNjb3BlTWFuYWdlci5fX25lc3RGdW5jdGlvbkV4cHJlc3Npb25OYW1lU2NvcGUobm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDb25zaWRlciB0aGlzIGZ1bmN0aW9uIGlzIGluIHRoZSBNZXRob2REZWZpbml0aW9uLlxuICAgICAgICB0aGlzLnNjb3BlTWFuYWdlci5fX25lc3RGdW5jdGlvblNjb3BlKG5vZGUsIHRoaXMuaXNJbm5lck1ldGhvZERlZmluaXRpb24pO1xuXG4gICAgICAgIGZvciAoaSA9IDAsIGl6ID0gbm9kZS5wYXJhbXMubGVuZ3RoOyBpIDwgaXo7ICsraSkge1xuICAgICAgICAgICAgdGhpcy52aXNpdFBhdHRlcm4obm9kZS5wYXJhbXNbaV0sIChwYXR0ZXJuKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50U2NvcGUoKS5fX2RlZmluZShwYXR0ZXJuLFxuICAgICAgICAgICAgICAgICAgICBuZXcgUGFyYW1ldGVyRGVmaW5pdGlvbihcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdHRlcm4sXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB0aGVyZSdzIGEgcmVzdCBhcmd1bWVudCwgYWRkIHRoYXRcbiAgICAgICAgaWYgKG5vZGUucmVzdCkge1xuICAgICAgICAgICAgdGhpcy52aXNpdFBhdHRlcm4oe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdSZXN0RWxlbWVudCcsXG4gICAgICAgICAgICAgICAgYXJndW1lbnQ6IG5vZGUucmVzdFxuICAgICAgICAgICAgfSwgKHBhdHRlcm4pID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLl9fZGVmaW5lKHBhdHRlcm4sXG4gICAgICAgICAgICAgICAgICAgIG5ldyBQYXJhbWV0ZXJEZWZpbml0aW9uKFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0dGVybixcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnBhcmFtcy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgICAgICAgICAgICAgICkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTa2lwIEJsb2NrU3RhdGVtZW50IHRvIHByZXZlbnQgY3JlYXRpbmcgQmxvY2tTdGF0ZW1lbnQgc2NvcGUuXG4gICAgICAgIGlmIChub2RlLmJvZHkudHlwZSA9PT0gU3ludGF4LkJsb2NrU3RhdGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLnZpc2l0Q2hpbGRyZW4obm9kZS5ib2R5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudmlzaXQobm9kZS5ib2R5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2xvc2Uobm9kZSk7XG4gICAgfVxuXG4gICAgdmlzaXRDbGFzcyhub2RlKSB7XG4gICAgICAgIGlmIChub2RlLnR5cGUgPT09IFN5bnRheC5DbGFzc0RlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLl9fZGVmaW5lKG5vZGUuaWQsXG4gICAgICAgICAgICAgICAgICAgIG5ldyBEZWZpbml0aW9uKFxuICAgICAgICAgICAgICAgICAgICAgICAgVmFyaWFibGUuQ2xhc3NOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bGxcbiAgICAgICAgICAgICAgICAgICAgKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGSVhNRTogTWF5YmUgY29uc2lkZXIgVERaLlxuICAgICAgICB0aGlzLnZpc2l0KG5vZGUuc3VwZXJDbGFzcyk7XG5cbiAgICAgICAgdGhpcy5zY29wZU1hbmFnZXIuX19uZXN0Q2xhc3NTY29wZShub2RlKTtcblxuICAgICAgICBpZiAobm9kZS5pZCkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50U2NvcGUoKS5fX2RlZmluZShub2RlLmlkLFxuICAgICAgICAgICAgICAgICAgICBuZXcgRGVmaW5pdGlvbihcbiAgICAgICAgICAgICAgICAgICAgICAgIFZhcmlhYmxlLkNsYXNzTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlXG4gICAgICAgICAgICAgICAgICAgICkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudmlzaXQobm9kZS5ib2R5KTtcblxuICAgICAgICB0aGlzLmNsb3NlKG5vZGUpO1xuICAgIH1cblxuICAgIHZpc2l0UHJvcGVydHkobm9kZSkge1xuICAgICAgICB2YXIgcHJldmlvdXMsIGlzTWV0aG9kRGVmaW5pdGlvbjtcbiAgICAgICAgaWYgKG5vZGUuY29tcHV0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMudmlzaXQobm9kZS5rZXkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaXNNZXRob2REZWZpbml0aW9uID0gbm9kZS50eXBlID09PSBTeW50YXguTWV0aG9kRGVmaW5pdGlvbiB8fCBub2RlLm1ldGhvZDtcbiAgICAgICAgaWYgKGlzTWV0aG9kRGVmaW5pdGlvbikge1xuICAgICAgICAgICAgcHJldmlvdXMgPSB0aGlzLnB1c2hJbm5lck1ldGhvZERlZmluaXRpb24odHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy52aXNpdChub2RlLnZhbHVlKTtcbiAgICAgICAgaWYgKGlzTWV0aG9kRGVmaW5pdGlvbikge1xuICAgICAgICAgICAgdGhpcy5wb3BJbm5lck1ldGhvZERlZmluaXRpb24ocHJldmlvdXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmlzaXRGb3JJbihub2RlKSB7XG4gICAgICAgIGlmIChub2RlLmxlZnQudHlwZSA9PT0gU3ludGF4LlZhcmlhYmxlRGVjbGFyYXRpb24gJiYgbm9kZS5sZWZ0LmtpbmQgIT09ICd2YXInKSB7XG4gICAgICAgICAgICB0aGlzLm1hdGVyaWFsaXplVERaU2NvcGUobm9kZS5yaWdodCwgbm9kZSk7XG4gICAgICAgICAgICB0aGlzLnZpc2l0KG5vZGUucmlnaHQpO1xuICAgICAgICAgICAgdGhpcy5jbG9zZShub2RlLnJpZ2h0KTtcblxuICAgICAgICAgICAgdGhpcy5tYXRlcmlhbGl6ZUl0ZXJhdGlvblNjb3BlKG5vZGUpO1xuICAgICAgICAgICAgdGhpcy52aXNpdChub2RlLmJvZHkpO1xuICAgICAgICAgICAgdGhpcy5jbG9zZShub2RlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChub2RlLmxlZnQudHlwZSA9PT0gU3ludGF4LlZhcmlhYmxlRGVjbGFyYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZpc2l0KG5vZGUubGVmdCk7XG4gICAgICAgICAgICAgICAgdGhpcy52aXNpdFBhdHRlcm4obm9kZS5sZWZ0LmRlY2xhcmF0aW9uc1swXS5pZCwgKHBhdHRlcm4pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50U2NvcGUoKS5fX3JlZmVyZW5jaW5nKHBhdHRlcm4sIFJlZmVyZW5jZS5XUklURSwgbm9kZS5yaWdodCwgbnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghaXNQYXR0ZXJuKG5vZGUubGVmdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aXNpdChub2RlLmxlZnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnZpc2l0UGF0dGVybihub2RlLmxlZnQsIChwYXR0ZXJuKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXliZUltcGxpY2l0R2xvYmFsID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRTY29wZSgpLmlzU3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXliZUltcGxpY2l0R2xvYmFsID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdHRlcm46IHBhdHRlcm4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZTogbm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLl9fcmVmZXJlbmNpbmcocGF0dGVybiwgUmVmZXJlbmNlLldSSVRFLCBub2RlLnJpZ2h0LCBtYXliZUltcGxpY2l0R2xvYmFsLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMudmlzaXQobm9kZS5yaWdodCk7XG4gICAgICAgICAgICB0aGlzLnZpc2l0KG5vZGUuYm9keSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2aXNpdFZhcmlhYmxlRGVjbGFyYXRpb24odmFyaWFibGVUYXJnZXRTY29wZSwgdHlwZSwgbm9kZSwgaW5kZXgpIHtcbiAgICAgICAgdmFyIGRlY2wsIGluaXQ7XG5cbiAgICAgICAgZGVjbCA9IG5vZGUuZGVjbGFyYXRpb25zW2luZGV4XTtcbiAgICAgICAgaW5pdCA9IGRlY2wuaW5pdDtcbiAgICAgICAgdGhpcy52aXNpdFBhdHRlcm4oZGVjbC5pZCwgKHBhdHRlcm4sIHRvcGxldmVsKSA9PiB7XG4gICAgICAgICAgICB2YXJpYWJsZVRhcmdldFNjb3BlLl9fZGVmaW5lKHBhdHRlcm4sXG4gICAgICAgICAgICAgICAgbmV3IERlZmluaXRpb24oXG4gICAgICAgICAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICAgICAgICAgIHBhdHRlcm4sXG4gICAgICAgICAgICAgICAgICAgIGRlY2wsXG4gICAgICAgICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4LFxuICAgICAgICAgICAgICAgICAgICBub2RlLmtpbmRcbiAgICAgICAgICAgICAgICApKTtcblxuICAgICAgICAgICAgaWYgKGluaXQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLl9fcmVmZXJlbmNpbmcocGF0dGVybiwgUmVmZXJlbmNlLldSSVRFLCBpbml0LCBudWxsLCAhdG9wbGV2ZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBBc3NpZ25tZW50RXhwcmVzc2lvbihub2RlKSB7XG4gICAgICAgIGlmIChpc1BhdHRlcm4obm9kZS5sZWZ0KSkge1xuICAgICAgICAgICAgaWYgKG5vZGUub3BlcmF0b3IgPT09ICc9Jykge1xuICAgICAgICAgICAgICAgIHRoaXMudmlzaXRQYXR0ZXJuKG5vZGUubGVmdCwgKHBhdHRlcm4sIHRvcGxldmVsKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXliZUltcGxpY2l0R2xvYmFsID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRTY29wZSgpLmlzU3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXliZUltcGxpY2l0R2xvYmFsID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdHRlcm46IHBhdHRlcm4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZTogbm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLl9fcmVmZXJlbmNpbmcocGF0dGVybiwgUmVmZXJlbmNlLldSSVRFLCBub2RlLnJpZ2h0LCBtYXliZUltcGxpY2l0R2xvYmFsLCAhdG9wbGV2ZWwpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLl9fcmVmZXJlbmNpbmcobm9kZS5sZWZ0LCBSZWZlcmVuY2UuUlcsIG5vZGUucmlnaHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy52aXNpdChub2RlLmxlZnQpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudmlzaXQobm9kZS5yaWdodCk7XG4gICAgfVxuXG4gICAgQ2F0Y2hDbGF1c2Uobm9kZSkge1xuICAgICAgICB0aGlzLnNjb3BlTWFuYWdlci5fX25lc3RDYXRjaFNjb3BlKG5vZGUpO1xuXG4gICAgICAgIHRoaXMudmlzaXRQYXR0ZXJuKG5vZGUucGFyYW0sIChwYXR0ZXJuKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLl9fZGVmaW5lKHBhdHRlcm4sXG4gICAgICAgICAgICAgICAgbmV3IERlZmluaXRpb24oXG4gICAgICAgICAgICAgICAgICAgIFZhcmlhYmxlLkNhdGNoQ2xhdXNlLFxuICAgICAgICAgICAgICAgICAgICBub2RlLnBhcmFtLFxuICAgICAgICAgICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICBudWxsXG4gICAgICAgICAgICAgICAgKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnZpc2l0KG5vZGUuYm9keSk7XG5cbiAgICAgICAgdGhpcy5jbG9zZShub2RlKTtcbiAgICB9XG5cbiAgICBQcm9ncmFtKG5vZGUpIHtcbiAgICAgICAgdGhpcy5zY29wZU1hbmFnZXIuX19uZXN0R2xvYmFsU2NvcGUobm9kZSk7XG5cbiAgICAgICAgaWYgKHRoaXMuc2NvcGVNYW5hZ2VyLl9faXNOb2RlanNTY29wZSgpKSB7XG4gICAgICAgICAgICAvLyBGb3JjZSBzdHJpY3RuZXNzIG9mIEdsb2JhbFNjb3BlIHRvIGZhbHNlIHdoZW4gdXNpbmcgbm9kZS5qcyBzY29wZS5cbiAgICAgICAgICAgIHRoaXMuY3VycmVudFNjb3BlKCkuaXNTdHJpY3QgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuc2NvcGVNYW5hZ2VyLl9fbmVzdEZ1bmN0aW9uU2NvcGUobm9kZSwgZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2NvcGVNYW5hZ2VyLl9faXNFUzYoKSAmJiB0aGlzLnNjb3BlTWFuYWdlci5pc01vZHVsZSgpKSB7XG4gICAgICAgICAgICB0aGlzLnNjb3BlTWFuYWdlci5fX25lc3RNb2R1bGVTY29wZShub2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudmlzaXRDaGlsZHJlbihub2RlKTtcbiAgICAgICAgdGhpcy5jbG9zZShub2RlKTtcbiAgICB9XG5cbiAgICBJZGVudGlmaWVyKG5vZGUpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50U2NvcGUoKS5fX3JlZmVyZW5jaW5nKG5vZGUpO1xuICAgIH1cblxuICAgIFVwZGF0ZUV4cHJlc3Npb24obm9kZSkge1xuICAgICAgICBpZiAoaXNQYXR0ZXJuKG5vZGUuYXJndW1lbnQpKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLl9fcmVmZXJlbmNpbmcobm9kZS5hcmd1bWVudCwgUmVmZXJlbmNlLlJXLCBudWxsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudmlzaXRDaGlsZHJlbihub2RlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIE1lbWJlckV4cHJlc3Npb24obm9kZSkge1xuICAgICAgICB0aGlzLnZpc2l0KG5vZGUub2JqZWN0KTtcbiAgICAgICAgaWYgKG5vZGUuY29tcHV0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMudmlzaXQobm9kZS5wcm9wZXJ0eSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBQcm9wZXJ0eShub2RlKSB7XG4gICAgICAgIHRoaXMudmlzaXRQcm9wZXJ0eShub2RlKTtcbiAgICB9XG5cbiAgICBNZXRob2REZWZpbml0aW9uKG5vZGUpIHtcbiAgICAgICAgdGhpcy52aXNpdFByb3BlcnR5KG5vZGUpO1xuICAgIH1cblxuICAgIEJyZWFrU3RhdGVtZW50KCkge31cblxuICAgIENvbnRpbnVlU3RhdGVtZW50KCkge31cblxuICAgIExhYmVsZWRTdGF0ZW1lbnQobm9kZSkge1xuICAgICAgICB0aGlzLnZpc2l0KG5vZGUuYm9keSk7XG4gICAgfVxuXG4gICAgRm9yU3RhdGVtZW50KG5vZGUpIHtcbiAgICAgICAgLy8gQ3JlYXRlIEZvclN0YXRlbWVudCBkZWNsYXJhdGlvbi5cbiAgICAgICAgLy8gTk9URTogSW4gRVM2LCBGb3JTdGF0ZW1lbnQgZHluYW1pY2FsbHkgZ2VuZXJhdGVzXG4gICAgICAgIC8vIHBlciBpdGVyYXRpb24gZW52aXJvbm1lbnQuIEhvd2V2ZXIsIGVzY29wZSBpc1xuICAgICAgICAvLyBhIHN0YXRpYyBhbmFseXplciwgd2Ugb25seSBnZW5lcmF0ZSBvbmUgc2NvcGUgZm9yIEZvclN0YXRlbWVudC5cbiAgICAgICAgaWYgKG5vZGUuaW5pdCAmJiBub2RlLmluaXQudHlwZSA9PT0gU3ludGF4LlZhcmlhYmxlRGVjbGFyYXRpb24gJiYgbm9kZS5pbml0LmtpbmQgIT09ICd2YXInKSB7XG4gICAgICAgICAgICB0aGlzLnNjb3BlTWFuYWdlci5fX25lc3RGb3JTY29wZShub2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudmlzaXRDaGlsZHJlbihub2RlKTtcblxuICAgICAgICB0aGlzLmNsb3NlKG5vZGUpO1xuICAgIH1cblxuICAgIENsYXNzRXhwcmVzc2lvbihub2RlKSB7XG4gICAgICAgIHRoaXMudmlzaXRDbGFzcyhub2RlKTtcbiAgICB9XG5cbiAgICBDbGFzc0RlY2xhcmF0aW9uKG5vZGUpIHtcbiAgICAgICAgdGhpcy52aXNpdENsYXNzKG5vZGUpO1xuICAgIH1cblxuICAgIENhbGxFeHByZXNzaW9uKG5vZGUpIHtcbiAgICAgICAgLy8gQ2hlY2sgdGhpcyBpcyBkaXJlY3QgY2FsbCB0byBldmFsXG4gICAgICAgIGlmICghdGhpcy5zY29wZU1hbmFnZXIuX19pZ25vcmVFdmFsKCkgJiYgbm9kZS5jYWxsZWUudHlwZSA9PT0gU3ludGF4LklkZW50aWZpZXIgJiYgbm9kZS5jYWxsZWUubmFtZSA9PT0gJ2V2YWwnKSB7XG4gICAgICAgICAgICAvLyBOT1RFOiBUaGlzIHNob3VsZCBiZSBgdmFyaWFibGVTY29wZWAuIFNpbmNlIGRpcmVjdCBldmFsIGNhbGwgYWx3YXlzIGNyZWF0ZXMgTGV4aWNhbCBlbnZpcm9ubWVudCBhbmRcbiAgICAgICAgICAgIC8vIGxldCAvIGNvbnN0IHNob3VsZCBiZSBlbmNsb3NlZCBpbnRvIGl0LiBPbmx5IFZhcmlhYmxlRGVjbGFyYXRpb24gYWZmZWN0cyBvbiB0aGUgY2FsbGVyJ3MgZW52aXJvbm1lbnQuXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLnZhcmlhYmxlU2NvcGUuX19kZXRlY3RFdmFsKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy52aXNpdENoaWxkcmVuKG5vZGUpO1xuICAgIH1cblxuICAgIEJsb2NrU3RhdGVtZW50KG5vZGUpIHtcbiAgICAgICAgaWYgKHRoaXMuc2NvcGVNYW5hZ2VyLl9faXNFUzYoKSkge1xuICAgICAgICAgICAgdGhpcy5zY29wZU1hbmFnZXIuX19uZXN0QmxvY2tTY29wZShub2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudmlzaXRDaGlsZHJlbihub2RlKTtcblxuICAgICAgICB0aGlzLmNsb3NlKG5vZGUpO1xuICAgIH1cblxuICAgIFRoaXNFeHByZXNzaW9uKCkge1xuICAgICAgICB0aGlzLmN1cnJlbnRTY29wZSgpLnZhcmlhYmxlU2NvcGUuX19kZXRlY3RUaGlzKCk7XG4gICAgfVxuXG4gICAgV2l0aFN0YXRlbWVudChub2RlKSB7XG4gICAgICAgIHRoaXMudmlzaXQobm9kZS5vYmplY3QpO1xuICAgICAgICAvLyBUaGVuIG5lc3Qgc2NvcGUgZm9yIFdpdGhTdGF0ZW1lbnQuXG4gICAgICAgIHRoaXMuc2NvcGVNYW5hZ2VyLl9fbmVzdFdpdGhTY29wZShub2RlKTtcblxuICAgICAgICB0aGlzLnZpc2l0KG5vZGUuYm9keSk7XG5cbiAgICAgICAgdGhpcy5jbG9zZShub2RlKTtcbiAgICB9XG5cbiAgICBWYXJpYWJsZURlY2xhcmF0aW9uKG5vZGUpIHtcbiAgICAgICAgdmFyIHZhcmlhYmxlVGFyZ2V0U2NvcGUsIGksIGl6LCBkZWNsO1xuICAgICAgICB2YXJpYWJsZVRhcmdldFNjb3BlID0gKG5vZGUua2luZCA9PT0gJ3ZhcicpID8gdGhpcy5jdXJyZW50U2NvcGUoKS52YXJpYWJsZVNjb3BlIDogdGhpcy5jdXJyZW50U2NvcGUoKTtcbiAgICAgICAgZm9yIChpID0gMCwgaXogPSBub2RlLmRlY2xhcmF0aW9ucy5sZW5ndGg7IGkgPCBpejsgKytpKSB7XG4gICAgICAgICAgICBkZWNsID0gbm9kZS5kZWNsYXJhdGlvbnNbaV07XG4gICAgICAgICAgICB0aGlzLnZpc2l0VmFyaWFibGVEZWNsYXJhdGlvbih2YXJpYWJsZVRhcmdldFNjb3BlLCBWYXJpYWJsZS5WYXJpYWJsZSwgbm9kZSwgaSk7XG4gICAgICAgICAgICBpZiAoZGVjbC5pbml0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy52aXNpdChkZWNsLmluaXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gc2VjIDEzLjExLjhcbiAgICBTd2l0Y2hTdGF0ZW1lbnQobm9kZSkge1xuICAgICAgICB2YXIgaSwgaXo7XG5cbiAgICAgICAgdGhpcy52aXNpdChub2RlLmRpc2NyaW1pbmFudCk7XG5cbiAgICAgICAgaWYgKHRoaXMuc2NvcGVNYW5hZ2VyLl9faXNFUzYoKSkge1xuICAgICAgICAgICAgdGhpcy5zY29wZU1hbmFnZXIuX19uZXN0U3dpdGNoU2NvcGUobm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGkgPSAwLCBpeiA9IG5vZGUuY2FzZXMubGVuZ3RoOyBpIDwgaXo7ICsraSkge1xuICAgICAgICAgICAgdGhpcy52aXNpdChub2RlLmNhc2VzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2xvc2Uobm9kZSk7XG4gICAgfVxuXG4gICAgRnVuY3Rpb25EZWNsYXJhdGlvbihub2RlKSB7XG4gICAgICAgIHRoaXMudmlzaXRGdW5jdGlvbihub2RlKTtcbiAgICB9XG5cbiAgICBGdW5jdGlvbkV4cHJlc3Npb24obm9kZSkge1xuICAgICAgICB0aGlzLnZpc2l0RnVuY3Rpb24obm9kZSk7XG4gICAgfVxuXG4gICAgRm9yT2ZTdGF0ZW1lbnQobm9kZSkge1xuICAgICAgICB0aGlzLnZpc2l0Rm9ySW4obm9kZSk7XG4gICAgfVxuXG4gICAgRm9ySW5TdGF0ZW1lbnQobm9kZSkge1xuICAgICAgICB0aGlzLnZpc2l0Rm9ySW4obm9kZSk7XG4gICAgfVxuXG4gICAgQXJyb3dGdW5jdGlvbkV4cHJlc3Npb24obm9kZSkge1xuICAgICAgICB0aGlzLnZpc2l0RnVuY3Rpb24obm9kZSk7XG4gICAgfVxuXG4gICAgSW1wb3J0RGVjbGFyYXRpb24obm9kZSkge1xuICAgICAgICB2YXIgaW1wb3J0ZXI7XG5cbiAgICAgICAgYXNzZXJ0KHRoaXMuc2NvcGVNYW5hZ2VyLl9faXNFUzYoKSAmJiB0aGlzLnNjb3BlTWFuYWdlci5pc01vZHVsZSgpLCAnSW1wb3J0RGVjbGFyYXRpb24gc2hvdWxkIGFwcGVhciB3aGVuIHRoZSBtb2RlIGlzIEVTNiBhbmQgaW4gdGhlIG1vZHVsZSBjb250ZXh0LicpO1xuXG4gICAgICAgIGltcG9ydGVyID0gbmV3IEltcG9ydGVyKG5vZGUsIHRoaXMpO1xuICAgICAgICBpbXBvcnRlci52aXNpdChub2RlKTtcbiAgICB9XG5cbiAgICB2aXNpdEV4cG9ydERlY2xhcmF0aW9uKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUuc291cmNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuZGVjbGFyYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMudmlzaXQobm9kZS5kZWNsYXJhdGlvbik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnZpc2l0Q2hpbGRyZW4obm9kZSk7XG4gICAgfVxuXG4gICAgRXhwb3J0RGVjbGFyYXRpb24obm9kZSkge1xuICAgICAgICB0aGlzLnZpc2l0RXhwb3J0RGVjbGFyYXRpb24obm9kZSk7XG4gICAgfVxuXG4gICAgRXhwb3J0TmFtZWREZWNsYXJhdGlvbihub2RlKSB7XG4gICAgICAgIHRoaXMudmlzaXRFeHBvcnREZWNsYXJhdGlvbihub2RlKTtcbiAgICB9XG5cbiAgICBFeHBvcnRTcGVjaWZpZXIobm9kZSkge1xuICAgICAgICBsZXQgbG9jYWwgPSAobm9kZS5pZCB8fCBub2RlLmxvY2FsKTtcbiAgICAgICAgdGhpcy52aXNpdChsb2NhbCk7XG4gICAgfVxufVxuXG4vKiB2aW06IHNldCBzdz00IHRzPTQgZXQgdHc9ODAgOiAqL1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9