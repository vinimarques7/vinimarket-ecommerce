#!/bin/bash
# Gera certificados TLS auto-assinados para o Vini Market
set -e

CERT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$CERT_DIR"

if [ -f "$CERT_DIR/cert.pem" ] && [ -f "$CERT_DIR/key.pem" ]; then
    echo "Certificados já existem em $CERT_DIR — pulando geração."
    exit 0
fi

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERT_DIR/key.pem" \
    -out    "$CERT_DIR/cert.pem" \
    -subj   "/CN=localhost/O=ViniMarket/C=BR" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" \
    2>/dev/null

echo "✓ Certificados TLS gerados em $CERT_DIR"
echo "  - cert.pem  (certificado público)"
echo "  - key.pem   (chave privada)"
