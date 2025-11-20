[![npm version](https://badge.fury.io/js//%40kontent-ai%2Fsync-sdk.svg)](https://www.npmjs.com/package/@kontent-ai/sync-sdk)
[![Build](https://github.com/kontent-ai/sync-sdk-js/actions/workflows/build.yml/badge.svg)](https://github.com/kontent-ai/sync-sdk-js/actions/workflows/build.yml)
[![Integration Tests](https://github.com/kontent-ai/sync-sdk-js/actions/workflows/integration-tests.yml/badge.svg)](https://github.com/kontent-ai/sync-sdk-js/actions/workflows/integration-tests.yml)
[![Unit Tests](https://github.com/kontent-ai/sync-sdk-js/actions/workflows/unit-tests.yml/badge.svg)](https://github.com/kontent-ai/sync-sdk-js/actions/workflows/unit-tests.yml)
[![npm](https://img.shields.io/npm/dt/@kontent-ai/sync-sdk.svg)](https://www.npmjs.com/package/@kontent-ai/sync-sdk)
[![Known Vulnerabilities](https://snyk.io/test/github/Kontent-ai/sync-sdk-js/badge.svg)](https://snyk.io/test/github/kontent-ai/sync-sdk-js)
[![GitHub license](https://img.shields.io/github/license/Kontent-ai/sync-sdk-js.svg)](https://github.com/kontent-ai/sync-sdk-js)

# Kontent.ai Sync (v2) SDK for JavaScript

A JavaScript SDK for interacting with the [Kontent.ai Sync API v2](https://kontent.ai/learn/docs/apis/openapi/sync-api-v2). This SDK provides a type-safe way to synchronize content changes from your Kontent.ai project.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Basic Usage](#basic-usage)
    - [Initializing Synchronization](#initializing-synchronization)
    - [Synchronizing Changes](#synchronizing-changes)
  - [Using Preview API](#using-preview-api)
  - [Using Secure API](#using-secure-api)
  - [Fetching All Changes](#fetching-all-changes)
- [Using with Model Generator](#using-with-model-generator)
  - [Generating Models](#generating-models)
  - [Using Generated Models](#using-generated-models)
- [Response Structure](#response-structure)
- [Error Handling](#error-handling)
- [License](#license)

## Features

- Type-safe API for content synchronization
- Support for public, preview, and secure API modes
- Automatic handling of continuation tokens
- Configurable HTTP service and retry strategies
- Response validation capabilities

## Installation

```bash
npm install @kontent-ai/sync-sdk
```

## Configuration

The SDK uses a fluent API for client initialization, starting with the `getSyncClient` function. Here are the available configuration options:

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `environmentId` | string | Yes | The environment ID of your Kontent.ai project. Can be found under 'Project settings' in the Kontent.ai app. |
| `deliveryApiKey` | string | No | Delivery API key. Required for secure and preview modes. |
| `apiMode` | 'public' \| 'preview' \| 'secure' | Yes | Mode for the API. Secure mode requires a delivery API key with secure access. Preview mode requires a delivery API key with preview access. Delivery mode is used for public access. |
| `httpService` | HttpService | No | The HTTP service to use for the request. If not provided, the default HTTP service will be used. |
| `baseUrl` | string | No | The base URL to use for the request. If not provided, the default base URL will be used. |
| `responseValidation` | { enable: boolean } | No | Configuration for response validation. When enabled, the response payload will be validated against the expected schema. Defaults to false. |

These options can be set in the `create` function:

```typescript
const client = getSyncClient("your-environment-id")
  .publicApi()
  .create({
    baseUrl: "https://your-custom-base-url.com",
    httpService: getDefaultHttpService({
      retryStrategy: {
        maxRetries: 5,
        logRetryAttempt: false,
      },
    }),
    responseValidation: {
      enable: true,
    },
  });
```

## Usage

### Basic Usage

#### Initializing Synchronization

```typescript
import { getSyncClient } from '@kontent-ai/sync-sdk';

// Create a client with public API access
const client = getSyncClient('your-environment-id')
  .publicApi()
  .create();

// Initialize synchronization
const { success, response, error } = await client.init().toPromise();

if (!success) {
  // Handle initialization error
  console.error('Failed to initialize sync:', error.message);
  return;
}

// Get the continuation token for future sync operations
const continuationToken = response.meta.continuationToken;
```

#### Synchronizing Changes

```typescript
// Sync changes using the continuation token
const { success, response, error } = await client.sync('stored-continuation-token').toPromise();

if (!success) {
  // Handle sync error
  console.error('Failed to sync changes:', error.message);
  return;
}

// Process changes
const { items, types, languages, taxonomies } = response.payload;
// ... handle the changes
```

### Using Preview API

```typescript
const client = getSyncClient('your-environment-id')
  .previewApi('your-preview-api-key')
  .create();

// Use the client as shown in the basic example
```

### Using Secure API

```typescript
const client = getSyncClient('your-environment-id')
  .secureApi('your-secure-api-key')
  .create();

// Use the client as shown in the basic example
```

### Fetching All Changes

The SDK provides a way to fetch all changes using the `toAllPromise()` method:

```typescript
const { responses, lastContinuationToken } = await client
  .sync(continuationToken)
  .toAllPromise();

// Process all responses
for (const response of responses) {
  const { items, types, languages, taxonomies } = response.payload;
  // ... handle the changes
}
```

The `lastContinuationToken` is the continuation token from the last response in the sequence. You should store this token and use it for your next sync operations.

## Using with Model Generator

> **💡 Tip**: It is recommended to generate models using the [@kontent-ai/model-generator](https://www.npmjs.com/package/@kontent-ai/model-generator) to increase type safety and improve developer experience.

The SDK can be used in combination with the Kontent.ai Model Generator to provide strongly typed access to your content structure. This allows you to work with content types, taxonomies, and other entities using their codenames with full TypeScript support.

### Generating Models

You can generate models using the CLI:

```bash
npx @kontent-ai/model-generator@latest sync-sdk
    --environmentId=<id>
    --managementApiKey=<key>
```

Or programmatically:

```typescript
import { generateSyncModelsAsync } from '@kontent-ai/model-generator';

await generateSyncModelsAsync({
    // required
    environmentId: 'x',
    managementApiKey: 'y',
    moduleFileExtension: 'js',
    addTimestamp: false,
    createFiles: true,
    outputDir: '/', // only required when createFiles is true

    // optional
    baseUrl: undefined,
    formatOptions: { indentSize: 4, quote: 'single' }
});
```

### Using Generated Models

Once you have generated the models, you can use them with the SDK for enhanced type safety:

```typescript
import type { CoreSyncClient, CoreSyncClientTypes } from "<path-to-generated-models>";

// Notice the use of `CoreSyncClient` and `CoreSyncClientTypes`,
// By providing these types, you can strongly typed access to codenames of entities such as content types, taxonomies, etc.
const client: CoreSyncClient = getSyncClient<CoreSyncClientTypes>("your-environment-id").publicApi().create();
```

## Response Structure

The sync response contains the following data:

- `items`: Array of changed content items
- `types`: Array of changed content types
- `languages`: Array of changed languages
- `taxonomies`: Array of changed taxonomy groups

Each change includes:

- `change_type`: Either "changed" or "deleted"
- `timestamp`: When the change occurred
- `data`: The actual content data

## Error Handling

The SDK provides detailed error information when operations fail:

```typescript
const { success, error } = await client.init().toPromise();

if (!success) {
  switch (error.reason) {
    case 'validationFailed':
      // Handle validation errors when response doesn't match expected schema
      console.error('Validation error:', error.zodError);
      break;
    case 'invalidResponse':
      // Handle invalid response errors (e.g., 401 response)
      console.error('Invalid response:', error.status, error.statusText);
      break;
    case 'noResponses':
      // Handle case when no responses were received
      console.error('No responses received from:', error.url);
      break;
    case 'invalidBody':
      // Handle invalid request body errors
      console.error('Invalid request body:', error.message);
      break;
    case 'invalidUrl':
      // Handle invalid URL errors
      console.error('Invalid URL:', error.message);
      break;
    case 'notFound':
      // Handle resource not found errors
      console.error('Resource not found:', error.message);
      break;
    case 'unknown':
      // Handle unknown errors
      console.error('Unknown error:', error.message);
      break;
  }
}
```

## License

MIT
