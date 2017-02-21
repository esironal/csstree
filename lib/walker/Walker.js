'use strict';

function walkRules(node, item, list) {
    switch (node.type) {
        case 'StyleSheet':
            var oldStylesheet = this.stylesheet;
            this.stylesheet = node;

            node.children.each(walkRules, this);

            this.stylesheet = oldStylesheet;
            break;

        case 'Atrule':
            if (node.block !== null) {
                walkRules.call(this, node.block);
            }

            this.fn(node, item, list);
            break;

        case 'Rule':
            this.fn(node, item, list);

            var oldRule = this.rule;
            this.rule = node;

            walkRules.call(this, node.block);

            this.rule = oldRule;
            break;

        case 'Block':
            var oldBlock = this.block;
            this.block = node;

            node.children.each(walkRules, this);

            this.block = oldBlock;
            break;
    }
}

function walkRulesRight(node, item, list) {
    switch (node.type) {
        case 'StyleSheet':
            var oldStylesheet = this.stylesheet;
            this.stylesheet = node;

            node.children.eachRight(walkRulesRight, this);

            this.stylesheet = oldStylesheet;
            break;

        case 'Atrule':
            if (node.block !== null) {
                walkRulesRight.call(this, node.block);
            }

            this.fn(node, item, list);
            break;

        case 'Rule':
            var oldRule = this.rule;
            this.rule = node;

            walkRulesRight.call(this, node.block);

            this.rule = oldRule;

            this.fn(node, item, list);
            break;

        case 'Block':
            var oldBlock = this.block;
            this.block = node;

            node.children.eachRight(walkRulesRight, this);

            this.block = oldBlock;
            break;
    }
}

function walkDeclarations(node) {
    switch (node.type) {
        case 'StyleSheet':
            var oldStylesheet = this.stylesheet;
            this.stylesheet = node;

            node.children.each(walkDeclarations, this);

            this.stylesheet = oldStylesheet;
            break;

        case 'Atrule':
            if (node.block !== null) {
                walkDeclarations.call(this, node.block);
            }
            break;

        case 'Rule':
            var oldRule = this.rule;
            this.rule = node;

            if (node.block !== null) {
                walkDeclarations.call(this, node.block);
            }

            this.rule = oldRule;
            break;

        case 'Block':
            node.children.each(function(node, item, list) {
                if (node.type === 'Declaration') {
                    this.fn(node, item, list);
                } else {
                    walkDeclarations.call(this, node);
                }
            }, this);
            break;
    }
}

function createContext(walker, root, fn) {
    var context = {
        fn: fn,
        walkers: walker.type,
        root: root,
        stylesheet: null,
        atruleExpression: null,
        rule: null,
        selector: null,
        block: null,
        declaration: null,
        function: null
    };

    return context;
}

var Walker = function() {
    this.all = this.all.bind(this);
    this.allUp = this.allUp.bind(this);
    this.rules = this.rules.bind(this);
    this.rulesRight = this.rulesRight.bind(this);
    this.declarations = this.declarations.bind(this);
};

Walker.prototype = {
    all: function(root, fn) {
        function walk(node, item, list) {
            fn.call(context, node, item, list);
            if (walkers.hasOwnProperty(node.type)) {
                walkers[node.type](node, context, walk);
            }
        }

        var walkers = this.type;
        var context = createContext(this, root, fn);

        walk(root);
    },
    allUp: function(root, fn) {
        function walk(node, item, list) {
            if (walkers.hasOwnProperty(node.type)) {
                walkers[node.type](node, context, walk);
            }
            fn.call(context, node, item, list);
        }

        var walkers = this.type;
        var context = createContext(this, root, fn);

        walk(root);
    },
    rules: function(root, fn) {
        walkRules.call(createContext(this, root, fn), root);
    },
    rulesRight: function(root, fn) {
        walkRulesRight.call(createContext(this, root, fn), root);
    },
    declarations: function(root, fn) {
        walkDeclarations.call(createContext(this, root, fn), root);
    },

    type: {
    }
};

module.exports = Walker;