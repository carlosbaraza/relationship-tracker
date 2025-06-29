# Elector - Relationship Tracker MVP

A simple relationship tracker app to log interactions with friends. Track when you last contacted someone, organized by groups.

## Features

### ✅ Implemented (MVP)
- **Contact Management**: Add contacts with names and optional groups
- **Interaction Tracking**: Quick-add interactions with timestamps
- **Time Display**: Smart time formatting (3h, 2d, 1w 3d, 2m 1w, 1y 3m)
- **Contact List**: Ordered by last interaction (oldest first)
- **Contact Details**: Calendar view and chronological list of interactions
- **Local Storage**: All data stored locally in browser
- **Dark Mode**: System preference with manual toggle
- **Responsive Design**: Mobile-first with desktop optimization

### 🚧 Planned (Future)
- Authentication system (magic link)
- PostgreSQL database integration
- Data migration from local to cloud
- Server Actions for data operations
- Multi-user support

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL (prepared), Local Storage (current)
- **ORM**: Prisma
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Containerization**: Docker & Docker Compose

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Development

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Docker Development

1. **Start with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

2. **View logs**:
   ```bash
   docker-compose logs -f app
   ```

3. **Stop services**:
   ```bash
   docker-compose down
   ```

## Usage

### Adding Contacts
1. Click "Add Contact" button
2. Enter name (required) and group (optional)
3. Groups help organize contacts (e.g., "Family", "Friends", "Work")

### Tracking Interactions
- **Quick Add**: Click the "+" button on any contact row
- **Detailed Add**: Visit contact detail page for date/note options
- **Edit/Delete**: Manage interactions from contact detail page

### Viewing Data
- **Main List**: Contacts ordered by last interaction (oldest first)
- **Contact Details**: Calendar view + chronological interaction list
- **Groups**: Contacts automatically grouped with subtle dividers

### Time Format
- Less than 24h: `3h`
- Less than 7 days: `3d`
- Less than 1 month: `2w 3d`
- Less than 1 year: `3m 2w`
- 1 year or more: `1y 3m`

## Data Storage

### Current (Local Storage)
- All data stored in browser's localStorage
- Data persists between sessions
- No cloud sync or backup

### Future (PostgreSQL)
- User authentication required
- Data synced to cloud database
- Local storage cleared on logout
- Migration tool for existing local data

## Development

### Project Structure
```
src/
├── app/
│   ├── (app)/                # Main app pages
│   │   ├── layout.tsx       # App layout with header
│   │   ├── page.tsx         # Contact list page
│   │   └── contacts/[id]/   # Contact detail pages
│   ├── globals.css          # Global styles & design system
│   └── layout.tsx           # Root layout
├── components/
│   ├── ContactList.tsx      # Main contact list with groups
│   ├── ContactRow.tsx       # Individual contact row
│   ├── InteractionCalendar.tsx # Calendar view component
│   └── ThemeToggle.tsx      # Dark mode toggle
├── lib/
│   ├── types.ts            # TypeScript interfaces
│   ├── time.ts             # Time formatting utilities
│   └── storage.ts          # Local storage CRUD operations
└── prisma/
    └── schema.prisma       # Database schema (future)
```

### Key Files
- `src/lib/storage.ts`: All local storage operations
- `src/lib/time.ts`: Time formatting logic
- `src/components/ContactList.tsx`: Main contact display logic
- `src/app/(app)/contacts/[id]/page.tsx`: Contact detail view

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client (future)
npm run db:push      # Push schema to database (future)
npm run db:studio    # Open Prisma Studio (future)
```

## Design System

### Colors
- **Light**: White background, black text
- **Dark**: Black background, white text
- **Borders**: Subtle gray borders with good contrast

### Typography
- **Font**: System font stack for native feel
- **Spacing**: 8px grid system
- **Hierarchy**: Clear text size and weight hierarchy

### Components
- **Buttons**: Black/white with hover states
- **Forms**: Clean inputs with focus states
- **Cards**: Subtle borders and shadows
- **Icons**: Lucide React for consistency

## Environment Variables

Create a `.env.local` file (for future database integration):

```env
# Database
DATABASE_URL="postgresql://elector_user:elector_password@localhost:5432/elector"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-change-in-production"

# Email (for magic link authentication)
EMAIL_SERVER="smtp://username:password@smtp.gmail.com:587"
EMAIL_FROM="noreply@yourapp.com"
```

## Deployment

### Docker Production
```bash
# Build and run
docker-compose -f docker-compose.prod.yml up -d

# With custom environment
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### Vercel/Netlify
Standard Next.js deployment works out of the box for the current local storage version.

## Contributing

1. Follow the existing code style
2. Ensure all features work in both light and dark mode
3. Test responsive design on mobile and desktop
4. Update documentation for any new features

## License

MIT License - feel free to use this project as a starting point for your own relationship tracker.

## Roadmap

### Phase 1: ✅ Local Storage MVP
- Basic contact and interaction management
- Time tracking and display
- Responsive UI with dark mode

### Phase 2: 🚧 Authentication & Cloud
- Magic link authentication
- PostgreSQL integration
- Data migration tools

### Phase 3: 🔄 Advanced Features
- Contact import/export
- Interaction reminders
- Analytics and insights
- Mobile app (React Native)
