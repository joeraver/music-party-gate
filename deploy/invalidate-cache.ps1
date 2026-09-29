<#
.SYNOPSIS
  Purges the CloudFront edge cache for Music Party Gate.

.EXAMPLE
  .\deploy\invalidate-cache.ps1
  .\deploy\invalidate-cache.ps1 -Paths "/index.html"
#>

[CmdletBinding()]
param(
  [string]$StackName = "music-party-gate",
  [string]$Region = "us-east-1",
  [string]$Paths = "/*"
)

$ErrorActionPreference = "Stop"

Write-Host "Fetching CloudFront distribution ID from stack '$StackName'..." -ForegroundColor Cyan
$distId = aws cloudformation describe-stacks `
  --stack-name $StackName `
  --region $Region `
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" `
  --output text

if (-not $distId -or $distId -eq "None") {
  Write-Host "ERROR: Could not retrieve CloudFrontDistributionId from stack $StackName." -ForegroundColor Red
  exit 1
}

Write-Host "Triggering invalidation for distribution $distId (paths: $Paths)..." -ForegroundColor Yellow
$result = aws cloudfront create-invalidation `
  --distribution-id $distId `
  --paths $Paths `
  --output json | ConvertFrom-Json

Write-Host "Cache invalidation started! Invalidation ID: $($result.Invalidation.Id)" -ForegroundColor Green
