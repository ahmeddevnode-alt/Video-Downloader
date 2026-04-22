import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { VideoQuality } from '@/services/downloadService';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, Pressable, Dimensions } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

const { height } = Dimensions.get('window');

interface QualitySelectorProps {
  visible: boolean;
  qualities: VideoQuality[];
  onSelect: (quality: VideoQuality) => void;
  onClose: () => void;
}

export const QualitySelector: React.FC<QualitySelectorProps> = ({
  visible,
  qualities,
  onSelect,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        
        <Animated.View 
          entering={SlideInDown.springify().damping(15)} 
          style={[styles.sheet, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}
        >
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>Download Quality</Text>
              <Text style={[styles.subtitle, { color: theme.tabIconDefault }]}>Select your preferred resolution</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {qualities.map((quality, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                style={[
                  styles.qualityItem, 
                  { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                ]}
                onPress={() => {
                  onSelect(quality);
                  onClose();
                }}
              >
                <View style={[styles.iconBox, { backgroundColor: theme.tint + '15' }]}>
                  <MaterialCommunityIcons name="shield-check" size={20} color={theme.tint} />
                </View>
                
                <View style={styles.itemInfo}>
                  <Text style={[styles.qualityName, { color: theme.text }]}>
                    {quality.quality}
                  </Text>
                  <Text style={[styles.qualityDetails, { color: theme.tabIconDefault }]}>
                    {quality.format.toUpperCase()} • {formatFileSize(quality.filesize)}
                  </Text>
                </View>
                <View style={styles.selectIndicator}>
                   <MaterialCommunityIcons name="check" size={18} color="rgba(128,128,128,0.3)" />
                </View>
              </TouchableOpacity>
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: height * 0.7,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(128,128,128,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    marginBottom: 20,
  },
  qualityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  qualityName: {
    fontSize: 16,
    fontWeight: '700',
  },
  qualityDetails: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  selectIndicator: {
    paddingLeft: 12,
  }
});
