import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View, Dimensions, Platform } from 'react-native';
import Animated, { FadeIn, SlideInUp, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface DownloadProgressProps {
  visible: boolean;
  progress: number; // 0-100
  fileName: string;
  status: 'downloading' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

export const DownloadProgress: React.FC<DownloadProgressProps> = ({
  visible,
  progress,
  fileName,
  status,
  errorMessage,
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    setDisplayProgress(progress);
  }, [progress]);

  const getStatusContent = () => {
    switch (status) {
      case 'downloading':
        return {
          text: 'Downloading Video...',
          icon: <MaterialCommunityIcons name="download" size={32} color={theme.tint} />,
          subtext: `${Math.round(displayProgress)}% completed`
        };
      case 'processing':
        return {
          text: 'Optimizing File...',
          icon: <ActivityIndicator color={theme.tint} size="large" />, 
          subtext: 'Finalizing your download'
        };
      case 'completed':
        return {
          text: 'Ready to Watch!',
          icon: <MaterialCommunityIcons name="check-circle" size={32} color="#4CAF50" />,
          subtext: 'Saved to your Gallery'
        };
      case 'error':
        return {
          text: 'Oops! Something went wrong',
          icon: <MaterialCommunityIcons name="alert-circle" size={32} color="#FF5252" />,
          subtext: errorMessage || 'Please try again'
        };
    }
  };

  const content = getStatusContent();

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${withSpring(displayProgress, { damping: 20 })}%`,
    };
  });

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        
        <Animated.View entering={FadeIn.duration(400)} style={styles.wrapper}>
          <View style={[styles.card, { backgroundColor: isDark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)' }]}>
            <View style={[styles.iconContainer, { backgroundColor: theme.tint + '10' }]}>
              {status === 'processing' ? (
                <ActivityIndicator color={theme.tint} size="large" />
              ) : (
                content.icon
              )}
            </View>

            <Text style={[styles.statusTitle, { color: theme.text }]}>{content.text}</Text>
            <Text style={[styles.fileName, { color: theme.tabIconDefault }]} numberOfLines={1}>
              {fileName}
            </Text>

            {(status === 'downloading' || status === 'processing') && (
              <View style={styles.progressSection}>
                <View style={[styles.track, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                  <Animated.View style={[styles.fill, { backgroundColor: theme.tint }, progressStyle]} />
                </View>
                <Text style={[styles.percentageText, { color: theme.tabIconDefault }]}>
                  {content.subtext}
                </Text>
              </View>
            )}

            {status === 'completed' && (
              <Text style={[styles.successSubtext, { color: '#4CAF50' }]}>{content.subtext}</Text>
            )}

            {status === 'error' && (
              <Text style={[styles.errorSubtext, { color: '#FF5252' }]}>{content.subtext}</Text>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  wrapper: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
  },
  track: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '600',
  },
  successSubtext: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
