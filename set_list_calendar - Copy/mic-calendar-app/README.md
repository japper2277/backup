# Mic Calendar - Post-Set Intelligence MVP

The smartest notebook a comedian has ever owned. Built around the 60 seconds after a comedian steps off stage.

## 🚀 Features

### Core Post-Set Intelligence
- **Brain Dump Interface**: Simple text input that intelligently parses venue, tags, and performance details
- **Smart Parsing**: Automatically extracts hashtags, venue names, and performance goals
- **Quick Capture**: Log your set in under 60 seconds with intelligent suggestions

### Modern Architecture
- **Vue.js 3**: Component-based architecture with Composition API
- **Supabase Backend**: Real PostgreSQL database with authentication and real-time features
- **Responsive Design**: Mobile-first approach for on-the-go logging

### Data Management
- **Set History**: Track all your performances with intelligent categorization
- **Joke Library**: Build and organize your joke collection
- **Performance Analytics**: Track your progress and venue performance

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
cd mic-calendar-app
npm install
```

### 2. Set Up Supabase

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

#### Set Environment Variables
Create a `.env.local` file in the project root:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Set Up Database
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL to create your database schema

### 3. Update Supabase Configuration
Edit `src/services/supabase.js` and replace the placeholder values:
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
```

### 4. Run the Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
mic-calendar-app/
├── src/
│   ├── components/
│   │   └── SetLogModal.vue          # Core Post-Set Intelligence modal
│   ├── views/
│   │   ├── CalendarView.vue         # Main calendar and set history
│   │   ├── JokeLibrary.vue          # Joke management
│   │   └── Stats.vue                # Performance analytics
│   ├── services/
│   │   └── supabase.js              # Database operations
│   ├── App.vue                      # Main app component
│   └── main.js                      # App entry point
├── supabase-schema.sql              # Database schema
└── package.json
```

## 🎯 How It Works

### The Post-Set Workflow
1. **Step Off Stage**: Comedian finishes their set
2. **Open App**: Click "Log Set" button
3. **Brain Dump**: Type raw thoughts about the performance
4. **Smart Parsing**: App automatically extracts:
   - Venue name from text patterns
   - Tags from hashtags (#newmaterial, #audition)
   - Performance date
5. **Save**: One-click save with intelligent categorization

### Intelligent Parsing Examples
```
Input: "Venue was The Cellar. Crowd hot. New airplane joke worked but tag needs work. #newmaterial #audition"

Parsed:
- Venue: The Cellar
- Tags: newmaterial, audition
- Performance Date: Today
```

## 🔧 Customization

### Adding New Parsing Rules
Edit the `parseBrainDump` function in `SetLogModal.vue`:

```javascript
function parseBrainDump() {
  // Add new venue patterns
  const venuePatterns = [
    /the\s+(\w+)/i,
    /at\s+(\w+)/i,
    /(\w+)\s+comedy/i,
    /(\w+)\s+club/i,
    /(\w+)\s+bar/i,
    // Add your custom patterns here
    /(\w+)\s+theater/i
  ]
  
  // Add new tag patterns
  const customTagPatterns = [
    /#(\w+)/g,           // Hashtags
    /@(\w+)/g,           // Mentions
    /\$(\w+)/g           // Custom symbols
  ]
}
```

### Styling
The app uses CSS custom properties for easy theming. Edit the CSS variables in `App.vue`:

```css
:root {
  --primary-color: #3b82f6;
  --secondary-color: #10b981;
  --background-color: #f8fafc;
  --text-color: #1e293b;
}
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel/Netlify
1. Push your code to GitHub
2. Connect your repository to Vercel or Netlify
3. Set environment variables in your deployment platform
4. Deploy!

## 🔮 Future Enhancements

### Phase 2: Advanced Intelligence
- **AI-Powered Insights**: Analyze performance patterns and suggest improvements
- **Crowd Analysis**: Track audience reactions and demographics
- **Joke Performance**: Track which jokes work best at which venues

### Phase 3: Collaboration
- **Comedian Network**: Share insights with other comedians
- **Venue Reviews**: Rate and review comedy venues
- **Booking Integration**: Connect with venue booking systems

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the existing issues
2. Create a new issue with detailed description
3. Include steps to reproduce and expected behavior

---

**Built with ❤️ for comedians who want to get smarter about their craft.**
