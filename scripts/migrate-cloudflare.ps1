[CmdletBinding()]
param([switch]$DeployPreview)

$ErrorActionPreference = 'Stop'
$migrationRepo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$migrationPreviousLocation = Get-Location

function Invoke-MigrationCommand {
    param([string]$Command, [string[]]$Arguments)
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command failed with exit code $LASTEXITCODE." }
}

try {
    Set-Location -LiteralPath $migrationRepo
    $migrationBranch = git branch --show-current
    if ($LASTEXITCODE -ne 0 -or -not $migrationBranch -or $migrationBranch -in @('main', 'master')) {
        throw 'Run this from a migration branch, not main/master or a detached checkout.'
    }
    $migrationMainBefore = git rev-parse refs/heads/main
    if ($LASTEXITCODE -ne 0) { throw 'Cannot verify the local main branch.' }
    $migrationNpm = (Get-Command npm.cmd -ErrorAction Stop).Source
    Invoke-MigrationCommand $migrationNpm @('ci')
    Invoke-MigrationCommand $migrationNpm @('run', 'verify:cloudflare')

    if ($DeployPreview) {
        Write-Host 'Deploying only pk-paints-renovations-preview on workers.dev. No custom domain is configured.'
        Invoke-MigrationCommand $migrationNpm @('exec', '--', 'wrangler', 'deploy', '--env', 'preview')
    } else {
        Write-Host 'Validation finished. No site was published. Add -DeployPreview after Cloudflare login to publish a preview.'
    }

    $migrationMainAfter = git rev-parse refs/heads/main
    if ($LASTEXITCODE -ne 0 -or $migrationMainAfter -ne $migrationMainBefore) {
        throw 'The main branch changed during this run; inspect before continuing.'
    }
    Write-Host 'main is unchanged. DNS, Vercel, and domain registration were not modified.'
} finally {
    Set-Location -LiteralPath $migrationPreviousLocation.Path
}
