# Security Policy for OpenLeaf

**Effective Date:** 6/2/2025  
**Last Updated:** 6/2/2025  
**Version:** 1.0

## Overview

OpenLeaf is a personal finance desktop application that securely connects to your bank accounts through Plaid. This policy outlines the security measures implemented to protect your financial data.

## Security Architecture

OpenLeaf is built with security-first principles:
- **Local-Only Storage**: All data is stored on your device, never on external servers
- **Encryption by Default**: All sensitive data is encrypted before storage
- **Minimal Network Access**: Only connects to Plaid API via secure HTTPS

## Data Protection

### Encryption Standards
- **Algorithm**: AES-256-GCM encryption for all sensitive data
- **Key Derivation**: PBKDF2 with SHA-512 and 100,000 iterations
- **Password Hashing**: bcrypt with 10 salt rounds
- **Unique Encryption**: Each piece of data has unique salt and initialization vector

### What Gets Encrypted
- Plaid API credentials (client ID and secret)
- Bank account access tokens
- All financial data before database storage
- Master password (hashed, never stored in plaintext)

## Data Storage

### Local Database
- **Engine**: SQLite database stored on your device
- **Location**: Your system's user data directory
- **Access**: Only accessible to your user account
- **No Cloud Storage**: Data never leaves your device except to communicate with Plaid

### Data Types Stored
- User account information (nickname, hashed password)
- Bank account details (names, types, balances, masked account numbers)
- Transaction history (amounts, dates, merchants, payment channels)
- Encrypted Plaid access tokens

## Network Security

### External Communications
- **Plaid API Only**: Application only connects to Plaid's secure API
- **HTTPS/TLS**: All communications encrypted in transit
- **No Inbound Connections**: Application doesn't listen on any network ports
- **Certificate Validation**: Full SSL certificate verification

## Access Control

### Authentication
- **Master Password**: Required to access the application
- **Session Management**: 30-day session expiration
- **Data Access**: All user data accessible only after authentication

## Application Security

### Code Security
- **Input Validation**: All user inputs are validated and sanitized
- **SQL Injection Prevention**: Parameterized database queries only
- **Memory Management**: Secure handling of sensitive data in memory
- **Error Handling**: No sensitive information exposed in error messages

### Dependencies
- **Minimal Dependencies**: Only essential libraries included
- **Regular Updates**: Dependencies updated for security patches
- **Trusted Sources**: All dependencies from verified npm packages

## User Responsibilities

### Password Security
- Use a strong, unique master password
- Keep your master password secure and confidential
- Consider using a password manager

### Device Security
- Keep your operating system updated
- Use appropriate device security (screen locks, etc.)
- Secure physical access to your device

### Data Backup
- You are responsible for backing up your data
- Encrypt any backup files you create
- Test backup restoration periodically

## Incident Response

### Reporting Security Issues
- **Security Vulnerabilities**: Report via GitHub Security Advisories
- **General Issues**: Use GitHub Issues
- **Response Time**: Best effort within 5 business days

### Issue Classification
- **Critical**: Authentication bypass, data corruption
- **High**: Data exposure, application crashes
- **Medium**: Minor security improvements
- **Low**: Documentation or usability issues

## Third-Party Integration

### Plaid Security
- Plaid credentials encrypted and stored locally only
- Only necessary financial data requested (transactions and account info)
- Plaid's own security policies apply to their data handling
- Regular review of Plaid security updates

## Compliance

This application follows security best practices including:
- NIST cybersecurity guidelines
- OWASP secure coding practices
- Financial data protection standards

## Contact Information

- **General Support**: https://github.com/NickAwrist/openleaf/issues
- **Bug Reports**: https://github.com/NickAwrist/openleaf/issues

---

**Note**: While we implement strong security measures, no system is completely immune to threats. Users should follow good security practices and keep their systems updated.
