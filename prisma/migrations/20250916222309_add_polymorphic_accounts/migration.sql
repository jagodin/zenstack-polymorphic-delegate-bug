/*
  Warnings:

  - You are about to drop the column `name` on the `PlaidAccount` table. All the data in the column will be lost.
  - Added the required column `plaidAccountId` to the `PlaidAccount` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "accountType" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ManualAccount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    CONSTRAINT "ManualAccount_id_fkey" FOREIGN KEY ("id") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlaidAccount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "plaidItemId" INTEGER NOT NULL,
    "plaidAccountId" TEXT NOT NULL,
    CONSTRAINT "PlaidAccount_plaidItemId_fkey" FOREIGN KEY ("plaidItemId") REFERENCES "PlaidItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlaidAccount_id_fkey" FOREIGN KEY ("id") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PlaidAccount" ("id", "plaidItemId") SELECT "id", "plaidItemId" FROM "PlaidAccount";
DROP TABLE "PlaidAccount";
ALTER TABLE "new_PlaidAccount" RENAME TO "PlaidAccount";
CREATE UNIQUE INDEX "PlaidAccount_plaidAccountId_key" ON "PlaidAccount"("plaidAccountId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
