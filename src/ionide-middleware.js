// @ts-check

// We can attach this middleware to Ionide LanguageClient to prevent F# autocompletion
// being triggered in template strings
(function() {
    /**
     * @param {string} text
     */
    function findNonNestedBraces(text, addLastNonClosedBraceIfAny = false) {
        const results = [];
        const braces =
            [
                Array.from(text.matchAll(/(?<!\{)\{(?!\{)/g)).map(m => ({ index: m.index, isOpen: true })),
                Array.from(text.matchAll(/(?<!\})\}(?!\})/g)).map(m => ({ index: m.index + 1, isOpen: false })),
            ]
                .flat()
                .sort((x, y) => x.index > y.index ? 1 : x.index == y.index ? 0 : -1);

        let nestedLevel = 0;
        let lastOpenBrace;
        for (let brace of braces) {
            if (brace.isOpen) {
                if (lastOpenBrace == null) {
                    lastOpenBrace = brace.index
                } else {
                    nestedLevel++;
                }
            } else {
                if (nestedLevel === 0) {
                    if (lastOpenBrace != null) {
                        results.push({ start: lastOpenBrace, end: brace.index });
                        lastOpenBrace = null;
                    }
                } else {
                    nestedLevel--;
                }
            }
        }

        if (lastOpenBrace != null && addLastNonClosedBraceIfAny) {
            results.push({ start: lastOpenBrace });
        }

        return results;
    }

    /**
     * @param {string} text
     */
    function isInterpolatedHole(text) {
        const braces = findNonNestedBraces(text, true);
        return braces.length > 0 && braces[braces.length - 1].end == null;
    }

    /**
     * @param {string} text
     */
    function isTemplate(text) {
        const pattern = /[ ._](html|svg|css|js)(\s+\$?""")(?:(?!""")[\s\S])+$/;
        const match = text.match(pattern);
        if (match) {
            const isInterpolated = match[0].startsWith("$")
            return isInterpolated ? !isInterpolatedHole(match[0]) : true;
        }
        return false;
    }

    const middleware = {
        provideCompletionItem(document, position, context, token, next) {
            const text = document.getText().slice(0, document.offsetAt(position));
            if (!isTemplate(text)) {
                return next(document, position, context, token);
            }
        },
        provideHover(document, position, token, next) {
            const text = document.getText().slice(0, document.offsetAt(position));
            if (!isTemplate(text)) {
                return next(document, position, token);
            }
        },
    }
    return middleware;
}())
