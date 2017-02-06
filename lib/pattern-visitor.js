'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _estraverse = require('estraverse');

var _esrecurse = require('esrecurse');

var _esrecurse2 = _interopRequireDefault(_esrecurse);

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

function getLast(xs) {
    return xs[xs.length - 1] || null;
}

var PatternVisitor = function (_esrecurse$Visitor) {
    _inherits(PatternVisitor, _esrecurse$Visitor);

    _createClass(PatternVisitor, null, [{
        key: 'isPattern',
        value: function isPattern(node) {
            var nodeType = node.type;
            return nodeType === _estraverse.Syntax.Identifier || nodeType === _estraverse.Syntax.ObjectPattern || nodeType === _estraverse.Syntax.ArrayPattern || nodeType === _estraverse.Syntax.SpreadElement || nodeType === _estraverse.Syntax.RestElement || nodeType === _estraverse.Syntax.AssignmentPattern;
        }
    }]);

    function PatternVisitor(options, rootPattern, callback) {
        _classCallCheck(this, PatternVisitor);

        var _this = _possibleConstructorReturn(this, (PatternVisitor.__proto__ || Object.getPrototypeOf(PatternVisitor)).call(this, null, options));

        _this.rootPattern = rootPattern;
        _this.callback = callback;
        _this.assignments = [];
        _this.rightHandNodes = [];
        _this.restElements = [];
        return _this;
    }

    _createClass(PatternVisitor, [{
        key: 'Identifier',
        value: function Identifier(pattern) {
            var lastRestElement = getLast(this.restElements);
            this.callback(pattern, {
                topLevel: pattern === this.rootPattern,
                rest: lastRestElement != null && lastRestElement.argument === pattern,
                assignments: this.assignments
            });
        }
    }, {
        key: 'Property',
        value: function Property(property) {
            // Computed property's key is a right hand node.
            if (property.computed) {
                this.rightHandNodes.push(property.key);
            }

            // If it's shorthand, its key is same as its value.
            // If it's shorthand and has its default value, its key is same as its value.left (the value is AssignmentPattern).
            // If it's not shorthand, the name of new variable is its value's.
            this.visit(property.value);
        }
    }, {
        key: 'ArrayPattern',
        value: function ArrayPattern(pattern) {
            var i, iz, element;
            for (i = 0, iz = pattern.elements.length; i < iz; ++i) {
                element = pattern.elements[i];
                this.visit(element);
            }
        }
    }, {
        key: 'AssignmentPattern',
        value: function AssignmentPattern(pattern) {
            this.assignments.push(pattern);
            this.visit(pattern.left);
            this.rightHandNodes.push(pattern.right);
            this.assignments.pop();
        }
    }, {
        key: 'RestElement',
        value: function RestElement(pattern) {
            this.restElements.push(pattern);
            this.visit(pattern.argument);
            this.restElements.pop();
        }
    }, {
        key: 'MemberExpression',
        value: function MemberExpression(node) {
            // Computed property's key is a right hand node.
            if (node.computed) {
                this.rightHandNodes.push(node.property);
            }
            // the object is only read, write to its property.
            this.rightHandNodes.push(node.object);
        }

        //
        // ForInStatement.left and AssignmentExpression.left are LeftHandSideExpression.
        // By spec, LeftHandSideExpression is Pattern or MemberExpression.
        //   (see also: https://github.com/estree/estree/pull/20#issuecomment-74584758)
        // But espree 2.0 and esprima 2.0 parse to ArrayExpression, ObjectExpression, etc...
        //

    }, {
        key: 'SpreadElement',
        value: function SpreadElement(node) {
            this.visit(node.argument);
        }
    }, {
        key: 'ArrayExpression',
        value: function ArrayExpression(node) {
            node.elements.forEach(this.visit, this);
        }
    }, {
        key: 'AssignmentExpression',
        value: function AssignmentExpression(node) {
            this.assignments.push(node);
            this.visit(node.left);
            this.rightHandNodes.push(node.right);
            this.assignments.pop();
        }
    }, {
        key: 'CallExpression',
        value: function CallExpression(node) {
            var _this2 = this;

            // arguments are right hand nodes.
            node.arguments.forEach(function (a) {
                _this2.rightHandNodes.push(a);
            });
            this.visit(node.callee);
        }
    }]);

    return PatternVisitor;
}(_esrecurse2.default.Visitor);

/* vim: set sw=4 ts=4 et tw=80 : */


exports.default = PatternVisitor;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhdHRlcm4tdmlzaXRvci5qcyJdLCJuYW1lcyI6WyJnZXRMYXN0IiwieHMiLCJsZW5ndGgiLCJQYXR0ZXJuVmlzaXRvciIsIm5vZGUiLCJub2RlVHlwZSIsInR5cGUiLCJJZGVudGlmaWVyIiwiT2JqZWN0UGF0dGVybiIsIkFycmF5UGF0dGVybiIsIlNwcmVhZEVsZW1lbnQiLCJSZXN0RWxlbWVudCIsIkFzc2lnbm1lbnRQYXR0ZXJuIiwib3B0aW9ucyIsInJvb3RQYXR0ZXJuIiwiY2FsbGJhY2siLCJhc3NpZ25tZW50cyIsInJpZ2h0SGFuZE5vZGVzIiwicmVzdEVsZW1lbnRzIiwicGF0dGVybiIsImxhc3RSZXN0RWxlbWVudCIsInRvcExldmVsIiwicmVzdCIsImFyZ3VtZW50IiwicHJvcGVydHkiLCJjb21wdXRlZCIsInB1c2giLCJrZXkiLCJ2aXNpdCIsInZhbHVlIiwiaSIsIml6IiwiZWxlbWVudCIsImVsZW1lbnRzIiwibGVmdCIsInJpZ2h0IiwicG9wIiwib2JqZWN0IiwiZm9yRWFjaCIsImFyZ3VtZW50cyIsImEiLCJjYWxsZWUiLCJWaXNpdG9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQXdCQTs7QUFDQTs7Ozs7Ozs7OzsrZUF6QkE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTJCQSxTQUFTQSxPQUFULENBQWlCQyxFQUFqQixFQUFxQjtBQUNqQixXQUFPQSxHQUFHQSxHQUFHQyxNQUFILEdBQVksQ0FBZixLQUFxQixJQUE1QjtBQUNIOztJQUVvQkMsYzs7Ozs7a0NBQ0FDLEksRUFBTTtBQUNuQixnQkFBSUMsV0FBV0QsS0FBS0UsSUFBcEI7QUFDQSxtQkFDSUQsYUFBYSxtQkFBT0UsVUFBcEIsSUFDQUYsYUFBYSxtQkFBT0csYUFEcEIsSUFFQUgsYUFBYSxtQkFBT0ksWUFGcEIsSUFHQUosYUFBYSxtQkFBT0ssYUFIcEIsSUFJQUwsYUFBYSxtQkFBT00sV0FKcEIsSUFLQU4sYUFBYSxtQkFBT08saUJBTnhCO0FBUUg7OztBQUVELDRCQUFZ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QlMsSUFBcEIsQ0FBeUJjLENBQXpCO0FBQThCLGFBQTVEO0FBQ0EsaUJBQUtaLEtBQUwsQ0FBV3hCLEtBQUtxQyxNQUFoQjtBQUNIOzs7O0VBbkd1QyxvQkFBVUMsTzs7QUFzR3REOzs7a0JBdEdxQnZDLGMiLCJmaWxlIjoicGF0dGVybi12aXNpdG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAgQ29weXJpZ2h0IChDKSAyMDE1IFl1c3VrZSBTdXp1a2kgPHV0YXRhbmUudGVhQGdtYWlsLmNvbT5cblxuICBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAgbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG5cbiAgICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0XG4gICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gICAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodFxuICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZVxuICAgICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cblxuICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIlxuICBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFXG4gIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFXG4gIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCA8Q09QWVJJR0hUIEhPTERFUj4gQkUgTElBQkxFIEZPUiBBTllcbiAgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVNcbiAgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTO1xuICBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkRcbiAgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbiAgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GXG4gIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4qL1xuXG5pbXBvcnQgeyBTeW50YXggfSBmcm9tICdlc3RyYXZlcnNlJztcbmltcG9ydCBlc3JlY3Vyc2UgZnJvbSAnZXNyZWN1cnNlJztcblxuZnVuY3Rpb24gZ2V0TGFzdCh4cykge1xuICAgIHJldHVybiB4c1t4cy5sZW5ndGggLSAxXSB8fCBudWxsO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQYXR0ZXJuVmlzaXRvciBleHRlbmRzIGVzcmVjdXJzZS5WaXNpdG9yIHtcbiAgICBzdGF0aWMgaXNQYXR0ZXJuKG5vZGUpIHtcbiAgICAgICAgdmFyIG5vZGVUeXBlID0gbm9kZS50eXBlO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgbm9kZVR5cGUgPT09IFN5bnRheC5JZGVudGlmaWVyIHx8XG4gICAgICAgICAgICBub2RlVHlwZSA9PT0gU3ludGF4Lk9iamVjdFBhdHRlcm4gfHxcbiAgICAgICAgICAgIG5vZGVUeXBlID09PSBTeW50YXguQXJyYXlQYXR0ZXJuIHx8XG4gICAgICAgICAgICBub2RlVHlwZSA9PT0gU3ludGF4LlNwcmVhZEVsZW1lbnQgfHxcbiAgICAgICAgICAgIG5vZGVUeXBlID09PSBTeW50YXguUmVzdEVsZW1lbnQgfHxcbiAgICAgICAgICAgIG5vZGVUeXBlID09PSBTeW50YXguQXNzaWdubWVudFBhdHRlcm5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zLCByb290UGF0dGVybiwgY2FsbGJhY2spIHtcbiAgICAgICAgc3VwZXIobnVsbCwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMucm9vdFBhdHRlcm4gPSByb290UGF0dGVybjtcbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICB0aGlzLmFzc2lnbm1lbnRzID0gW107XG4gICAgICAgIHRoaXMucmlnaHRIYW5kTm9kZXMgPSBbXTtcbiAgICAgICAgdGhpcy5yZXN0RWxlbWVudHMgPSBbXTtcbiAgICB9XG5cbiAgICBJZGVudGlmaWVyKHBhdHRlcm4pIHtcbiAgICAgICAgY29uc3QgbGFzdFJlc3RFbGVtZW50ID0gZ2V0TGFzdCh0aGlzLnJlc3RFbGVtZW50cyk7XG4gICAgICAgIHRoaXMuY2FsbGJhY2socGF0dGVybiwge1xuICAgICAgICAgICAgdG9wTGV2ZWw6IHBhdHRlcm4gPT09IHRoaXMucm9vdFBhdHRlcm4sXG4gICAgICAgICAgICByZXN0OiBsYXN0UmVzdEVsZW1lbnQgIT0gbnVsbCAmJiBsYXN0UmVzdEVsZW1lbnQuYXJndW1lbnQgPT09IHBhdHRlcm4sXG4gICAgICAgICAgICBhc3NpZ25tZW50czogdGhpcy5hc3NpZ25tZW50c1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBQcm9wZXJ0eShwcm9wZXJ0eSkge1xuICAgICAgICAvLyBDb21wdXRlZCBwcm9wZXJ0eSdzIGtleSBpcyBhIHJpZ2h0IGhhbmQgbm9kZS5cbiAgICAgICAgaWYgKHByb3BlcnR5LmNvbXB1dGVkKSB7XG4gICAgICAgICAgICB0aGlzLnJpZ2h0SGFuZE5vZGVzLnB1c2gocHJvcGVydHkua2V5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGl0J3Mgc2hvcnRoYW5kLCBpdHMga2V5IGlzIHNhbWUgYXMgaXRzIHZhbHVlLlxuICAgICAgICAvLyBJZiBpdCdzIHNob3J0aGFuZCBhbmQgaGFzIGl0cyBkZWZhdWx0IHZhbHVlLCBpdHMga2V5IGlzIHNhbWUgYXMgaXRzIHZhbHVlLmxlZnQgKHRoZSB2YWx1ZSBpcyBBc3NpZ25tZW50UGF0dGVybikuXG4gICAgICAgIC8vIElmIGl0J3Mgbm90IHNob3J0aGFuZCwgdGhlIG5hbWUgb2YgbmV3IHZhcmlhYmxlIGlzIGl0cyB2YWx1ZSdzLlxuICAgICAgICB0aGlzLnZpc2l0KHByb3BlcnR5LnZhbHVlKTtcbiAgICB9XG5cbiAgICBBcnJheVBhdHRlcm4ocGF0dGVybikge1xuICAgICAgICB2YXIgaSwgaXosIGVsZW1lbnQ7XG4gICAgICAgIGZvciAoaSA9IDAsIGl6ID0gcGF0dGVybi5lbGVtZW50cy5sZW5ndGg7IGkgPCBpejsgKytpKSB7XG4gICAgICAgICAgICBlbGVtZW50ID0gcGF0dGVybi5lbGVtZW50c1tpXTtcbiAgICAgICAgICAgIHRoaXMudmlzaXQoZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBBc3NpZ25tZW50UGF0dGVybihwYXR0ZXJuKSB7XG4gICAgICAgIHRoaXMuYXNzaWdubWVudHMucHVzaChwYXR0ZXJuKTtcbiAgICAgICAgdGhpcy52aXNpdChwYXR0ZXJuLmxlZnQpO1xuICAgICAgICB0aGlzLnJpZ2h0SGFuZE5vZGVzLnB1c2gocGF0dGVybi5yaWdodCk7XG4gICAgICAgIHRoaXMuYXNzaWdubWVudHMucG9wKCk7XG4gICAgfVxuXG4gICAgUmVzdEVsZW1lbnQocGF0dGVybikge1xuICAgICAgICB0aGlzLnJlc3RFbGVtZW50cy5wdXNoKHBhdHRlcm4pO1xuICAgICAgICB0aGlzLnZpc2l0KHBhdHRlcm4uYXJndW1lbnQpO1xuICAgICAgICB0aGlzLnJlc3RFbGVtZW50cy5wb3AoKTtcbiAgICB9XG5cbiAgICBNZW1iZXJFeHByZXNzaW9uKG5vZGUpIHtcbiAgICAgICAgLy8gQ29tcHV0ZWQgcHJvcGVydHkncyBrZXkgaXMgYSByaWdodCBoYW5kIG5vZGUuXG4gICAgICAgIGlmIChub2RlLmNvbXB1dGVkKSB7XG4gICAgICAgICAgICB0aGlzLnJpZ2h0SGFuZE5vZGVzLnB1c2gobm9kZS5wcm9wZXJ0eSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdGhlIG9iamVjdCBpcyBvbmx5IHJlYWQsIHdyaXRlIHRvIGl0cyBwcm9wZXJ0eS5cbiAgICAgICAgdGhpcy5yaWdodEhhbmROb2Rlcy5wdXNoKG5vZGUub2JqZWN0KTtcbiAgICB9XG5cbiAgICAvL1xuICAgIC8vIEZvckluU3RhdGVtZW50LmxlZnQgYW5kIEFzc2lnbm1lbnRFeHByZXNzaW9uLmxlZnQgYXJlIExlZnRIYW5kU2lkZUV4cHJlc3Npb24uXG4gICAgLy8gQnkgc3BlYywgTGVmdEhhbmRTaWRlRXhwcmVzc2lvbiBpcyBQYXR0ZXJuIG9yIE1lbWJlckV4cHJlc3Npb24uXG4gICAgLy8gICAoc2VlIGFsc286IGh0dHBzOi8vZ2l0aHViLmNvbS9lc3RyZWUvZXN0cmVlL3B1bGwvMjAjaXNzdWVjb21tZW50LTc0NTg0NzU4KVxuICAgIC8vIEJ1dCBlc3ByZWUgMi4wIGFuZCBlc3ByaW1hIDIuMCBwYXJzZSB0byBBcnJheUV4cHJlc3Npb24sIE9iamVjdEV4cHJlc3Npb24sIGV0Yy4uLlxuICAgIC8vXG5cbiAgICBTcHJlYWRFbGVtZW50KG5vZGUpIHtcbiAgICAgICAgdGhpcy52aXNpdChub2RlLmFyZ3VtZW50KTtcbiAgICB9XG5cbiAgICBBcnJheUV4cHJlc3Npb24obm9kZSkge1xuICAgICAgICBub2RlLmVsZW1lbnRzLmZvckVhY2godGhpcy52aXNpdCwgdGhpcyk7XG4gICAgfVxuXG4gICAgQXNzaWdubWVudEV4cHJlc3Npb24obm9kZSkge1xuICAgICAgICB0aGlzLmFzc2lnbm1lbnRzLnB1c2gobm9kZSk7XG4gICAgICAgIHRoaXMudmlzaXQobm9kZS5sZWZ0KTtcbiAgICAgICAgdGhpcy5yaWdodEhhbmROb2Rlcy5wdXNoKG5vZGUucmlnaHQpO1xuICAgICAgICB0aGlzLmFzc2lnbm1lbnRzLnBvcCgpO1xuICAgIH1cblxuICAgIENhbGxFeHByZXNzaW9uKG5vZGUpIHtcbiAgICAgICAgLy8gYXJndW1lbnRzIGFyZSByaWdodCBoYW5kIG5vZGVzLlxuICAgICAgICBub2RlLmFyZ3VtZW50cy5mb3JFYWNoKGEgPT4geyB0aGlzLnJpZ2h0SGFuZE5vZGVzLnB1c2goYSk7IH0pO1xuICAgICAgICB0aGlzLnZpc2l0KG5vZGUuY2FsbGVlKTtcbiAgICB9XG59XG5cbi8qIHZpbTogc2V0IHN3PTQgdHM9NCBldCB0dz04MCA6ICovXG4iXX0=