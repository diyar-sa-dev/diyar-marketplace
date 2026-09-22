$dir = $PSScriptRoot
$profiles = Get-ChildItem (Join-Path $dir 'summary-*.json') | Sort-Object Name | ForEach-Object {
    Get-Content $_.FullName -Raw | ConvertFrom-Json
}
@{
    project = 'diyar-kvm2-test'
    http_port = '8193'
    git_head = (git -C (Resolve-Path (Join-Path $dir '..\..\..\..')) rev-parse HEAD)
    stage_duration = '3m'
    soak_duration = '10m'
    loadtest_mode = 'false'
    octane_workers = 2
    profiles = $profiles
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
} | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $dir 'campaign.json') -Encoding utf8
Write-Host "Merged $($profiles.Count) profiles into campaign.json"
