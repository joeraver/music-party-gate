<#
.SYNOPSIS
  Deploys Music Party Gate to AWS S3 & CloudFront via CloudFormation.

.DESCRIPTION
  1. Compiles the React + Vite static client (client/dist)
  2. Deploys or updates the CloudFormation stack (Private S3 bucket + CloudFront OAC)
  3. Syncs static build assets to the S3 bucket
  4. Invalidates the CloudFront edge cache so changes are live immediately

.EXAMPLE
  .\deploy\deploy-s3-cloudfront.ps1
  .\deploy\deploy-s3-cloudfront.ps1 -DomainName "party.raverendo.com" -AcmCertificateArn "arn:aws:acm:us-east-1:..."
#>

[CmdletBinding()]
param(
  [string]$StackName = "music-party-gate",
  [string]$Region = "us-east-1",
  [string]$DomainName = "",
  [string]$AcmCertificateArn = ""
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host "  Music Party Gate -> AWS S3 + CloudFront Deployment" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Magenta

# 1. Verify AWS CLI
Write-Host "`n[1/5] Verifying AWS CLI credentials..." -ForegroundColor Yellow
try {
  $caller = aws sts get-caller-identity --output json | ConvertFrom-Json
  Write-Host "  Authenticated as AWS Account: $($caller.Account)" -ForegroundColor Green
  Write-Host "  IAM Principal: $($caller.Arn)" -ForegroundColor Green
} catch {
  Write-Host "  ERROR: AWS CLI is not configured or authenticated." -ForegroundColor Red
  Write-Host "  Please run 'aws configure' or check your AWS SSO login." -ForegroundColor Red
  exit 1
}

# 2. Build the client application
Write-Host "`n[2/5] Building static client application..." -ForegroundColor Yellow
$rootDir = Split-Path -Parent $PSScriptRoot
$clientDir = Join-Path $rootDir "client"

Push-Location $clientDir
try {
  npm run build
  if ($LASTEXITCODE -ne 0) {
    throw "npm build exited with code $LASTEXITCODE"
  }
} finally {
  Pop-Location
}

$distDir = Join-Path $clientDir "dist"
if (-not (Test-Path (Join-Path $distDir "index.html"))) {
  Write-Host "  ERROR: Build output index.html not found in $distDir" -ForegroundColor Red
  exit 1
}
Write-Host "  Build successful! Output ready in $distDir" -ForegroundColor Green

# 3. Deploy CloudFormation Stack
Write-Host "`n[3/5] Deploying CloudFormation infrastructure ($StackName in $Region)..." -ForegroundColor Yellow
$templateFile = Join-Path $PSScriptRoot "cloudfront-s3.yaml"

$params = @(
  "DomainName=$DomainName",
  "AcmCertificateArn=$AcmCertificateArn"
)

aws cloudformation deploy `
  --template-file $templateFile `
  --stack-name $StackName `
  --region $Region `
  --parameter-overrides $params `
  --no-fail-on-empty-changeset

if ($LASTEXITCODE -ne 0) {
  Write-Host "  ERROR: CloudFormation deployment failed." -ForegroundColor Red
  exit 1
}

# Retrieve Stack Outputs
Write-Host "  Fetching stack outputs..." -ForegroundColor Gray
$outputs = aws cloudformation describe-stacks `
  --stack-name $StackName `
  --region $Region `
  --query "Stacks[0].Outputs" `
  --output json | ConvertFrom-Json

$bucketName = ($outputs | Where-Object { $_.OutputKey -eq "S3BucketName" }).OutputValue
$distId = ($outputs | Where-Object { $_.OutputKey -eq "CloudFrontDistributionId" }).OutputValue
$websiteUrl = ($outputs | Where-Object { $_.OutputKey -eq "WebsiteUrl" }).OutputValue
$cfDomain = ($outputs | Where-Object { $_.OutputKey -eq "CloudFrontDomainName" }).OutputValue

Write-Host "  S3 Bucket:     $bucketName" -ForegroundColor Cyan
Write-Host "  CloudFront ID: $distId" -ForegroundColor Cyan
Write-Host "  Domain:        $cfDomain" -ForegroundColor Cyan

# 4. Sync build assets to S3
Write-Host "`n[4/5] Syncing build assets to s3://$bucketName..." -ForegroundColor Yellow
aws s3 sync $distDir "s3://$bucketName" --delete

if ($LASTEXITCODE -ne 0) {
  Write-Host "  ERROR: Failed to sync assets to S3." -ForegroundColor Red
  exit 1
}
Write-Host "  S3 sync completed successfully!" -ForegroundColor Green

# 5. Invalidate CloudFront Cache
Write-Host "`n[5/5] Invalidating CloudFront edge cache (/*)..." -ForegroundColor Yellow
$invalidation = aws cloudfront create-invalidation `
  --distribution-id $distId `
  --paths "/*" `
  --output json | ConvertFrom-Json

Write-Host "  Invalidation started: $($invalidation.Invalidation.Id)" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT SUCCESSFUL! 🎉" -ForegroundColor Green
Write-Host "  Website URL: $websiteUrl" -ForegroundColor Cyan
if ($DomainName -and -not $AcmCertificateArn) {
  Write-Host "  Note: CloudFront default certificate is active on https://$cfDomain" -ForegroundColor Yellow
}
Write-Host "==========================================================" -ForegroundColor Green
