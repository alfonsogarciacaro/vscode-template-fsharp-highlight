# Syntax highlighting for template strings in F\#

VS Code extension that highlights embedded code in F# triple quoted strings (interpolated or not) preceded by a function named:

- `html`
- `svg`
- `css`
- `js`
- `sql`

```fsharp
html """<h1>Hello World!</h1>"""
```

You need to declare the functions by yourself. If you need to do some transformation, make the function accept `FormattableString`:

```fsharp
let sql (s: FormattableString) = // ...
```

> The extension will also accept prefixed function names (case-insensitive) like `toHTML`, `query_sql`, etc.

If you just want to trigger highlighting, use a language comment (also case-insensitive) instead:

```fsharp
(* css *) """:root::before { content: "Hello World!"; }"""
```

For HTML/CSS/JS templates, the extension will forward completion and hover requests to the built-in language providers in VS Code.

![Example](screencast.gif)

## Contributing

- Click **Run and Debug > Launch Extension**
- Open [test cases](./test/grammar.fsx)

### Grammar Debugging

- Install [TextMate Languages](https://marketplace.visualstudio.com/items?itemName=pedro-w.tmlanguage) support
- Update YAML and run **Commmand Palette > Convert to tmLanguage JSON**
- Format YAML and JSON with [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- Add recommended debug tokens to **User Settings**:

  ```jsonc
  "editor.tokenColorCustomizations": {
    "textMateRules": [
      {
        "scope": [
          "DEBUG"], "settings": {
            "fontStyle": "underline",
            "foreground": "#9A9A9A" }
      },
      {
        "scope": [
          "DEBUG.green"], "settings": {
            // Inherits fontStyle from DEBUG
            "foreground": "#17C984" }
      },
      // DEBUG.orange -> #FF8B2D
      // DEBUG.red -> #C62B2B
    ]
  }
  ```

## Acknowledgements

Inspired by [@mjbvz](https://github.com/mjbvz)'s JavaScript/TypeScript support for [Comment tagged templates](https://marketplace.visualstudio.com/items?itemName=bierner.comment-tagged-templates).
