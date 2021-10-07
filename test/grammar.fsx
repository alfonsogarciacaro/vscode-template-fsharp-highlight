// fsharplint:disable PrivateValuesNames

let endTestBindings = ()
// * should NOT affect subsequent lines after language function or language comment followed by line break
    (* html *)
let    html = ignore
let  toHTML = html
let to_html = html
    (* svg *)
let    svg = ignore
let  toSVG = svg
let to_svg = svg
    (* css *)
let    css = ignore
let  toCSS = css
let to_css = css
    (* js *)
let    js = ignore
let  toJS = js
let to_js = js
    (* sql *)
let    sql = ignore
let  toSQL = sql
let to_sql = sql

let ``should highlight embedded code in triple quoted string INCLUDING inside curly braces after language`` =

  let ``function`` =
    html """
      <h1>Hello World!</h1>
      """
    svg """
      <text>Hello World!</text>
      """
    css """
      :root::before { content: "Hello World!"; }
      """
    js """
      console.log("Hello World!");
      """
    sql """
      SELECT "Hello World!";
      """

    let ``variant`` =
      toHTML  """<h1>Hello World!</h1>"""
      to_html """<h1>Hello World!</h1>"""
      toSVG   """<text>Hello World!</text>"""
      to_svg  """<text>Hello World!</text>"""
      toCSS   """:root::before { content: "Hello World!"; }"""
      to_css  """:root::before { content: "Hello World!"; }"""
      toJS    """console.log("Hello World!");"""
      to_js   """console.log("Hello World!");"""
      toSQL   """SELECT "Hello World!";"""
      to_sql  """SELECT "Hello World!";"""

    let ``followed by line break WITHOUT affecting subsequent lines`` =
      html
        """<h1>Hello World!</h1>"""
      ignore """<h1>Hello World!</h1>"""
      svg
        """<text>Hello World!</text>"""
      ignore """<text>Hello World!</text>"""
      css
        """:root::before { content: "Hello World!"; }"""
      ignore """:root::before { content: "Hello World!"; }"""
      js
        """console.log("Hello World!");"""
      ignore """console.log("Hello World!");"""
      sql
        """SELECT "Hello World!";"""
      ignore """SELECT "Hello World!";"""

    let ``when embedded languages are nested`` =
      html """
        <!DOCTYPE html>
        <head>
          <title>Hello World!</title>
          <style>
            :root::before { content: "Hello World!"; }
          </style>
        </head>
        <body>
          <svg>
            <text>Hello World!</text>
          </svg>
          <script>
            console.log(await query /* sql */`
              SELECT "Hello World!";
            `);
          </script>
        </body>
        """

    endTestBindings

  let ``comment`` =
    ignore (* html *) """
      <h1>Hello World!</h1>
      """
    ignore (* svg *) """
      <text>Hello World!</text>
      """
    ignore (* css *) """
      :root::before { content: "Hello World!"; }
      """
    ignore (* js *) """
      console.log("Hello World!");
      """
    ignore (* sql *) """
      SELECT "Hello World!";
      """

    let ``variant`` =
      ignore (* HTML *) """<h1>Hello World!</h1>"""
      ignore  (*html*)  """<h1>Hello World!</h1>"""
      ignore (* SVG *)  """<text>Hello World!</text>"""
      ignore  (*svg*)   """<text>Hello World!</text>"""
      ignore (* CSS *)  """:root::before { content: "Hello World!"; }"""
      ignore  (*css*)   """:root::before { content: "Hello World!"; }"""
      ignore (* JS *)   """console.log("Hello World!");"""
      ignore  (*js*)    """console.log("Hello World!");"""
      ignore (* SQL *)  """SELECT "Hello World!";"""
      ignore  (*sql*)   """SELECT "Hello World!";"""

    let ``followed by line break WITHOUT affecting subsequent lines`` =
      ignore (* html *)
        """<h1>Hello World!</h1>"""
      ignore """<h1>Hello World!</h1>"""
      ignore (* svg *)
        """<text>Hello World!</text>"""
      ignore """<text>Hello World!</text>"""
      ignore (* css *)
        """:root::before { content: "Hello World!"; }"""
      ignore """:root::before { content: "Hello World!"; }"""
      ignore (* js *)
        """console.log("Hello World!");"""
      ignore """console.log("Hello World!");"""
      ignore (* sql *)
        """SELECT "Hello World!";"""
      ignore """SELECT "Hello World!";"""

    endTestBindings

  endTestBindings

let ``should NOT affect triple quoted string after language`` =

  let ``function followed by additional tokens`` =
    html <| """<h1>Hello World!</h1>"""
    svg  <| """<text>Hello World!</text>"""
    css  <| """:root::before { content: "Hello World!"; }"""
    js   <| """console.log("Hello World!");"""
    sql  <| """SELECT "Hello World!";"""

    let ``then line break`` =
      html <|
        """<h1>Hello World!</h1>"""
      svg <|
        """<text>Hello World!</text>"""
      css <|
        """:root::before { content: "Hello World!"; }"""
      js <|
        """console.log("Hello World!");"""
      sql <|
        """SELECT "Hello World!";"""

    endTestBindings

  let ``comment followed by additional tokens`` =
    ignore (* html *) <| """<h1>Hello World!</h1>"""
    ignore (* svg *)  <| """<text>Hello World!</text>"""
    ignore (* css *)  <| """:root::before { content: "Hello World!"; }"""
    ignore (* js *)   <| """console.log("Hello World!");"""
    ignore (* sql *)  <| """SELECT "Hello World!";"""

    let ``then line break`` =
      ignore (* html *) <|
        """<h1>Hello World!</h1>"""
      ignore (* svg *) <|
        """<text>Hello World!</text>"""
      ignore (* css *) <|
        """:root::before { content: "Hello World!"; }"""
      ignore (* js *) <|
        """console.log("Hello World!");"""
      ignore (* sql *) <|
        """SELECT "Hello World!";"""

    endTestBindings

  let ``function in line comment`` =
    // html """<h1>Hello World!</h1>"""
    // svg """<text>Hello World!</text>"""
    // css """:root::before { content: "Hello World!"; }"""
    // js """console.log("Hello World!");"""
    // sql """SELECT "Hello World!";"""

    let ``followed by line break`` =
      // html
      //   """<h1>Hello World!</h1>"""
      // svg
      //   """<text>Hello World!</text>"""
      // css
      //   """:root::before { content: "Hello World!"; }"""
      // js
      //   """console.log("Hello World!");"""
      // sql
      //   """SELECT "Hello World!";"""
      endTestBindings

    endTestBindings

  let ``comment in line comment`` =
    // ignore (* html *) """<h1>Hello World!</h1>"""
    // ignore (* svg *) """<text>Hello World!</text>"""
    // ignore (* css *) """:root::before { content: "Hello World!"; }"""
    // ignore (* js *) """console.log("Hello World!");"""
    // ignore (* sql *) """SELECT "Hello World!";"""

    let ``followed by line break`` =
      // ignore (* html *)
      //   """<h1>Hello World!</h1>"""
      // ignore (* svg *)
      //   """<text>Hello World!</text>"""
      // ignore (* css *)
      //   """:root::before { content: "Hello World!"; }"""
      // ignore (* js *)
      //   """console.log("Hello World!");"""
      // ignore (* sql *)
      //   """SELECT "Hello World!";"""
      endTestBindings

    endTestBindings

  let ``function in block comment`` =
    (*
    html """<h1>Hello World!</h1>"""
    svg """<text>Hello World!</text>"""
    css """:root::before { content: "Hello World!"; }"""
    js """console.log("Hello World!");"""
    sql """SELECT "Hello World!";"""
    *)

    let ``followed by line break`` =
      (*
      html
        """<h1>Hello World!</h1>"""
      svg
        """<text>Hello World!</text>"""
      css
        """:root::before { content: "Hello World!"; }"""
      js
        """console.log("Hello World!");"""
      sql
        """SELECT "Hello World!";"""
      *)
      endTestBindings

    endTestBindings

  let ``comment in line comment`` =
    (*
    ignore (* html *) """<h1>Hello World!</h1>"""
    ignore (* svg *) """<text>Hello World!</text>"""
    ignore (* css *) """:root::before { content: "Hello World!"; }"""
    ignore (* js *) """console.log("Hello World!");"""
    ignore (* sql *) """SELECT "Hello World!";"""
    *)

    let ``followed by line break`` =
      (*
      ignore (* html *)
        """<h1>Hello World!</h1>"""
      ignore (* svg *)
        """<text>Hello World!</text>"""
      ignore (* css *)
        """:root::before { content: "Hello World!"; }"""
      ignore (* js *)
        """console.log("Hello World!");"""
      ignore (* sql *)
        """SELECT "Hello World!";"""
      *)
      endTestBindings

    endTestBindings

  endTestBindings

let ``should highlight embedded code in interpolated string EXCEPT inside curly braces after language`` =
  let greeting = "Hello World from F#!"

  let ``function`` =
    html $"""
      <h1>{greeting}</h1>
      """
    svg $"""
      <text>{greeting}</text>
      """
    css $"""
      :root::before {{ content: "{greeting}"; }}
      """
    js $"""
      console.log("{greeting}");
      """
    sql $"""
      SELECT "{greeting};
      """

    let ``variant`` =
      toHTML  $"""<h1>{greeting}</h1>"""
      to_html $"""<h1>{greeting}</h1>"""
      toSVG   $"""<text>{greeting}</text>"""
      to_svg  $"""<text>{greeting}</text>"""
      toCSS   $""":root::before {{ content: "{greeting}"; }}"""
      to_css  $""":root::before {{ content: "{greeting}"; }}"""
      toJS    $"""console.log("{greeting}");"""
      to_js   $"""console.log("{greeting}");"""
      toSQL   $"""SELECT "{greeting};"""
      to_sql  $"""SELECT "{greeting};"""

    let ``followed by line break WITHOUT affecting subsequent lines`` =
      html
        $"""<h1>{greeting}</h1>"""
      ignore $"""<h1>{greeting}</h1>"""
      svg
        $"""<text>{greeting}</text>"""
      ignore $"""<text>{greeting}</text>"""
      css
        $""":root::before {{ content: "{greeting}"; }}"""
      ignore $""":root::before {{ content: "{greeting}"; }}"""
      js
        $"""console.log("{greeting}");"""
      ignore $"""console.log("{greeting}");"""
      sql
        $"""SELECT "{greeting}";"""
      ignore $"""SELECT "{greeting}";"""

    let ``when embedded languages are nested`` =
      html $"""
        <!DOCTYPE html>
        <head>
          <title>{greeting}</title>
          <style>
            :root::before {{ content: "{greeting}"; }}
          </style>
        </head>
        <body>
          <svg>
            <text>{greeting}</text>
          </svg>
          <script>
            console.log(await query /* sql */`
              SELECT "{greeting}";
            `);
          </script>
        </body>
        """

    endTestBindings

  let ``comment`` =
    ignore (* html *) $"""
      <h1>{greeting}</h1>
      """
    ignore (* svg *) $"""
      <text>{greeting}</text>
      """
    ignore (* css *) $"""
      :root::before {{ content: "{greeting}"; }}
      """
    ignore (* js *) $"""
      console.log("{greeting}");
      """
    ignore (* sql *) $"""
      SELECT "{greeting};
      """

    let ``variant`` =
      ignore (* HTML *) $"""<h1>{greeting}</h1>"""
      ignore  (*html*)  $"""<h1>{greeting}</h1>"""
      ignore (* SVG *)  $"""<text>{greeting}</text>"""
      ignore  (*svg*)   $"""<text>{greeting}</text>"""
      ignore (* CSS *)  $""":root::before {{ content: "{greeting}"; }}"""
      ignore  (*css*)   $""":root::before {{ content: "{greeting}"; }}"""
      ignore (* JS *)   $"""console.log("{greeting}");"""
      ignore  (*js*)    $"""console.log("{greeting}");"""
      ignore (* SQL *)  $"""SELECT "{greeting};"""
      ignore  (*sql*)   $"""SELECT "{greeting};"""

    let ``followed by line break WITHOUT affecting subsequent lines`` =
      ignore (* html *)
        $"""<h1>{greeting}</h1>"""
      ignore $"""<h1>{greeting}</h1>"""
      ignore (* svg *)
        $"""<text>{greeting}</text>"""
      ignore $"""<text>{greeting}</text>"""
      ignore (* css *)
        $""":root::before {{ content: "{greeting}"; }}"""
      ignore $""":root::before {{ content: "{greeting}"; }}"""
      ignore (* js *)
        $"""console.log("{greeting}");"""
      ignore $"""console.log("{greeting}");"""
      ignore (* sql *)
        $"""SELECT "{greeting}";"""
      ignore $"""SELECT "{greeting}";"""

    endTestBindings

  endTestBindings

let ``should NOT affect interpolated string after language`` =
  let greeting = "Hello World from F#!"

  let ``function followed by additional tokens`` =
    html <| $"""<h1>{greeting}</h1>"""
    svg  <| $"""<text>{greeting}</text>"""
    css  <| $""":root::before {{ content: "{greeting}"; }}"""
    js   <| $"""console.log("{greeting}");"""
    sql  <| $"""SELECT "{greeting}";"""

    let ``then line break`` =
      html <|
        $"""<h1>{greeting}</h1>"""
      svg <|
        $"""<text>{greeting}</text>"""
      css <|
        $""":root::before {{ content: "{greeting}"; }}"""
      js <|
        $"""console.log("{greeting}");"""
      sql <|
        $"""SELECT "{greeting}";"""

    endTestBindings

  let ``comment followed by additional tokens`` =
    ignore (* html *) <| $"""<h1>{greeting}</h1>"""
    ignore (* svg *)  <| $"""<text>{greeting}</text>"""
    ignore (* css *)  <| $""":root::before {{ content: "{greeting}"; }}"""
    ignore (* js *)   <| $"""console.log("{greeting}");"""
    ignore (* sql *)  <| $"""SELECT "{greeting}";"""

    let ``then line break`` =
      ignore (* html *) <|
        $"""<h1>{greeting}</h1>"""
      ignore (* svg *) <|
        $"""<text>{greeting}</text>"""
      ignore (* css *) <|
        $""":root::before {{ content: "{greeting}"; }}"""
      ignore (* js *) <|
        $"""console.log("{greeting}");"""
      ignore (* sql *) <|
        $"""SELECT "{greeting}";"""

    endTestBindings

  let ``function in line comment`` =
    // html $"""<h1>{greeting}</h1>"""
    // svg $"""<text>{greeting}</text>"""
    // css $""":root::before {{ content: "{greeting}"; }}"""
    // js $"""console.log("{greeting}");"""
    // sql $"""SELECT "{greeting}";"""

    let ``followed by line break`` =
      // html
      //   $"""<h1>{greeting}</h1>"""
      // svg
      //   $"""<text>{greeting}</text>"""
      // css
      //   $""":root::before {{ content: "{greeting}"; }}"""
      // js
      //   $"""console.log("{greeting}");"""
      // sql
      //   $"""SELECT "{greeting}";"""
      endTestBindings

    endTestBindings

  let ``comment in line comment`` =
    // ignore (* html *) $"""<h1>{greeting}</h1>"""
    // ignore (* svg *) $"""<text>{greeting}</text>"""
    // ignore (* css *) $""":root::before {{ content: "{greeting}"; }}"""
    // ignore (* js *) $"""console.log("{greeting}");"""
    // ignore (* sql *) $"""SELECT "{greeting}";"""

    let ``followed by line break`` =
      // ignore (* html *)
      //   $"""<h1>{greeting}</h1>"""
      // ignore (* svg *)
      //   $"""<text>{greeting}</text>"""
      // ignore (* css *)
      //   $""":root::before {{ content: "{greeting}"; }}"""
      // ignore (* js *)
      //   $"""console.log("{greeting}");"""
      // ignore (* sql *)
      //   $"""SELECT "{greeting}";"""
      endTestBindings

    endTestBindings

  let ``function in block comment`` =
    (*
    html $"""<h1>{greeting}</h1>"""
    svg $"""<text>{greeting}</text>"""
    css $""":root::before {{ content: "{greeting}"; }}"""
    js $"""console.log("{greeting}");"""
    sql $"""SELECT "{greeting}";"""
    *)

    let ``followed by line break`` =
      (*
      html
        $"""<h1>{greeting}</h1>"""
      svg
        $"""<text>{greeting}</text>"""
      css
        $""":root::before {{ content: "{greeting}"; }}"""
      js
        $"""console.log("{greeting}");"""
      sql
        $"""SELECT "{greeting}";"""
      *)
      endTestBindings

    endTestBindings

  let ``comment in line comment`` =
    (*
    ignore (* html *) $"""<h1>{greeting}</h1>"""
    ignore (* svg *) $"""<text>{greeting}</text>"""
    ignore (* css *) $""":root::before {{ content: "{greeting}"; }}"""
    ignore (* js *) $"""console.log("{greeting}");"""
    ignore (* sql *) $"""SELECT "{greeting}";"""
    *)

    let ``followed by line break`` =
      (*
      ignore (* html *)
        $"""<h1>{greeting}</h1>"""
      ignore (* svg *)
        $"""<text>{greeting}</text>"""
      ignore (* css *)
        $""":root::before {{ content: "{greeting}"; }}"""
      ignore (* js *)
        $"""console.log("{greeting}");"""
      ignore (* sql *)
        $"""SELECT "{greeting}";"""
      *)
      endTestBindings

    endTestBindings

  endTestBindings
