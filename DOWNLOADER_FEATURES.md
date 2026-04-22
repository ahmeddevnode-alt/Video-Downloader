# YouTube & Instagram Video Downloader

Your Expo app has been transformed into a powerful video downloader supporting YouTube and Instagram!

## Features

### 🎥 YouTube Video Download
- Download videos in the best available quality
- See all available video qualities before downloading
- Automatic quality selection with file size information
- Video metadata display (title, duration, thumbnail)

### 🎵 YouTube Audio Download (MP3)
- Convert YouTube videos to MP3 audio format
- Perfect for extracting audio from music videos or podcasts
- Same quality information as video downloads

### 📸 Instagram Video Download
- Download videos and reels from Instagram
- Simple one-click download process
- Automatic format selection

## How to Use

### Download a Video

1. **Open the Downloader Tab** - Tap the downloader icon in the bottom navigation
2. **Paste URL** - Enter a YouTube or Instagram video URL
3. **Load Video Info** - Tap "Load Video Info" to fetch video details
4. **Select Format** (YouTube only):
   - Choose **MP4 Video** for video files
   - Choose **MP3 Audio** for audio extraction
5. **Select Quality** - Tap the quality button to see available options
6. **Download** - Press the download button to start

### Supported Platforms
- ✅ YouTube (youtube.com, youtu.be)
- ✅ Instagram (instagram.com)

## Technical Details

### API Integration
The app uses the **Cobalt API** for video downloading:
- No ads or watermarks
- Fast and reliable downloads
- Supports multiple quality options
- Automatic format conversion for MP3

### File Storage
- Downloaded files are saved to your device's document directory
- MP4 videos are saved with `.mp4` extension
- MP3 audio files are saved with `.mp3` extension
- Files are named based on the video title

### Permissions
The app requires:
- **Internet Access** - To download videos from the services
- **Storage Access** - To save downloaded files on your device
- **Network Access** - To communicate with download APIs

## Installation & Setup

```bash
# Install dependencies
npm install

# or
yarn install

# Start the app
npm start
```

### For Development

```bash
# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

## Project Structure

```
app/
  (tabs)/
    downloader.tsx          # Main downloader screen
    _layout.tsx            # Tab navigation with downloader
components/
  QualitySelector.tsx      # Quality selection modal
  DownloadProgress.tsx     # Download progress indicator
services/
  downloadService.ts       # Video download API service
```

## Features Breakdown

### 1. Video Information Loading
- Fetches video metadata (title, duration, thumbnail)
- Displays available quality options
- Shows estimated file sizes
- Platform detection (YouTube/Instagram)

### 2. Quality Selection
- Beautiful modal interface for quality selection
- File size information for each quality
- Format information (MP4, MP3, etc.)
- One-tap selection

### 3. Download Progress
- Real-time download progress indicator
- Percentage display
- Processing status
- Error handling with detailed messages
- Success confirmation

### 4. Format Support
- **MP4** - Full video with audio (YouTube)
- **MP3** - Audio only (YouTube)
- **MP4** - Video (Instagram)

## Troubleshooting

### "Invalid URL" Error
- Make sure you're using complete URLs (e.g., https://www.youtube.com/watch?v=...)
- Don't include extra parameters or shortened URLs
- For YouTube: use full video links, not playlists

### Download Fails
- Check your internet connection
- Verify the video URL is still valid
- Some videos may have download restrictions
- Try again after a few seconds

### No Qualities Available
- The video may have DRM protection
- Check if the URL is correct
- Try a different video

### Storage Issues
- Ensure your device has enough storage space
- Check file permissions in app settings
- Clear old downloads if storage is low

## Future Enhancements

Planned features:
- [ ] Playlist downloads
- [ ] Batch downloads
- [ ] Download history
- [ ] Download queue management
- [ ] Custom filename patterns
- [ ] Subtitle downloads
- [ ] Video trimming before download
- [ ] Background download support

## API Credits

This app uses the **Cobalt API** for video downloading - a fast, reliable, and privacy-focused video downloader.

## License

This project is provided as-is for educational and personal use.

---

**Enjoy downloading your favorite videos!** 🎬
