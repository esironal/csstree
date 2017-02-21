var TYPE = require('../../tokenizer').TYPE;

var IDENTIFIER = TYPE.Identifier;
var SEMICOLON = TYPE.Semicolon;
var COMMERCIALAT = TYPE.CommercialAt;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var RIGHTCURLYBRACKET = TYPE.RightCurlyBracket;
var BALANCED = true;

function isBlockAtrule() {
    for (var offset = 1, type; type = this.scanner.lookupType(offset); offset++) {
        if (type === RIGHTCURLYBRACKET) {
            return true;
        }

        if (type === LEFTCURLYBRACKET ||
            type === COMMERCIALAT) {
            return false;
        }
    }

    this.scanner.skip(offset);
    this.scanner.eat(RIGHTCURLYBRACKET);
}

module.exports = {
    name: 'Atrule',
    parse: function() {
        var start = this.scanner.tokenStart;
        var name;
        var nameLowerCase;
        var expression = null;
        var block = null;

        this.scanner.eat(COMMERCIALAT);

        name = this.scanner.consume(IDENTIFIER);
        nameLowerCase = name.toLowerCase();
        this.scanner.skipSC();

        if (this.parseAtruleExpression) {
            expression = this.AtruleExpression(name);
            this.scanner.skipSC();
        } else {
            expression = this.Raw(BALANCED, SEMICOLON, LEFTCURLYBRACKET);
        }

        if (this.atrule.hasOwnProperty(nameLowerCase)) {
            if (typeof this.atrule[nameLowerCase].block === 'function') {
                if (this.scanner.tokenType !== LEFTCURLYBRACKET) {
                    this.scanner.error('Curly bracket is expected');
                }

                block = this.atrule[nameLowerCase].block.call(this);
            } else {
                this.scanner.eat(SEMICOLON);
            }
        } else {
            switch (this.scanner.tokenType) {
                case SEMICOLON:
                    this.scanner.next();
                    break;

                case LEFTCURLYBRACKET:
                    block = this.Block(isBlockAtrule.call(this) ? this.Declaration : this.Rule);
                    break;

                default:
                    this.scanner.error('Semicolon or block is expected');
            }
        }

        return {
            type: 'Atrule',
            loc: this.getLocation(start, this.scanner.tokenStart),
            name: name,
            expression: expression,
            block: block
        };
    },
    generate: function(node) {
        var result = '@' + node.name;

        if (node.expression !== null) {
            result += ' ' + this.generate(node.expression);
        }

        if (node.block) {
            result += this.generate(node.block);
        } else {
            result += ';';
        }

        return result;
    },
    walk: function(node, context, walk) {
        if (node.expression !== null) {
            walk(node.expression);
        }
        if (node.block !== null) {
            walk(node.block);
        }
    }
};