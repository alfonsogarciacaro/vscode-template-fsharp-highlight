// @ts-check

// We can attach this middleware to Ionide LanguageClient to prevent F# autocompletion
// being triggered in template strings
const middleware = {
    provideCompletionItem: (document, position, context, token, next) => {
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

        function isTemplateHole(text) {
            const braces = findNonNestedBraces(text, true);
            return braces.length > 0 && braces[braces.length - 1].end == null;
        }

        function tryTripleQuotedTemplate(text) {
            const pattern = /\$"""(?:(?!""")[\s\S])+$/;
            const match = text.match(pattern);
            return match != null ? match[0] : null;
        }

        const text = document.getText().slice(0, document.offsetAt(position));
        const template = tryTripleQuotedTemplate(text);
        if (template == null || isTemplateHole(template)) {
            return next(document, position, context, token);
        }
    },
}