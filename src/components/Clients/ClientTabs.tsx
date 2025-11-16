import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AppBadge from '../ui/AppBadge';
import { assets, Calendar } from '../../assets';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';

type DocumentScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'DocumentEditor'
>;

const DocumentCard = ({ doc }: { doc: any }) => {
  const navigation = useNavigation<DocumentScreenNavigationProp>();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('DocumentEditor', { mode: 'edit' })}
      style={styles.card}
    >
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
    </TouchableOpacity>
  );
};

const TranscriptionCard = ({ item }: { item: any }) => {
  return (
    <View style={styles.transCard}>
      {/* Top Row */}
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

const ClientTabs = () => {
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

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'Transcriptions' ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {TRANS.map(item => (
              <TranscriptionCard key={item.id} item={item} />
            ))}
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {DOCS.map(doc => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default ClientTabs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    paddingTop: spacing(10),
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
  content: {
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(16),
    marginBottom: spacing(20),
  },

  /** Document Card **/
  card: {
    backgroundColor: theme.colors.secondary,
    borderRadius: fontSize(12),
    paddingVertical: spacing(14),
    paddingHorizontal: spacing(12),
    marginBottom: spacing(16),
    shadowColor: theme.colors.gray[400],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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

  /** Transcription Card **/
  transCard: {
    backgroundColor: theme.colors.white,
    borderRadius: fontSize(12),
    paddingVertical: spacing(16),
    paddingHorizontal: spacing(12),
    marginBottom: spacing(16),
    shadowColor: theme.colors.gray[400],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
  },
  transTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: spacing(16),
    maxWidth: '60%',
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
    alignItems: 'center',
    gap: spacing(10),
  },
  transDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing(10),
  },
  transDateText: {
    marginLeft: spacing(6),
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[600],
  },
});
