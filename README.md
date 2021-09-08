# Syntax highlighting for template strings in F#

VS Code extension that highlights HTML/SVG/CSS/SQL in F# interpolated strings with the following format.

```fsharp
html $"""<h1>Hello World!</h1>"""
```

You need to declare the `html/svg/css/sql` functions by yourself. If you need to do some transformation, make a function accepting `FormattableString`:

```fsharp
let sql (s: FormattableString) = ...
```

If you just want to trigger highlighting, use an identity function:

```fsharp
let svg (s: string) = s
```

For HTML/CSS templates, the extension will forward completion requests to the built-in language providers in VS Code.

![Example](screencast.gif)