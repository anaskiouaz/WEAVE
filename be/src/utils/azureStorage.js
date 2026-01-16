// src/utils/azureStorage.js
import { StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';

// Azure Storage configuration for SAS generation
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'images';
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

let sharedKeyCredential;

if (connectionString) {
  // Extract account name and key from connection string
  const connStrParts = connectionString.split(';');
  const accountNamePart = connStrParts.find(part => part.startsWith('AccountName='));
  const accountKeyPart = connStrParts.find(part => part.startsWith('AccountKey='));
  if (accountNamePart && accountKeyPart) {
    const extractedAccountName = accountNamePart.split('=')[1];
    const extractedAccountKey = accountKeyPart.split('=')[1];
    sharedKeyCredential = new StorageSharedKeyCredential(extractedAccountName, extractedAccountKey);
    console.log('✅ Azure Storage credentials loaded from connection string');
  } else {
    console.warn('❌ Could not extract account name/key from connection string');
  }
} else if (accountName && accountKey) {
  sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  console.log('✅ Azure Storage credentials loaded from separate env vars');
} else {
  console.warn('❌ Azure Storage credentials not set, SAS generation will fail');
}

// Function to generate SAS token for blob access
export function generateBlobSASUrl(blobName) {
  if (!sharedKeyCredential) {
    console.warn('Storage credentials not available for SAS generation');
    return null;
  }

  try {
    const sasOptions = {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'), // Read permission
      startsOn: new Date(),
      expiresOn: new Date(new Date().valueOf() + 24 * 60 * 60 * 1000), // 24 hours
    };

    const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
    return `https://${sharedKeyCredential.accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
  } catch (error) {
    console.error('Error generating SAS token:', error);
    return null;
  }
}