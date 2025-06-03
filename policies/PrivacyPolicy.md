# Privacy Policy for OpenLeaf

**Effective Date:** [6/2/2025]  
**Last Updated:** [6/2/2025]

## Introduction

OpenLeaf is a personal finance desktop application that helps you manage your financial accounts and transactions. This Privacy Policy explains how we handle your information.

**Key Point: All your data is stored locally on your computer. We do not store any of your data on external servers.**

## Information We Collect

### Financial Data
- **Bank Account Information**: Account names, types, balances, and masked account numbers
- **Transaction Data**: Transaction amounts, dates, merchant names, and payment channels
- **Plaid Integration Data**: Encrypted access tokens for connecting to your financial institutions

### User Data
- **Account Information**: Your chosen username/nickname and encrypted master password
- **Application Preferences**: Settings and preferences you configure in the app

## How We Collect Information

- **Direct Input**: Information you provide when setting up the application
- **Plaid Service**: We use Plaid (a secure financial data service) to connect to your bank accounts
- **Your Interactions**: Preferences and settings you configure while using the app

## How We Use Your Information

We use your information to:
- Display your financial accounts and transaction history
- Provide personal finance management features
- Maintain your application preferences and settings
- Securely connect to your financial institutions through Plaid

## Data Storage and Security

### Local Storage Only
- **All data is stored on your device** in a local SQLite database
- **No external servers**: We do not store any of your data on our servers or in the cloud
- **Complete control**: You have full control over your data at all times

### Encryption Protection
- **Master Password**: Hashed using bcrypt encryption (never stored in plain text)
- **Financial Data**: All sensitive information encrypted using AES-256-GCM encryption
- **Plaid Credentials**: API keys and access tokens encrypted with your master password
- **Unique Protection**: Each piece of data has its own unique encryption salt and key

### Database Location
- Stored in your system's standard user data directory
- Only accessible by your user account
- No automatic cloud backup (you control all backups)

## Third-Party Services

### Plaid Integration
- **Purpose**: Plaid securely connects OpenLeaf to your bank accounts
- **Data Sharing**: We share your bank credentials with Plaid to access your account data
- **Plaid's Policy**: Plaid has their own privacy policy governing their data handling
- **Data Minimization**: We only request transaction data and basic account information

### No Other Sharing
- We do not sell, rent, or share your information with anyone else
- We do not use your data for advertising or marketing
- We cannot access your data since it's stored only on your device

## Your Rights and Control

### Complete Data Control
- **View and Edit**: Access all your stored data through the application
- **Delete Data**: Remove individual accounts, transactions, or your entire profile
- **Export Data**: Access your data directly from the SQLite database file
- **Data Portability**: Your data is stored in standard formats for easy access

### Account Management
- Change your master password at any time
- Disconnect bank accounts and remove their data
- Delete your entire user profile and all associated data

## Data Retention

- Data stays on your device until you choose to delete it
- Uninstalling the application removes all stored data
- We do not keep copies of your data anywhere else
- You can remove individual accounts or transactions at any time

## User Responsibilities

### Password Security
- Keep your master password secure and confidential
- Use a strong, unique password
- Consider using a password manager

### Device Security
- Protect your device with appropriate security measures
- Keep your operating system updated
- Ensure physical security of your device

### Data Backup
- You are responsible for backing up your data if desired
- Encrypt any backup files you create
- Test your backups periodically

## Updates to This Policy

We may update this Privacy Policy occasionally. When we do:
- We'll update the "Last Updated" date
- For significant changes, we'll provide notice in the application
- You can always find the current version in the application or on our GitHub repository

## Contact Information

- **General Questions**: https://github.com/NickAwrist/openleaf/issues
- **Privacy Concerns**: https://github.com/NickAwrist/openleaf/issues

---

**Remember**: Since all your data is stored locally on your device, you maintain complete control over your information at all times. We cannot access your data, and it never leaves your device except when communicating directly with Plaid to retrieve your financial information. 