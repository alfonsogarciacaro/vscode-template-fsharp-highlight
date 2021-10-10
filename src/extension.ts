import { off } from 'process';
import { commands, CompletionList, ExtensionContext, Hover, languages, Position, Range, Selection, SnippetString, TextDocument, TextEditor, TextEditorEdit, Uri, workspace } from 'vscode';

function last<T>(xs: Iterable<T>): T | undefined {
	let res: T | undefined;
	for (let x of xs) {
		res = x;
	}
	return res;
}

function mapToArray<T, T2>(xs: Iterable<T>, f: (x: T) => T2): T2[] {
	const results = [];
	for (let x of xs) {
		results.push(f(x))
	}
	return results;
}

function tryFirst<T>(...ops: (() => T)[]): T | undefined {
	for (let op of ops) {
		const result = op();
		if (result != null) {
			return result;
		}
	}
}

type Brace = { start: number, end?: number };

function findNonNestedBraces({ text, addLastNonClosedBraceIfAny = false }: { text: string, addLastNonClosedBraceIfAny?: boolean }) {
	const results: Brace[] = [];
	const braces =
		[
			mapToArray(text.matchAll(/(?<!\{)\{(?!\{)/g), m => ({ index: m.index, isOpen: true })),
			mapToArray(text.matchAll(/(?<!\})\}(?!\})/g), m => ({ index: m.index + 1, isOpen: false })),
		]
			.flat()
			.sort((x, y) => x.index > y.index ? 1 : x.index == y.index ? 0 : -1);

	let nestedLevel = 0;
	let lastOpenBrace: number | undefined;
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

function replaceWithWhitespace(text: string) {
	return text
		.split('\n')
		.map(line => {
			return ' '.repeat(line.length);
		}).join('\n');
}

function replaceNonNestedBracesWithWhitespace(text: string, braces?: Brace[]) {
	braces = braces || findNonNestedBraces({ text });
	if (braces.length === 0) {
		return text;
	} else {
		let newText = "";
		let lastIndex = 0;
		for (let brace of braces) {
			newText += text.slice(lastIndex, brace.start);
			newText += replaceWithWhitespace(text.slice(brace.start, brace.end));
			lastIndex = brace.end;
		}
		newText += text.slice(lastIndex);
		return newText;
	}
}

function tryVirtualContent({ text, offset, ignoreHoles = true }: { text: string, offset: number, ignoreHoles?: boolean } ): [string, string] | undefined {
	const pattern = /[ ._](html|svg|sql|css|js)\s+(\$?"+)/g;

	// TODO: We could start closer to the current offset for better performance
	const textSlice = text.slice(0, offset);
	let match: RegExpMatchArray;
	while (true) {
		const m = pattern.exec(textSlice);
		if (m == null) break;
		match = m;
	}
	if (match == null) {
		return;
	}
	
	const virtualId = match[1];
	const isInterpolated = match[2].startsWith('$');
	const quotes = isInterpolated ? match[2].slice(1) : match[2];
	if (quotes.length !== 1 && quotes.length !== 3) {
		return;
	}

	const endPattern = quotes.length === 1 ? /(?!\\)"/ : /"""/;
	const regionStart = match.index + match[0].length;
	const endMatch = text.slice(regionStart).match(endPattern);
	if (regionStart + endMatch.index <= offset) {
		return;
	}
	
	let holes: Brace[] | undefined;
	if (isInterpolated && ignoreHoles) {
		// Check we're not in a hole
		holes = findNonNestedBraces({ text: text.slice(regionStart, offset), addLastNonClosedBraceIfAny: true });
		if (holes.length > 0 && holes[holes.length - 1].end == null) {
			return;
		}
	}

	const regionEnd = endMatch ? regionStart + endMatch.index : text.length;

	let regionContent = text.slice(regionStart, regionEnd);

	if (isInterpolated) {
		// Replacing F# content in braces with whitespace helps autocomplete for css
		if (virtualId === "css") {
			regionContent = replaceNonNestedBracesWithWhitespace(regionContent, holes);
		}

		// Replace F# escape braces
		regionContent = regionContent
			.replace(/\{\{/g, "{ ")
			.replace(/\}\}/g, "} ")
			.replace(/%%/g, "% ");
	}

	// First fill virtualContent with whitespace
	let virtualContent = replaceWithWhitespace(text);
	virtualContent = virtualContent.slice(0, regionStart) + regionContent + virtualContent.slice(regionEnd);

	return [virtualId, virtualContent];
}

function getCommentMarks(virtualId: string): [start: string, end?: string] | undefined {
	switch (virtualId) {
		case "html":
		case "svg":
			return ["<!--", "-->"];
		case "css":
			return ["/*", "*/"];
		case "sql":
			return ["--"];
		case "js":
			return ["//"];
		default:
			return;
	}
}

function getLineText(document: TextDocument, line: number) {
	return document.getText().slice(
		document.offsetAt(new Position(line, 0)),
		document.offsetAt(new Position(line + 1, 0))
	);
}

function getSelectionStartAndEndLines(selection: Selection): [number, number] {
	let startPos = selection.anchor;
	let endPos = selection.active;
	if (startPos.line > endPos.line) {
		const tmp = startPos;
		startPos = endPos;
		endPos = tmp;
	}
	const startLine = startPos.line;
	const endLine = endPos.line > startLine && endPos.character === 0 ? endPos.line - 1 : endPos.line
	return [startLine, endLine];
}

export function activate(context: ExtensionContext) {
	const virtualDocumentContents = new Map<string, string>();

	workspace.registerTextDocumentContentProvider('embedded-content', {
		provideTextDocumentContent: uri => {
			const originalUri = uri.path.slice(1).slice(0, uri.path.lastIndexOf(".") - 1);
			// const decodedUri = decodeURIComponent(originalUri);
			const content = virtualDocumentContents.get(originalUri);
			return content;
		}
	});

	languages.registerCompletionItemProvider(
		[{ scheme: 'file', language: 'fsharp' }],
		{
			async provideCompletionItems(document, position, token, context) {
				const documentText = document.getText();
				const documentOffset = document.offsetAt(position);
				const virtual = tryVirtualContent({ text: documentText, offset: documentOffset });
				if (virtual != null) {
					const [virtualId, virtualContent] = virtual;
					switch (context.triggerCharacter) {
						case "<":
						case "/":
							if (!(virtualId === "html" || virtualId === "svg")) {
								return;
							}
							break;
						case ".":
							if (virtualId !== "js") {
								return;
							}
							break;
					}

					const originalUri = document.uri.toString();
					const vdocUriString = `embedded-content://${virtualId}/${encodeURIComponent(
						originalUri
					)}.${virtualId}`;

					virtualDocumentContents.set(originalUri, virtualContent);
					const vdocUri = Uri.parse(vdocUriString);

					// Auto-closing tags is not working so try to provide our own
					if (context.triggerCharacter === ">") {
						if (documentText[documentOffset - 2] !== "/") {
							const tagMatch = last(virtualContent.slice(0, documentOffset).matchAll(/<\/?([\w-]+)/g));
							if (tagMatch && tagMatch[0][1] !== "/") {
								const tag = tagMatch[1];
								// TODO: complete this list
								const noClosingTags = ["area", "br", "col", "hr", "img", "input", "link"];
								if (noClosingTags.indexOf(tag) === -1) {
									return new CompletionList([{
										label: `</${tag}>`,
										insertText: new SnippetString(`$0</${tag}>`,)
									}])
								}
							}
						}
						return;
					}

					const result = await commands.executeCommand<CompletionList>(
						'vscode.executeCompletionItemProvider',
						vdocUri,
						position,
						context.triggerCharacter
					);
					return result;
				}
			}
		},
		">", "/", "."
	)

	// TODO: Forwarding hover is not working well, not sure why
	// languages.registerHoverProvider
	languages.registerHoverProvider(
		[{ scheme: 'file', language: 'fsharp' }],
		{
			async provideHover(document, position, token) {
				const documentText = document.getText();
				const documentOffset = document.offsetAt(position);
				const virtual = tryVirtualContent({ text: documentText, offset: documentOffset });
				if (virtual != null) {
					const [virtualId, virtualContent] = virtual;
					const originalUri = document.uri.toString();
					const vdocUriString = `embedded-content://${virtualId}/${encodeURIComponent(
						originalUri
					)}.${virtualId}`;

					virtualDocumentContents.set(originalUri, virtualContent);
					const vdocUri = Uri.parse(vdocUriString);

					const result = await commands.executeCommand<Hover[]>(
						'vscode.executeHoverProvider',
						vdocUri,
						position,
					);
					if (result.length > 0) {
						return result[0];
					}
				}
			}
		}
	)
}
