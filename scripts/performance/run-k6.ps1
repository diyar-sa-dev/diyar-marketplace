param(
    [ValidateSet('baseline', '100', '500', '1000', '5000', '10000', '25000', 'rps10', 'rps25', 'rps50', 'rps75', 'rps100', 'rps150', 'rps200', 'rps278', 'soak15', 'spike')]
    [string]$Profile = 'rps10'
)

$ErrorActionPreference = 'Stop'
$composeFile = 'docker-compose.loadtest.yml'
$healthUrl = 'http://localhost:8000/api/v1/health'

Write-Host "DIYAR k6 profile: $Profile"
Write-Host "BASE_URL: http://api:8000/api/v1 (compose network)"
Write-Host "Ensure stack is running: docker compose -f $composeFile up --build"

Write-Host "Waiting for API health at $healthUrl ..."
$ready = $false
for ($i = 0; $i - 60; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $ready = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if (-not $ready) {
    throw "API not healthy at $healthUrl - start docker compose loadtest stack first."
}

docker compose -f $composeFile --profile k6 run --rm `
    -e "RPS_PROFILE=$Profile" `
    k6
