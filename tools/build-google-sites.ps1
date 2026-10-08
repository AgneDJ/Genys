param(
    [string]$Root = (Split-Path -Parent $PSScriptRoot),
    [string]$Suffix = ".google-sites",
    [string]$OutputDirectory = ""
)

$ErrorActionPreference = 'Stop'
$rootPath = [System.IO.Path]::GetFullPath($Root)
if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = Join-Path $rootPath 'google-sites'
}
$outputRoot = [System.IO.Path]::GetFullPath($OutputDirectory)
if (-not $outputRoot.StartsWith($rootPath.TrimEnd('\') + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Output directory must be inside the project root: $rootPath"
}
[System.IO.Directory]::CreateDirectory($outputRoot) | Out-Null

function Is-RemoteReference([string]$value) {
    return $value -match '^(?:[a-z][a-z0-9+.-]*:|//|#|data:|mailto:|tel:|javascript:)' 
}

function Get-RelativeWebPath([string]$fromDirectory, [string]$toPath) {
    $from = [System.Uri]::new(([System.IO.Path]::GetFullPath($fromDirectory).TrimEnd('\') + '\'))
    $to = [System.Uri]::new([System.IO.Path]::GetFullPath($toPath))
    return [System.Uri]::UnescapeDataString($from.MakeRelativeUri($to).ToString())
}

function Resolve-LocalReference([string]$documentPath, [string]$reference) {
    $clean = ($reference -split '[?#]', 2)[0]
    if ($clean.StartsWith('/')) {
        return Join-Path $rootPath $clean.TrimStart('/')
    }
    return Join-Path (Split-Path -Parent $documentPath) $clean
}

function Get-DataUri([string]$path) {
    $extension = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
    if ($extension -in @('.png', '.jpg', '.jpeg') -and (Get-Item -LiteralPath $path).Length -gt 150KB) {
        Add-Type -AssemblyName System.Drawing
        $image = [System.Drawing.Image]::FromFile($path)
        try {
            # Photo-like images are substantially smaller as JPEG. Preserve genuinely transparent artwork.
            $hasTransparency = $false
            if ($image.PixelFormat.ToString().Contains('Argb')) {
                $bitmap = [System.Drawing.Bitmap]$image
                $stepX = [Math]::Max(1, [int]($bitmap.Width / 120))
                $stepY = [Math]::Max(1, [int]($bitmap.Height / 120))
                for ($y = 0; $y -lt $bitmap.Height -and -not $hasTransparency; $y += $stepY) {
                    for ($x = 0; $x -lt $bitmap.Width; $x += $stepX) {
                        if ($bitmap.GetPixel($x, $y).A -lt 255) { $hasTransparency = $true; break }
                    }
                }
            }
            if (-not $hasTransparency) {
                $stream = [System.IO.MemoryStream]::new()
                try {
                    $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
                        Where-Object MimeType -eq 'image/jpeg' | Select-Object -First 1
                    $parameters = [System.Drawing.Imaging.EncoderParameters]::new(1)
                    $parameters.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new(
                        [System.Drawing.Imaging.Encoder]::Quality, [long]84
                    )
                    $image.Save($stream, $encoder, $parameters)
                    return 'data:image/jpeg;base64,' + [Convert]::ToBase64String($stream.ToArray())
                }
                finally { $stream.Dispose() }
            }
        }
        finally { $image.Dispose() }
    }
    $mime = switch ($extension) {
        '.png'  { 'image/png' }
        '.jpg'  { 'image/jpeg' }
        '.jpeg' { 'image/jpeg' }
        '.gif'  { 'image/gif' }
        '.webp' { 'image/webp' }
        '.svg'  { 'image/svg+xml' }
        '.woff' { 'font/woff' }
        '.woff2'{ 'font/woff2' }
        default { 'application/octet-stream' }
    }
    return "data:$mime;base64," + [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($path))
}

function Rewrite-JsonLinks($value) {
    if ($null -eq $value) { return $null }
    if ($value -is [string]) {
        if ($value -match '^(?![a-z][a-z0-9+.-]*:|//|#)(?<path>.*)\.html(?<tail>[?#].*)?$' -and -not $value.Contains("$Suffix.html")) {
            return $Matches['path'] + "$Suffix.html" + $Matches['tail']
        }
        return $value
    }
    if ($value -is [System.Collections.IDictionary]) {
        $copy = [ordered]@{}
        foreach ($key in $value.Keys) { $copy[$key] = Rewrite-JsonLinks $value[$key] }
        return $copy
    }
    if ($value -is [System.Collections.IEnumerable] -and $value -isnot [string]) {
        return @($value | ForEach-Object { Rewrite-JsonLinks $_ })
    }
    if ($value -is [pscustomobject]) {
        $copy = [ordered]@{}
        foreach ($property in $value.PSObject.Properties) { $copy[$property.Name] = Rewrite-JsonLinks $property.Value }
        return $copy
    }
    return $value
}

function Rebase-CssUrls([string]$css, [string]$cssPath, [string]$htmlPath) {
    $cssDirectory = Split-Path -Parent $cssPath
    $htmlDirectory = Split-Path -Parent $htmlPath
    return [regex]::Replace($css, 'url\(\s*(["'']?)(?<url>[^)"'']+)\1\s*\)', {
        param($match)
        $url = $match.Groups['url'].Value.Trim()
        if (Is-RemoteReference $url) { return $match.Value }

        $parts = [regex]::Match($url, '^(?<path>[^?#]*)(?<tail>[?#].*)?$')
        $absolute = Join-Path $cssDirectory $parts.Groups['path'].Value
        $relative = Get-RelativeWebPath $htmlDirectory $absolute
        return 'url("' + $relative + $parts.Groups['tail'].Value + '")'
    }, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
}

function Convert-HtmlFile([System.IO.FileInfo]$file) {
    $sourcePath = $file.FullName
    $relativeSource = [System.IO.Path]::GetRelativePath($rootPath, $sourcePath)
    $relativeDirectory = Split-Path -Parent $relativeSource
    $targetDirectory = if ([string]::IsNullOrEmpty($relativeDirectory)) {
        $outputRoot
    } else {
        Join-Path $outputRoot $relativeDirectory
    }
    [System.IO.Directory]::CreateDirectory($targetDirectory) | Out-Null
    $outputPath = Join-Path $targetDirectory ($file.BaseName + $Suffix + $file.Extension)
    $html = [System.IO.File]::ReadAllText($sourcePath)

    # Inline local stylesheets and preserve media attributes.
    $html = [regex]::Replace($html, '<link\b(?<attrs>[^>]*\brel\s*=\s*["'']?stylesheet["'']?[^>]*)>', {
        param($match)
        $attrs = $match.Groups['attrs'].Value
        $hrefMatch = [regex]::Match($attrs, '\bhref\s*=\s*(["''])(?<href>.*?)\1|\bhref\s*=\s*(?<href>[^\s>]+)', 'IgnoreCase')
        if (-not $hrefMatch.Success -or (Is-RemoteReference $hrefMatch.Groups['href'].Value)) { return $match.Value }

        $cssPath = Resolve-LocalReference $sourcePath $hrefMatch.Groups['href'].Value
        if (-not (Test-Path -LiteralPath $cssPath -PathType Leaf)) {
            Write-Warning "Stylesheet not found: $cssPath (referenced by $sourcePath)"
            return $match.Value
        }

        $mediaMatch = [regex]::Match($attrs, '\bmedia\s*=\s*(["''])(?<media>.*?)\1', 'IgnoreCase')
        $media = if ($mediaMatch.Success) { ' media="' + $mediaMatch.Groups['media'].Value + '"' } else { '' }
        $css = [System.IO.File]::ReadAllText($cssPath)
        $css = Rebase-CssUrls $css $cssPath $sourcePath
        return "<style$media>`n/* Inlined from $(Get-RelativeWebPath $file.DirectoryName $cssPath) */`n$css`n</style>"
    }, 'IgnoreCase')

    # Inline local scripts. External scripts remain external.
    $html = [regex]::Replace($html, '<script\b(?<attrs>[^>]*\bsrc\s*=\s*(?:["''][^"'']+["'']|[^\s>]+)[^>]*)>\s*</script>', {
        param($match)
        $attrs = $match.Groups['attrs'].Value
        $srcMatch = [regex]::Match($attrs, '\bsrc\s*=\s*(["''])(?<src>.*?)\1|\bsrc\s*=\s*(?<src>[^\s>]+)', 'IgnoreCase')
        if (-not $srcMatch.Success -or (Is-RemoteReference $srcMatch.Groups['src'].Value)) { return $match.Value }

        $scriptPath = Resolve-LocalReference $sourcePath $srcMatch.Groups['src'].Value
        if (-not (Test-Path -LiteralPath $scriptPath -PathType Leaf)) {
            Write-Warning "Script not found: $scriptPath (referenced by $sourcePath)"
            return $match.Value
        }

        $keptAttrs = [regex]::Replace($attrs, '\s*\bsrc\s*=\s*(?:["''][^"'']*["'']|[^\s>]+)', '', 'IgnoreCase')
        $keptAttrs = [regex]::Replace($keptAttrs, '\s*\b(?:integrity|crossorigin)\s*=\s*(?:["''][^"'']*["'']|[^\s>]+)', '', 'IgnoreCase')
        $js = [System.IO.File]::ReadAllText($scriptPath) -replace '</script', '<\/script'
        # Inlined scripts have no currentScript.src. Preserve scripts that derive the site root from it.
        $rootRelative = [System.IO.Path]::GetRelativePath($file.DirectoryName, $rootPath).Replace('\', '/')
        if ($rootRelative -eq '.') { $rootRelative = './' } else { $rootRelative = $rootRelative.TrimEnd('/') + '/' }
        $rootExpression = "new URL('$rootRelative', document.baseURI).href"
        $js = [regex]::Replace(
            $js,
            'new URL\(\s*(["''])\.\./\1\s*,\s*document\.currentScript\.src\s*\)\.href',
            $rootExpression
        )
        return "<script$keptAttrs>`n/* Inlined from $(Get-RelativeWebPath $file.DirectoryName $scriptPath) */`n$js`n</script>"
    }, 'IgnoreCase')

    # Point links between local HTML pages at their converted equivalents.
    $html = [regex]::Replace($html, '(?<prefix>\bhref\s*=\s*["''])(?<url>[^"'']+\.html)(?<tail>[?#][^"'']*)?(?<quote>["''])', {
        param($match)
        $url = $match.Groups['url'].Value
        if (Is-RemoteReference $url -or $url.EndsWith("$Suffix.html")) { return $match.Value }
        return $match.Groups['prefix'].Value + $url.Substring(0, $url.Length - 5) + "$Suffix.html" + $match.Groups['tail'].Value + $match.Groups['quote'].Value
    }, 'IgnoreCase')

    # Rewrite local HTML paths stored in JavaScript string literals.
    $html = [regex]::Replace($html, '(?<quote>["''])(?<url>(?![a-z][a-z0-9+.-]*:|//|#)[^"'']+?)\.html(?<tail>[?#][^"'']*)?\k<quote>', {
        param($match)
        $url = $match.Groups['url'].Value
        if ($url.EndsWith($Suffix)) { return $match.Value }
        return $match.Groups['quote'].Value + $url + "$Suffix.html" + $match.Groups['tail'].Value + $match.Groups['quote'].Value
    }, 'IgnoreCase')

    # Directory links need an explicit index file inside a pasted/hosted embed.
    $html = [regex]::Replace($html, '(?<prefix>\bhref\s*=\s*["''])(?<url>(?![a-z][a-z0-9+.-]*:|//|#)[^"'']*/)(?<tail>[?#][^"'']*)?(?<quote>["''])', {
        param($match)
        return $match.Groups['prefix'].Value + $match.Groups['url'].Value + "index$Suffix.html" + $match.Groups['tail'].Value + $match.Groups['quote'].Value
    }, 'IgnoreCase')

    # Embed JSON files used by fetch(), with a tiny fetch-compatible adapter.
    $jsonFiles = [ordered]@{}
    foreach ($fetchMatch in [regex]::Matches($html, 'fetch\(\s*(["''])(?<url>[^"'']+\.json)\1', 'IgnoreCase')) {
        $jsonUrl = $fetchMatch.Groups['url'].Value
        if (Is-RemoteReference $jsonUrl) { continue }
        $jsonPath = Resolve-LocalReference $sourcePath $jsonUrl
        if (Test-Path -LiteralPath $jsonPath -PathType Leaf) {
            $parsed = [System.IO.File]::ReadAllText($jsonPath) | ConvertFrom-Json
            $jsonFiles[$jsonUrl] = Rewrite-JsonLinks $parsed
        }
    }
    if ($jsonFiles.Count -gt 0) {
        $json = $jsonFiles | ConvertTo-Json -Depth 100 -Compress
        $json = $json -replace '</script', '<\/script'
        $adapter = @"
<script>
/* Local JSON embedded for Google Sites. */
(() => {
  const embeddedFiles = $json;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const key = typeof input === 'string' ? input : input.url;
    if (Object.prototype.hasOwnProperty.call(embeddedFiles, key)) {
      const value = embeddedFiles[key];
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => JSON.parse(JSON.stringify(value)),
        text: async () => JSON.stringify(value)
      });
    }
    return originalFetch(input, init);
  };
})();
</script>
"@
        $html = [regex]::Replace($html, '</head>', ($adapter + '</head>'), 'IgnoreCase')
    }

    # Embed each local image/font once, then resolve compact markers at runtime.
    $assetUris = [ordered]@{}
    $assetKeys = @{}
    $getAssetKey = {
        param([string]$url)
        $assetPath = [System.IO.Path]::GetFullPath((Resolve-LocalReference $sourcePath $url))
        if (-not (Test-Path -LiteralPath $assetPath -PathType Leaf)) { return $null }
        if (-not $assetKeys.ContainsKey($assetPath)) {
            $key = [string]$assetKeys.Count
            $assetKeys[$assetPath] = $key
            $assetUris[$key] = Get-DataUri $assetPath
        }
        return $assetKeys[$assetPath]
    }

    $html = [regex]::Replace($html, 'url\(\s*(["'']?)(?<url>(?![a-z][a-z0-9+.-]*:|//|#|data:)[^)"'']+\.(?:png|jpe?g|gif|webp|svg|woff2?))(?<tail>[?#][^)"'']*)?\1\s*\)', {
        param($match)
        $key = & $getAssetKey $match.Groups['url'].Value
        if ($null -eq $key) { return $match.Value }
        return "var(--gs-asset-$key)"
    }, 'IgnoreCase')

    $html = [regex]::Replace($html, '(?<quote>["''])(?<url>(?![a-z][a-z0-9+.-]*:|//|#|data:)[^"''<>]+\.(?:png|jpe?g|gif|webp|svg|woff2?))(?<tail>[?#][^"'']*)?\k<quote>', {
        param($match)
        $key = & $getAssetKey $match.Groups['url'].Value
        if ($null -eq $key) { return $match.Value }
        return $match.Groups['quote'].Value + "gs-asset:$key" + $match.Groups['quote'].Value
    }, 'IgnoreCase')

    if ($assetUris.Count -gt 0) {
        $assetJson = ($assetUris | ConvertTo-Json -Compress) -replace '</script', '<\/script'
        $assetLoader = @'
<script>
/* Local images and fonts embedded once for Google Sites. */
(() => {
  const embeddedAssets = __ASSET_JSON__;
  const expand = value => value && value.replace(/gs-asset:(\d+)/g, (_, key) => embeddedAssets[key]);
  for (const [key, value] of Object.entries(embeddedAssets)) {
    document.documentElement.style.setProperty(`--gs-asset-${key}`, `url("${value}")`);
  }
  const fix = root => {
    const nodes = [];
    if (root.nodeType === 1) nodes.push(root);
    if (root.querySelectorAll) nodes.push(...root.querySelectorAll('[src],[poster],[srcset],[style]'));
    for (const node of nodes) {
      for (const name of ['src', 'poster', 'srcset', 'style']) {
        if (node.hasAttribute && node.hasAttribute(name)) {
          const oldValue = node.getAttribute(name);
          const newValue = expand(oldValue);
          if (newValue !== oldValue) node.setAttribute(name, newValue);
        }
      }
    }
  };
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') fix(record.target);
      for (const node of record.addedNodes || []) fix(node);
    }
  }).observe(document.documentElement, {subtree: true, childList: true, attributes: true, attributeFilter: ['src','poster','srcset','style']});
  document.addEventListener('DOMContentLoaded', () => fix(document));
})();
</script>
'@
        $assetLoader = $assetLoader.Replace('__ASSET_JSON__', $assetJson)
        $html = [regex]::Replace($html, '</head>', ($assetLoader + '</head>'), 'IgnoreCase')
    }

    [System.IO.File]::WriteAllText($outputPath, $html, [System.Text.UTF8Encoding]::new($false))
    return $outputPath
}

$files = Get-ChildItem -LiteralPath $rootPath -Recurse -File -Filter '*.html' |
    Where-Object {
        -not $_.FullName.StartsWith($outputRoot.TrimEnd('\') + '\', [System.StringComparison]::OrdinalIgnoreCase) -and
        $_.BaseName -notlike "*$Suffix" -and
        $_.FullName -notmatch '[\\/]tools[\\/]source-cache[\\/]' -and
        $_.FullName -notmatch '[\\/]\.codex[\\/]' -and
        $_.FullName -notmatch '[\\/]google-apps-script[\\/]'
    }

$outputs = foreach ($file in $files) { Convert-HtmlFile $file }
Write-Host "Created $($outputs.Count) Google Sites HTML files:"
$outputs | ForEach-Object { Write-Host ('  ' + (Get-RelativeWebPath $rootPath $_)) }
