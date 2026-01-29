import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Animated from 'react-native-reanimated';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AppBadge from '../ui/AppBadge';
import { assets, Calendar } from '../../assets';

const AnimatedScrollView = Animated.createAnimatedComponent(
  Animated.ScrollView,
);

const DocumentCard = ({ doc }: { doc: any }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{doc.title}</Text>
        <Ionicons
          name="ellipsis-horizontal"
          size={fontSize(18)}
          color={theme.colors.gray[700]}
        />
      </View>

      <View style={styles.cardFooter}>
        <AppBadge bgColor={doc.tagBg} dotColor={doc.tagColor} text={doc.tag} />
        <View style={styles.dateRow}>
          <Calendar />
          <Text style={styles.dateText}>{doc.date}</Text>
        </View>
      </View>
    </View>
  );
};

const TranscriptionCard = ({ item }: { item: any }) => {
  return (
    <View style={styles.transCard}>
      <View style={styles.transTopRow}>
        <View style={styles.transLeft}>
          <Image source={item.avatar} style={styles.transAvatar} />
          <View>
            <Text style={styles.transTitle}>{item.title}</Text>
            <View style={styles.transDateRow}>
              <Calendar />
              <Text style={styles.transDateText}>{item.date}</Text>
            </View>
          </View>
        </View>

        <View style={styles.transIcons}>
          <Ionicons
            name="document-text-outline"
            size={fontSize(18)}
            color={theme.colors.gray[600]}
          />
          <Ionicons
            name="trash-outline"
            size={fontSize(18)}
            color={theme.colors.gray[600]}
          />
        </View>
      </View>
    </View>
  );
};

const ClientTabs = ({ onScroll }: { onScroll: any }) => {
  const [activeTab, setActiveTab] = useState<'Transcriptions' | 'Documents'>(
    'Transcriptions',
  );

  const DOCS = [
    {
      id: '1',
      title: 'Mental Health Assessment – [04 Dec, 2024]',
      tag: 'Goals',
      tagColor: '#F4A118',
      tagBg: '#FFF0D8',
      date: '05-06-2025',
    },
    {
      id: '2',
      title: 'Medical History Summary – Uploaded (January 2025)',
      tag: 'Contract',
      tagColor: '#F16A24',
      tagBg: '#F16A241F',
      date: '05-06-2025',
    },
    {
      id: '3',
      title: 'Therapy Session Notes – Dr. R.K. Mehta (30 June 2025)',
      tag: 'Weekly',
      tagColor: '#52A86E',
      tagBg: '#E8F6ED',
      date: '05-06-2025',
    },
  ];

  const TRANS = [
    {
      id: '1',
      avatar: assets.images.Avatar3,
      title: 'Any mechanical keyboard enthusiasts in design?',
      date: 'Dec 12, 2022',
    },
    {
      id: '2',
      avatar: assets.images.Avatar2,
      title: 'Just uploaded my notes from today’s session.',
      date: 'Feb 10, 2023',
    },
    {
      id: '3',
      avatar: assets.images.Avatar3,
      title: 'Any mechanical keyboard enthusiasts in design?',
      date: 'Dec 12, 2022',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Tabs Header */}
      <View style={styles.tabHeader}>
        {['Transcriptions', 'Documents'].map(tab => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() =>
                setActiveTab(tab as 'Transcriptions' | 'Documents')
              }
              style={styles.tab}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab}
              </Text>
              {isActive && <View style={styles.activeUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Scrollable Tab Content */}
      {activeTab === 'Transcriptions' ? (
        <AnimatedScrollView
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ padding: spacing(16), paddingBottom: 200 }}
        >
          {TRANS.map(item => (
            <TranscriptionCard key={item.id} item={item} />
          ))}
        </AnimatedScrollView>
      ) : (
        <AnimatedScrollView
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ padding: spacing(16), paddingBottom: 200 }}
        >
          {DOCS.map(doc => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </AnimatedScrollView>
      )}
    </View>
  );
};

export default ClientTabs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing(14),
    position: 'relative',
  },
  activeUnderline: {
    position: 'absolute',
    bottom: -1,
    height: 2.5,
    width: '90%',
    backgroundColor: theme.colors.gray[950],
    borderRadius: 4,
  },
  tabText: {
    fontSize: fontSize(15),
    color: theme.colors.gray[600],
    fontFamily: theme.fonts.archivo.medium,
  },
  tabTextActive: {
    color: theme.colors.gray[950],
  },

  /** Document Card */
  card: {
    backgroundColor: theme.colors.secondary,
    borderRadius: fontSize(12),
    paddingVertical: spacing(14),
    paddingHorizontal: spacing(12),
    marginBottom: spacing(16),
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing(16),
  },

  cardTitle: {
    flex: 1,
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(14),
    color: theme.colors.black,
    paddingRight: spacing(8),
  },

  cardFooter: {
    flexDirection: 'row',
    gap: spacing(16),
    alignItems: 'center',
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dateText: {
    marginLeft: spacing(6),
    fontSize: fontSize(12),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[800],
  },

  /** Transcription Card */
  transCard: {
    backgroundColor: theme.colors.white,
    borderRadius: fontSize(12),
    paddingVertical: spacing(16),
    paddingHorizontal: spacing(12),
    marginBottom: spacing(16),
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
  },
  transTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: spacing(16),
    maxWidth: '70%',
  },
  transAvatar: {
    width: fontSize(40),
    height: fontSize(40),
    borderRadius: fontSize(16),
  },
  transTitle: {
    flex: 1,
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(14),
    color: theme.colors.black,
  },
  transIcons: {
    flexDirection: 'row',
    gap: spacing(10),
  },
  transDateRow: {
    flexDirection: 'row',
    marginTop: spacing(10),
  },
  transDateText: {
    marginLeft: spacing(6),
    fontSize: fontSize(14),
    color: theme.colors.gray[600],
  },
});
