import { CancellationToken, commands, CompletionList, Event, ExtensionContext, Hover, languages, Position, ProviderResult, Selection, SnippetString, TextDocument, TextDocumentContentProvider, Uri, workspace } from 'vscode';

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

function findOccurrences(text: string, pattern: string, start = 0, accumulated = 0) {
	const i = text.indexOf(pattern, start);
	return i === -1 ? accumulated : findOccurrences(text, pattern, i + pattern.length, accumulated + 1);
}

function findOccurrence(text: string, pattern: string, occurrence: number, start = 0) {
	const i = text.indexOf(pattern, start);
	if (i === -1) {
		return -1;
	}
	return occurrence <= 1 ? i : findOccurrence(text, pattern, occurrence - 1, i + pattern.length);
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
	const pattern = /[ ._](html|svg|sql|css|js|python)\s+(\$?"+)/g;

	function parseEmbeddedRegion(match: RegExpMatchArray, mustBeCurrent = false) {
		const virtualId = match[1];
		const isInterpolated = match[2].startsWith('$');
		const quotes = isInterpolated ? match[2].slice(1) : match[2];
		if (quotes.length !== 1 && quotes.length !== 3) {
			return;
		}
	
		const endPattern = quotes.length === 1 ? /(?!\\)"/ : /"""/;
		const regionStart = match.index + match[0].length;
		const endMatch = text.slice(regionStart).match(endPattern);
		if (mustBeCurrent && regionStart + endMatch.index <= offset) {
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
	
		return {
			virtualId,
			regionStart,
			regionEnd,
			holes
		}
	}

	const textSlice = text.slice(0, offset);
	const matches: RegExpMatchArray[] = [];
	while (true) {
		const m = pattern.exec(textSlice);
		if (m == null) break;
		matches.push(m);
	}
	if (matches.length === 0) {
		return;
	}
	
	const current = parseEmbeddedRegion(matches[matches.length - 1], /* mustBeCurrent */ true);
	if (current) {
		const virtualId = current.virtualId;
		let regionContent = text.slice(current.regionStart, current.regionEnd);

		if (current.holes) {
			// Replacing F# content in braces with whitespace helps autocomplete for css
			if (virtualId === "css") {
				regionContent = replaceNonNestedBracesWithWhitespace(regionContent, current.holes);
			}
	
			// Replace F# escape braces
			regionContent = regionContent
				.replace(/\{\{/g, "{ ")
				.replace(/\}\}/g, "} ")
				.replace(/%%/g, "% ");
		}

		// First fill virtualContent with whitespace
		let virtualContent = replaceWithWhitespace(text);
		virtualContent = virtualContent.slice(0, current.regionStart) + regionContent + virtualContent.slice(current.regionEnd);

		// For python include also previous regions
		if (virtualId === "python") {
			for (let i = 0; i < matches.length - 1; i++) {
				const region = parseEmbeddedRegion(matches[i]);
				if (region && region.virtualId === "python") {
					virtualContent = virtualContent.slice(0, region.regionStart) + text.slice(region.regionStart, region.regionEnd) + virtualContent.slice(region.regionEnd);
				}
			}
		}

		return [virtualId, virtualContent];
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

class TextProvider implements TextDocumentContentProvider {
	virtualDocumentContents = new Map<string, string>();

	provideTextDocumentContent(uri: Uri, token: CancellationToken): ProviderResult<string> {
		const originalUri = uri.path.slice(1).slice(0, uri.path.lastIndexOf(".") - 1);
		// const decodedUri = decodeURIComponent(originalUri);
		const content = this.virtualDocumentContents.get(originalUri);
		return content;
	}

	getVirtualUriString(virtualId: string, originalUri: string): string {
		switch (virtualId) {
			case "python":
				return `vscode-notebook://python/${encodeURIComponent(originalUri)}.py`;
			// case "html":
			// case "svg":
			// case "css":
			// case "sql":
			// case "js":
			default:
				return `embedded-content://${virtualId}/${encodeURIComponent(originalUri)}.${virtualId}`;
		}
	}

	setContent(virtualId: string, originalUri: Uri, virtualContent: string): Uri {
		const originalUriString = originalUri.toString()
		const virtualUriString = this.getVirtualUriString(virtualId, originalUriString);
		this.virtualDocumentContents.set(originalUriString, virtualContent);
		return Uri.parse(virtualUriString);
	}
}

export function activate(context: ExtensionContext) {
	const textProvider = new TextProvider();
	workspace.registerTextDocumentContentProvider('embedded-content', textProvider);
	// For Python we need to use this identifier
	workspace.registerTextDocumentContentProvider('vscode-notebook', textProvider);

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
							if (!(virtualId === "js" || virtualId === "python")) {
								return;
							}
							break;
					}

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

					const virtualUri = textProvider.setContent(virtualId, document.uri, virtualContent);

					const result = await commands.executeCommand<CompletionList>(
						'vscode.executeCompletionItemProvider',
						virtualUri,
						position,
						context.triggerCharacter
					);
					return result;
				}
			}
		},
		">", "/", "."
	)

	languages.registerHoverProvider(
		[{ scheme: 'file', language: 'fsharp' }],
		{
			async provideHover(document, position, token) {
				const documentText = document.getText();
				const documentOffset = document.offsetAt(position);
				const virtual = tryVirtualContent({ text: documentText, offset: documentOffset });
				if (virtual != null) {
					const [virtualId, virtualContent] = virtual;
					const virtualUri = textProvider.setContent(virtualId, document.uri, virtualContent);
					const result = await commands.executeCommand<Hover[]>(
						'vscode.executeHoverProvider',
						virtualUri,
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
