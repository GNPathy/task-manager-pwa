# Task Manager PWA

A Progressive Web App for managing tasks with calendar integration.

## Features

- 📝 Add tasks with due dates and times
- ⏱️ Set task duration
- 📅 Export tasks to calendar (.ics format)
- 📱 Works offline (after first load)
- 📲 Installable on mobile devices

## How to Deploy to GitHub Pages

1. Create a new repository on GitHub named `task-manager-pwa`
2. Initialize git in your project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
3. Connect to GitHub and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/task-manager-pwa.git
   git branch -M main
   git push -u origin main
   ```
4. Enable GitHub Pages:
   - Go to your repository on GitHub
   - Click "Settings" > "Pages"
   - Under "Source", select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click "Save"

Your PWA will be available at:  
`https://YOUR_USERNAME.github.io/task-manager-pwa`

## Development

To run locally:

1. Install Python (if not already installed)
2. Run the development server:
   ```bash
   python server.py
   ```
3. Open `http://localhost:8000` in your browser

## Browser Support

- Chrome (recommended)
- Firefox
- Edge
- Safari (with some PWA limitations)

## License

MIT
