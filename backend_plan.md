# Backend Integration Plan

## 1. Accounts Feature
We need a way to manage multiple trading accounts (Live, Prop, Demo).

### Server Actions (`src/app/actions/accounts.ts`)
-   `createAccount(name, type, balance)`: Inserts a new row into `Account` table.
-   `getAccounts()`: Fetches all accounts for the selector.

### UI Components
-   `AddAccountModal`: A dialog with a form to input account details.
-   `AccountSelector`: A dropdown in the header to switch context.

## 2. Trades Feature
We need to replace mock data with real DB queries.

### Server Actions (`src/app/actions/trades.ts`)
-   `logTrade(data)`: Inserts a new trade linked to the selected account.
-   `getDashboardData(accountId)`: Fetches P&L, Win Rate, and recent trades.

### Updates
-   `Dashboard`: Make it async and fetch data on the server side.
