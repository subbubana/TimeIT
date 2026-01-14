# TimeSheet Pro - Automated Timesheet Processing

A Next.js application for automating timesheet collection, invoice generation, and payroll processing for consultancies.

## Features

- **Dashboard** - Overview of pending timesheets, invoices, and payroll
- **Employee Management** - Track employees and their client assignments with bill/pay rates
- **Client Management** - Manage client organizations
- **Timesheet Processing** - Review, approve, or reject timesheets
- **Invoice Generation** - Automatically generate invoices on timesheet approval
- **Payroll Calculation** - Automatic payroll calculation with tax deductions
- **Gmail Integration** - Monitor email for incoming timesheet attachments
- **Gemini AI** - Parse timesheet documents using Google's Gemini AI

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Google Gemini 1.5 Flash
- **Email**: Gmail API
- **UI**: Postman-inspired dark theme

## Setup

### 1. Install Dependencies

```bash
cd timesheet-app
npm install
```

### 2. Configure Environment

Copy the example file and update with your credentials:

```bash
# Copy example to .env
copy env.example.txt .env
```

Edit `.env` with your values:

```env
# Database (use a PostgreSQL database URL)
DATABASE_URL="postgresql://user:password@localhost:5432/timesheet_db?schema=public"

# Gemini AI (get from https://aistudio.google.com/app/apikey)
GEMINI_API_KEY="your-gemini-api-key"

# Google OAuth for Gmail (create at https://console.cloud.google.com)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"

# Gmail settings
GMAIL_USER_EMAIL="subbareddybana123@gmail.com"
```

### 3. Setup Database

```bash
# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Gmail OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the Gmail API
4. Create OAuth 2.0 credentials (Web application)
5. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI
6. Copy Client ID and Client Secret to your `.env` file
7. In the app, go to Settings and click "Connect Gmail"

## Sample Data

After seeding, you'll have:

- **3 Clients**: Bank of America, Wells Fargo, JPMorgan Chase
- **5 Employees**: John Doe, Jane Smith, Bob Wilson, Alice Brown, Charlie Davis
- **Rate Cards**: Each employee assigned to a client with bill/pay rates
- **Sample Timesheets**: Mix of pending, approved, rejected
- **Sample Invoices**: Various statuses (draft, sent, paid)
- **Sample Payroll**: Pending and processed records

## Usage

### Processing Timesheets

1. **Email Method**: Send timesheet PDF/image to configured Gmail
2. **Manual**: Click "Upload Timesheet" on the Timesheets page
3. Review pending timesheets and approve/reject

### Generating Invoices

Invoices are automatically generated when you approve a timesheet:
1. Go to Timesheets
2. Click the green checkmark to approve
3. Invoice and Payroll records are created automatically

### Processing Payroll

1. Go to Payroll page
2. Review pending payroll items
3. Click the play button to mark as processed

## API Endpoints

- `POST /api/timesheets/[id]/approve` - Approve timesheet
- `POST /api/timesheets/[id]/reject` - Reject timesheet
- `POST /api/invoices/[id]/send` - Mark invoice as sent
- `POST /api/invoices/[id]/mark-paid` - Mark invoice as paid
- `POST /api/payroll/[id]/process` - Process payroll
- `POST /api/email/check` - Check Gmail for new timesheets
- `GET /api/auth/gmail` - Start Gmail OAuth flow

## Project Structure

```
timesheet-app/
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts          # Seed data
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard
│   │   ├── employees/            # Employee management
│   │   ├── clients/              # Client management
│   │   ├── timesheets/           # Timesheet processing
│   │   ├── invoices/             # Invoice management
│   │   ├── payroll/              # Payroll management
│   │   ├── email-logs/           # Email monitoring
│   │   ├── settings/             # App settings
│   │   └── api/                  # API routes
│   ├── components/
│   │   └── Sidebar.tsx           # Navigation
│   └── lib/
│       ├── prisma.ts             # Prisma client
│       ├── gmail.ts              # Gmail integration
│       └── gemini.ts             # Gemini AI integration
└── env.example.txt               # Environment template
```

## License

MIT
