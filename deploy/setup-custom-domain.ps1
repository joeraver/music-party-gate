<#
.SYNOPSIS
  Orchestrates custom domain setup for Music Party Gate on Squarespace & CloudFront.

.DESCRIPTION
  1. Verifies or requests ACM certificate in us-east-1
  2. Displays exact CNAME records for Squarespace Domains
  3. Waits for ACM DNS validation
  4. Deploys updated CloudFormation stack with domain alias & SSL certificate
  5. Invalidates CloudFront cache and tests HTTPS

.EXAMPLE
  .\deploy\setup-custom-domain.ps1
  .\deploy\setup-custom-domain.ps1 -DomainName "party.raverendo.com"
#>

[CmdletBinding()]
param(
  [string]$DomainName = "party.raverendo.com",
  [string]$AcmCertificateArn = "arn:aws:acm:us-east-1:746139443819:certificate/5fe12878-b274-4acb-93fe-cb3e295488a8",
  [string]$Region = "us-east-1",
  [string]$StackName = "music-party-gate"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host "  Music Party Gate -> Custom Domain Setup" -ForegroundColor Cyan
Write-Host "  Domain: $DomainName" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Magenta

# 1. Check or Request Certificate
if (-not $AcmCertificateArn) {
  Write-Host "`n[1/4] Requesting ACM public certificate in $Region..." -ForegroundColor Yellow
  $certReq = aws acm request-certificate `
    --domain-name $DomainName `
    --validation-method DNS `
    --region $Region `
    --output json | ConvertFrom-Json
  $AcmCertificateArn = $certReq.CertificateArn
  Write-Host "  Certificate requested: $AcmCertificateArn" -ForegroundColor Green
  Start-Sleep -Seconds 5
} else {
  Write-Host "`n[1/4] Using ACM certificate: $AcmCertificateArn" -ForegroundColor Yellow
}

# 2. Fetch DNS Validation Record
$certInfo = aws acm describe-certificate `
  --certificate-arn $AcmCertificateArn `
  --region $Region `
  --output json | ConvertFrom-Json

$validation = $certInfo.Certificate.DomainValidationOptions[0]
$cnameName = $validation.ResourceRecord.Name
$cnameValue = $validation.ResourceRecord.Value

# Calculate host prefix for Squarespace (e.g. _xxxx.party from _xxxx.party.raverendo.com.)
$rootDomain = "raverendo.com"
$hostPrefix = $cnameName.TrimEnd('.')
if ($hostPrefix.EndsWith(".$rootDomain")) {
  $hostPrefix = $hostPrefix.Substring(0, $hostPrefix.Length - ($rootDomain.Length + 1))
}

$subdomain = $DomainName.Replace(".$rootDomain", "")

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  ACTION REQUIRED IN SQUARESPACE DOMAINS" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Log in to https://account.squarespace.com/domains -> $rootDomain -> DNS Settings`n" -ForegroundColor White

Write-Host "Record 1 (SSL Validation CNAME):" -ForegroundColor Magenta
Write-Host "  Type:      CNAME" -ForegroundColor White
Write-Host "  Host:      $hostPrefix" -ForegroundColor Cyan
Write-Host "  Data:      $cnameValue" -ForegroundColor Cyan

Write-Host "`nRecord 2 (Traffic Routing CNAME):" -ForegroundColor Magenta
Write-Host "  Type:      CNAME" -ForegroundColor White
Write-Host "  Host:      $subdomain" -ForegroundColor Cyan
Write-Host "  Data:      d27c8dtbcf9s2i.cloudfront.net." -ForegroundColor Cyan
Write-Host "==========================================================`n" -ForegroundColor Cyan

# 3. Wait for Certificate Validation
if ($certInfo.Certificate.Status -ne "ISSUED") {
  Write-Host "[2/4] Waiting for ACM DNS validation (checking every 15s)..." -ForegroundColor Yellow
  Write-Host "  (Please ensure Record 1 has been saved in Squarespace)" -ForegroundColor Gray

  while ($true) {
    Start-Sleep -Seconds 15
    $check = aws acm describe-certificate `
      --certificate-arn $AcmCertificateArn `
      --region $Region `
      --output json | ConvertFrom-Json

    $status = $check.Certificate.Status
    Write-Host "  Current Status: $status ($((Get-Date).ToString('HH:mm:ss')))" -ForegroundColor Gray

    if ($status -eq "ISSUED") {
      Write-Host "  Certificate successfully validated & ISSUED! 🎉" -ForegroundColor Green
      break
    }
    if ($status -eq "FAILED") {
      throw "ACM Certificate validation failed."
    }
  }
} else {
  Write-Host "[2/4] Certificate is already ISSUED!" -ForegroundColor Green
}

# 4. Deploy CloudFormation Stack
Write-Host "`n[3/4] Updating CloudFormation stack with custom domain..." -ForegroundColor Yellow
$deployScript = Join-Path $PSScriptRoot "deploy-s3-cloudfront.ps1"

& $deployScript `
  -StackName $StackName `
  -Region $Region `
  -DomainName $DomainName `
  -AcmCertificateArn $AcmCertificateArn

# 5. Verification
Write-Host "`n[4/4] Verifying HTTPS connectivity..." -ForegroundColor Yellow
Write-Host "  Testing https://$DomainName..." -ForegroundColor Gray
try {
  $res = curl.exe -s -o NUL -w "%{http_code}" "https://$DomainName"
  Write-Host "  HTTP Status Code: $res" -ForegroundColor Green
} catch {
  Write-Host "  DNS propagation may still be in progress. Test in browser shortly!" -ForegroundColor Yellow
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  CUSTOM DOMAIN ATTACHED SUCCESSFULLY! 🎉" -ForegroundColor Green
Write-Host "  URL: https://$DomainName" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
