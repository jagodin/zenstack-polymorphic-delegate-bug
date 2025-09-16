# ZenStack Polymorphic Relationship Bug Reproduction

This repository demonstrates a bug in ZenStack when using polymorphic relationships with `@@delegate` and trying to query nested relations with `where` clauses.

## The Bug

When using polymorphic relationships with `@@delegate`, ZenStack transforms field access patterns, making it impossible to use `where` clauses on delegated fields in nested queries.

## Schema Structure

```zmodel
// Base model for all media types
model Media {
  id Int @id @default(autoincrement())
  title String
  mediaType String

  @@delegate(mediaType)
  @@allow('all', true)
}

// Specific media type extending the base model
model Movie extends Media {
  director Director @relation(fields: [directorId], references: [id])
  directorId Int
  duration Int
  rating String
}

model Director {
  id Int @id @default(autoincrement())
  name String
  email String
  movies Movie[]

  @@allow('all', true)
}
```

## The Problem

### ✅ What Works

```typescript
// Querying Director with nested movies works fine
const directorResult = await prisma.director.findMany({
    include: {
        movies: {
            orderBy: {
                title: 'asc',
            },
        },
    },
});
```

### ❌ What Fails

```typescript
// Querying Director with movies where clause fails
const bugQuery = await prisma.director.findMany({
    include: {
        movies: {
            where: {
                title: 'Inception',
            },
        },
    },
});
```

## Error Message

```
Unknown argument `title`. Available options are marked with ?.
```

## Root Cause

The issue occurs because:

1. ZenStack transforms field access patterns for polymorphic relationships
2. Fields become accessible through `delegate_aux_*` patterns instead of direct access
3. Relations that exist on polymorphic models (Movie) are not accessible when querying with `where` clauses
4. The error shows that ZenStack is looking for `delegate_aux_media` but doesn't recognize the `title` field in `where` clauses

## Expected Behavior

When querying a polymorphic base model, users should be able to:

1. Access relations that exist on the polymorphic models
2. Query nested fields through those relations
3. Have ZenStack automatically handle the delegation to the appropriate polymorphic model

## Reproduction Steps

1. Clone this repository
2. Run `npm install`
3. Run `npx zenstack generate`
4. Run `npx prisma migrate dev --name init`
5. Run `npx tsx src/index.ts`

The test will demonstrate both working and failing query patterns.

## Workaround

Currently, there's no clean workaround. Users must:

1. Query the specific polymorphic models directly (Movie) instead of using `where` clauses
2. Use separate queries for each polymorphic type
3. Avoid using `@@delegate` if they need to query with `where` clauses on delegated fields

## Related Issues

This bug affects any use case where:

-   You have polymorphic relationships with `@@delegate`
-   You need to query nested relations from the base model
-   You want to include related data in a single query

## Environment

-   ZenStack: 2.18.1
-   Prisma: 6.14.x
-   Node.js: v20.18.3
-   Database: SQLite
