import { enhance, PrismaClient } from '@zenstackhq/runtime';
import { PrismaClient as PrismaClientOriginal } from '@prisma/client';
import { PrismaClientValidationError } from '@prisma/client/runtime/library';

const prisma: PrismaClient = enhance(
    new PrismaClientOriginal({
        datasources: {
            db: {
                url: 'file:./dev.db',
            },
        },
    })
);

(async () => {
    await prisma.media.deleteMany();
    await prisma.director.deleteMany();

    const director = await prisma.director.create({
        data: {
            name: 'Christopher Nolan',
            email: 'nolan@example.com',
        },
    });

    await prisma.movie.create({
        data: {
            title: 'Inception',
            directorId: director.id,
            duration: 148,
            rating: 'PG-13',
        },
    });

    console.log('=== Testing Polymorphic Relationship Bug ===\n');

    // This should work - querying Director with nested movies
    try {
        console.log('1. Testing Director query with nested movies (WORKS):');
        const directorResult = await prisma.director.findMany({
            include: {
                movies: {
                    orderBy: {
                        title: 'asc',
                    },
                },
            },
        });
        console.log(
            '✅ Director query result:',
            JSON.stringify(directorResult, null, 2)
        );

        // Verify the query worked as expected
        if (!directorResult.length || !directorResult[0].movies.length) {
            throw new Error(
                'Expected Director query to return results with movies'
            );
        }
        console.log(
            '✅ Test 1 PASSED: Director query with orderBy works correctly'
        );
    } catch (error) {
        console.error('❌ Director query error:', error);
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        throw new Error(
            `Test 1 FAILED: Director query should work but failed - ${errorMessage}`
        );
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // This should demonstrate the actual bug - querying Director with movies where clause
    try {
        console.log(
            '2. Testing Director query with movies where clause (FAILS):'
        );
        const bugQuery = await prisma.director.findMany({
            include: {
                movies: {
                    where: {
                        title: 'Inception',
                    },
                },
            },
        });
        console.log('✅ Bug query result:', JSON.stringify(bugQuery, null, 2));

        // If we get here, the bug is NOT reproducing - this should have failed!
        throw new Error(
            'BUG NOT REPRODUCED: Director query with where clause should have failed but succeeded'
        );
    } catch (error) {
        if (
            error instanceof PrismaClientValidationError &&
            error instanceof Error &&
            error.message.includes('Unknown argument')
        ) {
            console.error('❌ Bug query error:', error);
            console.log(
                '✅ Test 2 PASSED: Bug reproduced correctly - PrismaClientValidationError with "Unknown argument" as expected'
            );
        } else if (
            error instanceof Error &&
            error.message.includes('BUG NOT REPRODUCED')
        ) {
            throw error; // Re-throw our custom error
        } else {
            console.error('❌ Bug query error:', error);
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            const errorName =
                error instanceof Error ? error.constructor.name : typeof error;
            throw new Error(
                `Test 2 FAILED: Expected PrismaClientValidationError with "Unknown argument" but got ${errorName}: ${errorMessage}`
            );
        }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Additional verification - test that we can catch the specific error type
    try {
        console.log('3. Testing error type detection (VERIFICATION):');
        await prisma.director.findMany({
            include: {
                movies: {
                    where: {
                        title: 'Non-existent Movie',
                    },
                },
            },
        });
        throw new Error(
            'VERIFICATION FAILED: Expected PrismaClientValidationError'
        );
    } catch (error) {
        if (error instanceof PrismaClientValidationError) {
            console.log(
                '✅ Test 3 PASSED: Correctly identified PrismaClientValidationError'
            );
        } else {
            const errorName =
                error instanceof Error ? error.constructor.name : typeof error;
            throw new Error(
                `VERIFICATION FAILED: Expected PrismaClientValidationError but got ${errorName}`
            );
        }
    }

    console.log('\n' + '='.repeat(50) + '\n');
    console.log('🎉 ALL TESTS PASSED: Bug reproduction is working correctly!');
    console.log('Bug Summary:');
    console.log(
        '- Polymorphic relationships with @@delegate work for simple queries'
    );
    console.log('- Nested field queries fail with "Unknown argument" errors');
    console.log(
        '- The error occurs because ZenStack transforms field access patterns'
    );
    console.log(
        '- Fields become accessible through delegate_aux_* patterns instead'
    );
})();
