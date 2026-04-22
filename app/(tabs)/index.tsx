import { DownloadProgress } from '@/components/DownloadProgress';
import { QualitySelector } from '@/components/QualitySelector';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
    getInstagramVideoInfo,
    getPlatformFromUrl,
    getYouTubeAudioInfo,
    getYouTubeVideoInfo,
    VideoInfo,
    VideoQuality,
} from '@/services/downloadService';
import * as Clipboard from 'expo-clipboard';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Dimensions,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type Step = 'selection' | 'input' | 'result';
type DownloadMode = 'yt_video' | 'yt_audio' | 'ig_video';

// Sub-components
const ModeCard = ({ title, subtitle, icon, colors, onPress }: any) => {
  const colorScheme = useColorScheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.cardWrapper}>
      <LinearGradient colors={colors} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.card}>
        <View style={styles.cardIcon}>
          <MaterialCommunityIcons name={icon} size={32} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default function DownloaderScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  // State
  const [currentStep, setCurrentStep] = useState<Step>('selection');
  const [downloadMode, setDownloadMode] = useState<DownloadMode | null>(null);
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'mp3'>('mp4');
  const [showQualitySelector, setShowQualitySelector] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<'downloading' | 'processing' | 'completed' | 'error'>(
    'downloading'
  );
  const [downloadError, setDownloadError] = useState('');

  // Handle Clipboard
  const checkClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text && (text.includes('youtube.com') || text.includes('youtu.be') || text.includes('instagram.com'))) {
        setUrl(text);
      }
    } catch (e) {
      console.log('Clipboard access error', e);
    }
  };

  useEffect(() => {
    if (currentStep === 'input') {
      checkClipboard();
    }
  }, [currentStep]);

  const handleModeSelect = (mode: DownloadMode) => {
    setDownloadMode(mode);
    setSelectedFormat(mode === 'yt_audio' ? 'mp3' : 'mp4');
    setCurrentStep('input');
  };

  const handleBack = () => {
    if (currentStep === 'result') {
      setCurrentStep('input');
    } else if (currentStep === 'input') {
      setCurrentStep('selection');
      setUrl('');
      setVideoInfo(null);
    }
  };

  const handleFetchVideoInfo = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    setLoading(true);
    setVideoInfo(null);
    setSelectedQuality(null);

    try {
      let info: VideoInfo;

      if (downloadMode === 'yt_audio' || selectedFormat === 'mp3') {
        info = await getYouTubeAudioInfo(url);
      } else if (downloadMode === 'yt_video' || selectedFormat === 'mp4') {
        if (url.includes('instagram.com')) {
          info = await getInstagramVideoInfo(url);
        } else {
          info = await getYouTubeVideoInfo(url);
        }
      } else {
        info = await getInstagramVideoInfo(url);
      }

      setVideoInfo(info);
      if (info.qualities.length > 0) {
        setSelectedQuality(info.qualities[0]);
      }
      setCurrentStep('result');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch video information';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedQuality || !videoInfo) return;

    setShowProgress(true);
    setDownloadProgress(0);
    setDownloadStatus('downloading');

    try {
      let canSaveToGallery = false;
      try {
        const { status } = await MediaLibrary.getPermissionsAsync();
        canSaveToGallery = status === 'granted';
        
        if (!canSaveToGallery) {
          const permission = await MediaLibrary.requestPermissionsAsync();
          canSaveToGallery = permission.granted;
        }
      } catch (e) {
        console.log('Permission access failed (expected in Expo Go for some media types)', e);
      }
      
      const extension = selectedQuality.format;
      const fileName = `${videoInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${extension}`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      const downloadResumable = FileSystem.createDownloadResumable(
        selectedQuality.url,
        fileUri,
        {},
        (p) => {
          if (p.totalBytesExpectedToWrite > 0) {
            const progress = p.totalBytesWritten / p.totalBytesExpectedToWrite;
            setDownloadProgress(progress * 100);
          }
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (result) {
        setDownloadStatus('processing');
        let savedSuccessfully = false;

        if (canSaveToGallery) {
          try {
            const asset = await MediaLibrary.createAssetAsync(result.uri);
            await MediaLibrary.createAlbumAsync('VideoDownloader', asset, false);
            savedSuccessfully = true;
          } catch (e) {
            console.log('Gallery save failed', e);
          }
        }

        setDownloadStatus('completed');
        setTimeout(() => {
          setShowProgress(false);
          
          if (savedSuccessfully) {
            Alert.alert('Success!', 'Video saved to Gallery. Would you also like to save it to Files?', [
              { text: 'Done', style: 'cancel' },
              { text: 'Save to Files', onPress: () => Sharing.shareAsync(result.uri) }
            ]);
          } else {
            // Fallback for when gallery permissions are unavailable (common in Expo Go)
            Alert.alert(
              'Download Ready', 
              'The file is ready! Due to device permissions, please use "Save to Files" to keep it.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Save to Files', onPress: () => Sharing.shareAsync(result.uri) }
              ]
            );
          }
        }, 1000);
      }
    } catch (error) {
      setDownloadStatus('error');
      setDownloadError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const renderSelection = () => (
    <Animated.View entering={FadeIn.duration(400)} style={styles.selectionGrid}>
      <ModeCard 
        title="YouTube Video" 
        subtitle="Downloader in HD"
        icon="youtube"
        colors={['#FF4B2B', '#FF416C']}
        onPress={() => handleModeSelect('yt_video')}
      />
      <ModeCard 
        title="YouTube Audio" 
        subtitle="Extract MP3"
        icon="music"
        colors={['#F2994A', '#F2C94C']}
        onPress={() => handleModeSelect('yt_audio')}
      />
      <ModeCard 
        title="Instagram" 
        subtitle="Videos & Reels"
        icon="instagram"
        colors={['#833AB4', '#FD1D1D', '#F77737']}
        onPress={() => handleModeSelect('ig_video')}
      />
    </Animated.View>
  );

  const renderInput = () => (
    <Animated.View entering={FadeInDown.springify()} style={styles.inputContainer}>
      <View style={styles.inputHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.modeTitle, { color: theme.text }]}>
          {downloadMode === 'yt_video' ? 'YouTube Video' : 
           downloadMode === 'yt_audio' ? 'YouTube Audio' : 'Instagram Video'}
        </Text>
      </View>

      <View style={[styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
        <TextInput 
          style={[styles.mainInput, { color: theme.text }]}
          placeholder="Paste link here..."
          placeholderTextColor={theme.tabIconDefault}
          value={url}
          onChangeText={setUrl}
          autoFocus={true}
        />
        <TouchableOpacity style={styles.pasteButton} onPress={checkClipboard}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={theme.tint} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.primaryButton, { backgroundColor: theme.tint }]}
        onPress={handleFetchVideoInfo}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={isDark ? '#000' : '#fff'} />
        ) : (
          <>
            <Text style={[styles.primaryButtonText, { color: isDark ? '#000' : '#fff' }]}>Load Information</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? '#000' : '#fff'} />
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderResult = () => {
    if (!videoInfo) return null;
    return (
      <Animated.View entering={FadeIn.duration(500)} style={styles.resultContainer}>
        <TouchableOpacity onPress={handleBack} style={styles.backButtonResult}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.videoCardPremium}>
          <Image source={{ uri: videoInfo.thumbnail }} style={styles.mainThumbnail} />
          <View style={styles.premiumInfo}>
            <Text style={[styles.premiumTitle, { color: theme.text }]} numberOfLines={2}>
              {videoInfo.title}
            </Text>

            {videoInfo?.platform === 'youtube' && (
              <View style={styles.formatSection}>
                <Text style={[styles.label, { color: theme.text }]}>Download Format:</Text>
                <View style={styles.formatButtons}>
                  <TouchableOpacity
                    style={styles.formatButtonWrapper}
                    onPress={() => {
                      setSelectedFormat('mp4');
                    }}>
                    <LinearGradient
                      colors={selectedFormat === 'mp4' ? [theme.tint, theme.tint + 'CC'] : ['rgba(0,0,0,0)', 'rgba(0,0,0,0)']}
                      style={[
                        styles.formatButtonGradient,
                        selectedFormat !== 'mp4' && { borderColor: theme.tabIconDefault + '40', borderWidth: 1 }
                      ]}
                    >
                      <Text
                        style={[
                          styles.formatButtonText,
                          { color: selectedFormat === 'mp4' ? (isDark ? '#000' : '#fff') : theme.tabIconDefault },
                        ]}>
                        MP4 Video
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.formatButtonWrapper}
                    onPress={() => {
                      setSelectedFormat('mp3');
                    }}>
                    <LinearGradient
                      colors={selectedFormat === 'mp3' ? [theme.tint, theme.tint + 'CC'] : ['rgba(0,0,0,0)', 'rgba(0,0,0,0)']}
                      style={[
                        styles.formatButtonGradient,
                        selectedFormat !== 'mp3' && { borderColor: theme.tabIconDefault + '40', borderWidth: 1 }
                      ]}
                    >
                      <Text
                        style={[
                          styles.formatButtonText,
                          { color: selectedFormat === 'mp3' ? (isDark ? '#000' : '#fff') : theme.tabIconDefault },
                        ]}>
                        MP3 Audio
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: theme.tint + '20' }]}>
                <MaterialCommunityIcons name="play" size={12} color={theme.tint} />
                <Text style={[styles.badgeText, { color: theme.tint }]}>
                  {Math.floor(videoInfo.duration / 60)}:{Math.floor(videoInfo.duration % 60).toString().padStart(2, '0')}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#4CAF5020' }]}>
                <Text style={[styles.badgeText, { color: '#4CAF50' }]}>
                  {selectedQuality?.quality || 'Standard'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.qualitySelectButton, { borderColor: theme.tint }]}
            onPress={() => setShowQualitySelector(true)}
          >
            <Text style={[styles.qualitySelectText, { color: theme.text }]}>
              Resolution: {selectedQuality?.quality || 'Select'}
            </Text>
            <MaterialCommunityIcons name="cog" size={18} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.downloadButtonPremium, { backgroundColor: theme.tint }]}
            onPress={handleDownload}
          >
            <LinearGradient
              colors={isDark ? ['#ffffff', '#cccccc'] : [theme.tint, theme.tint + 'EE']}
              style={styles.gradientFill}
            >
              <MaterialCommunityIcons name="download" size={24} color={isDark ? '#000' : '#fff'} />
              <Text style={[styles.downloadTextPremium, { color: isDark ? '#000' : '#fff' }]}>
                Start Download
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.mainTitle, { color: theme.text }]}>Downloader</Text>
          <Text style={[styles.subTitle, { color: theme.tabIconDefault }]}>Fast & Private Video Extraction</Text>
        </View>

        {currentStep === 'selection' && renderSelection()}
        {currentStep === 'input' && renderInput()}
        {currentStep === 'result' && renderResult()}
      </ScrollView>

      {/* Modals */}
      {videoInfo && (
        <QualitySelector
          visible={showQualitySelector}
          qualities={videoInfo.qualities}
          onSelect={setSelectedQuality}
          onClose={() => setShowQualitySelector(false)}
        />
      )}

      <DownloadProgress
        visible={showProgress}
        progress={downloadProgress}
        fileName={videoInfo?.title || 'Video'}
        status={downloadStatus}
        errorMessage={downloadError}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  selectionGrid: {
    gap: 16,
  },
  cardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  inputContainer: {
    gap: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(128,128,128,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  glassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)',
  },
  mainInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  pasteButton: {
    padding: 8,
  },
  primaryButton: {
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  resultContainer: {
    gap: 24,
  },
  backButtonResult: {
    marginBottom: -8,
  },
  videoCardPremium: {
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(128,128,128,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)',
  },
  mainThumbnail: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  premiumInfo: {
    padding: 20,
    gap: 12,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  formatSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    opacity: 0.8,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formatButtonWrapper: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  formatButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  formatButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionsContainer: {
    gap: 16,
  },
  qualitySelectButton: {
    height: 56,
    borderRadius: 20,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  qualitySelectText: {
    fontSize: 15,
    fontWeight: '600',
  },
  downloadButtonPremium: {
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientFill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  downloadTextPremium: {
    fontSize: 18,
    fontWeight: '800',
  },
});
