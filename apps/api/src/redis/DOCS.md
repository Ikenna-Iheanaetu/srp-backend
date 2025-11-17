# Redis Architecture Documentation

## What is Redis?

Redis (Remote Dictionary Server) is an **in-memory data store** used as a database, cache, and message broker. Think of it like a super-fast database that lives in your computer's RAM instead of on disk.

**Why is it fast?**
- RAM access: ~0.1 microseconds
- Disk access: ~10 milliseconds
- **Redis is 100,000x faster than traditional databases!**

## Why We Use Redis

### Problem Without Redis
```
User sends message → Check MongoDB (50-100ms) → Validate → Send message
100 users = 100 MongoDB queries = 5-10 seconds delay!
```

### Solution With Redis
```
User sends message → Check Redis (1-3ms) → Validate → Send message
100 users = 100 Redis queries = 0.1-0.3 seconds delay!
```

**Benefits:**
- ⚡ **Speed**: 30-100x faster than MongoDB
- 📊 **Reduced Database Load**: Less queries to MongoDB
- 🔄 **Real-time Performance**: Perfect for chat/messaging
- 💾 **Temporary Storage**: Cache data that changes frequently

## Redis in Our Application

We use Redis for **3 main purposes**:

### 1. **Caching** (Store frequently accessed data)
### 2. **Session Management** (Track who's online)
### 3. **Job Queuing** (Message batching with Bull)

## Redis Data Structures

Redis supports different types of data storage. Here's what we use:

### 1. STRING (Simple Key-Value)

**What it is:** Like a dictionary - one key points to one value.

```typescript
// Store a simple value
await redis.set('user:123:name', 'John Doe')

// Get the value
const name = await redis.get('user:123:name') // "John Doe"
```

**What we use it for:**
- `chat:{id}` - Store chat metadata as JSON string
- `presence:{userId}` - Store user's socket ID
- `deleted:{userId}:{chatId}:at` - Store deletion timestamp
- `unread:{userId}:{chatId}` - Store unread count as number

**Example:**
```typescript
// Cache chat metadata
await redis.set(
  'chat:abc123',
  JSON.stringify({
    id: 'abc123',
    status: 'ACCEPTED',
    participants: ['user1', 'user2']
  }),
  86400 // Expires in 24 hours
)
```

### 2. SET (Unordered Collection of Unique Items)

**What it is:** Like a bag of unique items - no duplicates allowed.

```typescript
// Add items to a set
await redis.sadd('deleted:user123', 'conv1', 'conv2', 'conv3')

// Get all items
const deleted = await redis.smembers('deleted:user123')
// ['conv1', 'conv2', 'conv3']

// Remove an item
await redis.srem('deleted:user123', 'conv1')
```

**What we use it for:**
- `deleted:{userId}` - Track which chats user has deleted

**Why use SET instead of STRING?**
- ✅ Automatically prevents duplicates
- ✅ Fast membership check: O(1) - instant!
- ✅ Easy add/remove operations

**Example:**
```typescript
// User deletes chat
await redis.sadd('deleted:user123', 'conv-abc')

// Check if deleted (super fast!)
const deletedConvs = await redis.smembers('deleted:user123')
const isDeleted = deletedConvs.includes('conv-abc') // true
```

### 3. SORTED SET (Ordered Collection by Score)

**What it is:** Like a leaderboard - items sorted by a numeric score.

```typescript
// Add items with scores (timestamp as score)
await redis.zadd('messages:conv123', 1696334400000, '{"id":"msg1","content":"Hello"}')
await redis.zadd('messages:conv123', 1696334500000, '{"id":"msg2","content":"Hi"}')

// Get items in reverse order (newest first)
const messages = await redis.zrevrange('messages:conv123', 0, 9) // Get 10 latest
```

**What we use it for:**
- `messages:{chatId}` - Cache recent messages sorted by timestamp

**Why use SORTED SET for messages?**
- ✅ Automatically sorted by timestamp
- ✅ Get latest messages instantly
- ✅ Easy pagination (get messages 10-20, etc.)
- ✅ Auto-cleanup old messages (keep only last 100 per chat)

**Example:**
```typescript
// Cache new message
const timestamp = Date.now()
await redis.zadd(
  'messages:conv123',
  timestamp,
  JSON.stringify({ id: 'msg123', content: 'Hello', createdAt: timestamp })
)

// Keep only last 100 messages (remove old ones)
await redis.zremrangebyrank('messages:conv123', 0, -101)

// Get 10 latest messages
const latest = await redis.zrevrange('messages:conv123', 0, 9)
```

### 4. HASH (Like a JavaScript Object)

**What it is:** Store multiple key-value pairs under one key.

```typescript
// Store user data
await redis.hset('user:123', {
  name: 'John',
  email: 'john@example.com',
  age: '30'
})

// Get specific field
const name = await redis.hget('user:123', 'name') // "John"
```

**Note:** We don't currently use HASHes, but they're useful for storing objects with many fields.

## Caching Patterns in Conversations Module

### Pattern 1: Conversation Metadata Cache

**Flow:**
```
1. User requests conversation
   ↓
2. Check Redis cache
   ├─ Found? → Return cached data (1-3ms) ✅
   └─ Not found? → Query MongoDB (50-100ms)
      ↓
3. Store result in Redis for 24 hours
   ↓
4. Return data
```

**Code:**
```typescript
// Try cache first
let conversation = await cache.getCachedConversation(conversationId)

if (!conversation) {
  // Cache miss - query database
  const dbConversation = await prisma.conversation.findUnique(...)

  // Store in cache for next time
  conversation = {
    id: dbConversation.id,
    status: dbConversation.status,
    // ... other fields
  }
  await cache.cacheConversation(conversation) // 24hr TTL
}

// Use conversation (from cache or DB)
```

### Pattern 2: User Presence Tracking

**Flow:**
```
User connects to WebSocket
   ↓
Store: presence:{userId} = socketId (TTL: 5 minutes)
   ↓
Auto-expires after 5 minutes of inactivity
   ↓
User appears offline
```

**Why 5 minutes TTL?**
- If connection drops, user auto-logs out after 5 min
- Prevents "ghost online" status
- Heartbeat refreshes TTL every minute

**Code:**
```typescript
// User connects
await cache.setUserOnline(userId, socketId)
// Stores: presence:user123 = "socket-xyz-123" (expires in 5 min)

// Check if online
const isOnline = await cache.isUserOnline(userId)
// Checks if presence:user123 exists

// User disconnects
await cache.setUserOffline(userId)
// Deletes: presence:user123
```

### Pattern 3: Unread Count Tracking

**Flow:**
```
Message sent to offline/away user
   ↓
Increment: unread:{recipientId}:{conversationId}
   ↓
User reads messages
   ↓
Reset: unread:{recipientId}:{conversationId} to 0
```

**Why no TTL?**
- Unread counts must persist until user reads
- User might be offline for days
- Gets reset manually when messages are read

**Code:**
```typescript
// Increment unread count
await cache.incrementUnreadCount(userId, conversationId)
// unread:user123:conv-abc goes from 5 → 6

// Get all unread counts for user
const counts = await cache.getAllUnreadCounts(userId)
// {
//   'conv-abc': 6,
//   'conv-xyz': 2
// }

// User reads messages - reset to 0
await cache.resetUnreadCount(userId, conversationId)
// Deletes: unread:user123:conv-abc
```

### Pattern 4: Deletion Tracking

**Flow:**
```
User deletes conversation
   ↓
1. Add to SET: deleted:{userId} → conversationId
2. Store timestamp: deleted:{userId}:{conversationId}:at → "2025-10-03T12:00:00Z"
   ↓
Get conversations → Filter out deleted ones
   ↓
Get messages → Only show messages after deletion timestamp
```

**Code:**
```typescript
// User deletes conversation
const deletedAt = new Date().toISOString()
await cache.markAsDeleted(userId, conversationId, deletedAt)
// 1. Adds conv-abc to SET: deleted:user123
// 2. Stores: deleted:user123:conv-abc:at = "2025-10-03T12:00:00Z"

// Check if deleted (O(1) - instant!)
const deletedConvs = await cache.getDeletedConversations(userId)
// ['conv-abc', 'conv-xyz']

// Get deletion timestamp for message filtering
const deletedAt = await cache.getDeletedAt(userId, conversationId)
// "2025-10-03T12:00:00Z"

// Filter messages: only show messages AFTER this time
const messages = await prisma.message.findMany({
  where: {
    conversationId,
    createdAt: { gt: new Date(deletedAt) } // Only after deletion
  }
})
```

## TTL (Time To Live) Strategy

TTL determines when cached data expires. Here's our strategy:

| Cache Type | TTL | Why? |
|-----------|-----|------|
| **Conversation metadata** | 24 hours | Changes rarely (status, participants) |
| **Messages cache** | 2 hours | Messages frequently updated, keep recent only |
| **User presence** | 5 minutes | Auto-logout inactive users |
| **Unread count** | No expiry | Must persist until user reads |
| **Deletion tracking** | No expiry | Must persist until restore |
| **Rate limit** | 10 seconds | Rate limit window duration |

**Memory Management:**
- Redis evicts oldest data when memory is full (LRU policy)
- We keep only last 100 messages per conversation in sorted sets
- Expired keys are auto-deleted by Redis

## Performance Comparison

### Scenario: 100 Users Sending Messages

**Without Redis (Direct MongoDB):**
```
100 validation queries × 50ms = 5 seconds
❌ Slow, database overload
```

**With Redis Cache:**
```
100 validation queries × 1ms = 0.1 seconds
✅ 50x faster, database happy
```

### Scenario: Check Unread Count for 50 Conversations

**Without Redis:**
```
50 MongoDB count queries × 50ms = 2.5 seconds
❌ Very slow
```

**With Redis:**
```
1 Redis MGET query × 2ms = 2ms
✅ 1250x faster!
```

## Common Operations

### Store Data
```typescript
// String with TTL
await redis.set('key', 'value', 3600) // Expires in 1 hour

// Set (unique items)
await redis.sadd('my-set', 'item1', 'item2')

// Sorted Set with score
await redis.zadd('leaderboard', 100, 'player1')
```

### Retrieve Data
```typescript
// Get string
const value = await redis.get('key')

// Get set members
const items = await redis.smembers('my-set')

// Get sorted set (reverse order)
const top10 = await redis.zrevrange('leaderboard', 0, 9)
```

### Delete Data
```typescript
// Delete key
await redis.del('key')

// Remove from set
await redis.srem('my-set', 'item1')

// Remove from sorted set
await redis.zrem('leaderboard', 'player1')
```

### Check Existence
```typescript
// Check if key exists
const exists = await redis.exists('key') // true/false

// Check set membership (after getting members)
const members = await redis.smembers('my-set')
const isMember = members.includes('item1')
```

## Redis in Production

### Connection Pooling
Our Redis client automatically manages connections:
- Retry on failure (max 3 attempts)
- Reconnect on disconnect
- Connection timeout: 2 seconds

### Error Handling
```typescript
try {
  await redis.get('key')
} catch (error) {
  // Log error, fallback to database
  console.error('Redis error:', error)
}
```

### Monitoring
Check Redis health:
```typescript
const response = await redis.ping() // Returns "PONG" if healthy
```

## Debugging Tips

### View Redis Data
```bash
# Connect to Redis CLI
redis-cli

# List all keys
KEYS *

# Get a value
GET conversation:abc123

# Get set members
SMEMBERS deleted:user123

# Get sorted set
ZREVRANGE messages:conv123 0 -1 WITHSCORES
```

### Common Issues

**Issue: Cache always misses**
- Check if TTL expired
- Verify key format matches exactly
- Check Redis connection

**Issue: Memory growing**
- Check if TTLs are set correctly
- Verify old messages are being cleaned up
- Monitor with `redis-cli INFO memory`

**Issue: Stale data**
- Lower TTL for frequently changing data
- Manually invalidate cache on updates

## Summary

**Redis is our speed layer:**
- 🚀 100x faster than database queries
- 💾 Stores temporary/frequently accessed data
- 🔄 Perfect for real-time features like messaging
- 📊 Reduces database load dramatically

**Key Concepts:**
- **STRING**: Simple key-value (conversation cache, timestamps)
- **SET**: Unique items (deleted conversations)
- **SORTED SET**: Ordered items (messages by timestamp)
- **TTL**: Auto-expiry (24hr for conversations, 5min for presence)
- **No TTL**: Persistent data (unread counts, deletions)

**Remember:**
- Redis is RAM-based = super fast but volatile
- Use for cache, not primary storage
- Always have MongoDB as source of truth
- Redis enhances performance, MongoDB ensures reliability
