$content = Get-Content "dist\assets\index-CKElL0rp.js" -Raw
$patterns = @("=h(", "(h(", ",h(", " h(")
foreach ($p in $patterns) {
    $idx = $content.IndexOf($p)
    if ($idx -gt 0) {
        $start = [Math]::Max(0, $idx - 80)
        $chunk = $content.Substring($start, 200)
        Write-Host "Found '$p' at position $idx"
        Write-Host $chunk
        Write-Host "---"
    }
}
