$content = Get-Content "dist\assets\index-CKElL0rp.js" -Raw
$lines = $content -split "`n"
Write-Host "Total lines: $($lines.Count)"
if ($lines.Count -ge 406) {
    $line = $lines[405]
    Write-Host "Line 406 length: $($line.Length)"
    if ($line.Length -ge 17026) {
        $start = [Math]::Max(0, 17026 - 100)
        $chunk = $line.Substring($start, 250)
        Write-Host "Around position 17026 on line 406:"
        Write-Host $chunk
    }
} else {
    Write-Host "File has fewer than 406 lines. Searching all content for jsx/createElement patterns..."
    # Search for h( used as JSX - typically preceded by return or assignment
    $patterns = @("return h(", "jsx:h", "jsxs:h", ":h(")
    foreach ($p in $patterns) {
        $idx = $content.IndexOf($p)
        if ($idx -gt 0) {
            $start = [Math]::Max(0, $idx - 60)
            $chunk = $content.Substring($start, 200)
            Write-Host "Found '$p' at position $idx"
            Write-Host $chunk
            Write-Host "---"
        }
    }
}
