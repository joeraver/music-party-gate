#!/usr/bin/env bash
# ==============================================================================
# Deploy Music Party Gate to AWS S3 + CloudFront (Bash)
# ==============================================================================
set -euo pipefail

STACK_NAME="${1:-music-party-gate}"
REGION="${2:-us-east-1}"
DOMAIN_NAME="${3:-}"
ACM_CERT_ARN="${4:-}"

echo "=========================================================="
echo "  Music Party Gate -> AWS S3 + CloudFront Deployment"
echo "=========================================================="

# 1. Verify AWS CLI
echo -e "\n[1/5] Verifying AWS CLI credentials..."
aws sts get-caller-identity --output table

# 2. Build the client application
echo -e "\n[2/5] Building static client application..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLIENT_DIR="$ROOT_DIR/client"

cd "$CLIENT_DIR"
npm run build
cd "$ROOT_DIR"

DIST_DIR="$CLIENT_DIR/dist"
if [[ ! -f "$DIST_DIR/index.html" ]]; then
  echo "ERROR: Build output index.html not found in $DIST_DIR" >&2
  exit 1
fi
echo "Build successful! Output ready in $DIST_DIR"

# 3. Deploy CloudFormation Stack
echo -e "\n[3/5] Deploying CloudFormation infrastructure ($STACK_NAME in $REGION)..."
TEMPLATE_FILE="$SCRIPT_DIR/cloudfront-s3.yaml"

aws cloudformation deploy \
  --template-file "$TEMPLATE_FILE" \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --parameter-overrides \
    DomainName="$DOMAIN_NAME" \
    AcmCertificateArn="$ACM_CERT_ARN" \
  --no-fail-on-empty-changeset

echo "Fetching stack outputs..."
OUTPUTS=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs" \
  --output json)

BUCKET_NAME=$(echo "$OUTPUTS" | grep -A 2 '"OutputKey": "S3BucketName"' | grep '"OutputValue"' | cut -d '"' -f 4)
DIST_ID=$(echo "$OUTPUTS" | grep -A 2 '"OutputKey": "CloudFrontDistributionId"' | grep '"OutputValue"' | cut -d '"' -f 4)
WEBSITE_URL=$(echo "$OUTPUTS" | grep -A 2 '"OutputKey": "WebsiteUrl"' | grep '"OutputValue"' | cut -d '"' -f 4)

echo "S3 Bucket:     $BUCKET_NAME"
echo "CloudFront ID: $DIST_ID"
echo "Website URL:   $WEBSITE_URL"

# 4. Sync build assets to S3
echo -e "\n[4/5] Syncing build assets to s3://$BUCKET_NAME..."
aws s3 sync "$DIST_DIR" "s3://$BUCKET_NAME" --delete

# 5. Invalidate CloudFront Cache
echo -e "\n[5/5] Invalidating CloudFront edge cache (/*)..."
aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "/*" \
  --output table

echo -e "\n=========================================================="
echo "  DEPLOYMENT SUCCESSFUL! 🎉"
echo "  Website URL: $WEBSITE_URL"
echo "=========================================================="
