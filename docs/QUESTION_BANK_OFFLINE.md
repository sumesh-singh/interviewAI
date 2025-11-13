# Question Bank Offline Support

## Overview

The Question Bank feature includes comprehensive offline support, allowing users to create, edit, and manage question banks even when internet connectivity is unavailable. Changes are automatically queued and synchronized when the connection is restored.

## How It Works

### Offline Detection

The application automatically detects when the user goes offline using the browser's `navigator.onLine` API. When offline:
- All create, update, and delete operations are queued locally
- Users receive toast notifications indicating that changes will be synced later
- The UI remains fully functional

### Pending Changes Queue

Offline changes are stored in `localStorage` under the key `pending-question-bank-changes`. Each change includes:
- **id**: Unique identifier for the change
- **type**: Operation type (`create`, `update`, `delete`)
- **timestamp**: When the change was made
- **data**: The data associated with the change
- **bankId**: Question bank ID (for updates/deletes)
- **questionId**: Question ID (for question-level operations)

### Automatic Sync

When the application detects that connectivity has been restored:
1. The `syncPendingChanges()` function is automatically triggered
2. All pending changes are processed in order
3. Successfully synced changes are removed from the queue
4. Users receive a notification when sync is complete

## Testing Offline Mode

### Manual Testing Steps

1. **Go Offline**:
   - Open the Questions page (`/dashboard/questions`)
   - Open Chrome DevTools (F12)
   - Go to the Network tab
   - Check "Offline" in the throttling dropdown

2. **Create a Question Bank**:
   - Click "Create Question Bank"
   - Fill in the form with name and description
   - Click "Create"
   - You should see a toast: "Offline - Question bank will be created when you're back online"

3. **Edit Questions**:
   - Try adding, editing, or deleting questions
   - Each operation should show an offline notification
   - Changes should appear to work locally

4. **Go Online**:
   - Uncheck "Offline" in Chrome DevTools
   - The app should automatically sync all pending changes
   - You should see a toast: "Synced - All offline changes have been synced"
   - Refresh the page to verify changes were saved to Supabase

### Automated Testing Scenarios

```typescript
// Test offline create
it('should queue question bank creation when offline', async () => {
  // Mock navigator.onLine = false
  Object.defineProperty(navigator, 'onLine', { value: false })
  
  await createQuestionBank({ name: 'Test Bank', description: 'Test' })
  
  const pendingChanges = localStorage.getItem('pending-question-bank-changes')
  expect(pendingChanges).toBeTruthy()
  expect(JSON.parse(pendingChanges)).toHaveLength(1)
})

// Test sync on reconnect
it('should sync pending changes when coming online', async () => {
  // Setup offline changes
  localStorage.setItem('pending-question-bank-changes', JSON.stringify([
    { id: '1', type: 'create', timestamp: new Date(), data: { name: 'Test' } }
  ]))
  
  // Simulate coming online
  Object.defineProperty(navigator, 'onLine', { value: true })
  window.dispatchEvent(new Event('online'))
  
  // Wait for sync
  await waitFor(() => {
    const pendingChanges = localStorage.getItem('pending-question-bank-changes')
    expect(pendingChanges).toBeFalsy()
  })
})
```

## Limitations

1. **Conflict Resolution**: If the same resource is modified on multiple devices while offline, the last sync wins (no automatic conflict resolution)

2. **Large Imports**: Bulk imports via CSV/JSON require an online connection

3. **Question Bank Selection**: When starting an interview with a custom question bank, an online connection is required to fetch questions

## Best Practices

1. **Sync Regularly**: Encourage users to sync changes when connectivity is available
2. **Clear Feedback**: Always show clear toast notifications for offline operations
3. **Data Validation**: Validate data before queuing to avoid sync errors later
4. **Error Handling**: Handle sync errors gracefully and provide retry options

## Troubleshooting

### Changes Not Syncing

1. Check browser console for errors
2. Verify `pending-question-bank-changes` in localStorage
3. Manually trigger sync by going offline and back online
4. Clear localStorage and try again if corrupted

### Duplicate Operations

If you see duplicate question banks or questions after sync:
1. This indicates the pending changes were not properly cleared
2. Manually delete duplicates
3. Clear `pending-question-bank-changes` from localStorage
4. Report the issue with browser console logs
