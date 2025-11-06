import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Calendar } from '../../assets';
import AppBadge from '../../components/ui/AppBadge';
import AppHeader from '../../components/ui/AppHeader';
import AppTabs from '../../components/ui/AppTabs';
import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { fontSize, spacing } from '../../utils';
import { useQuery } from '@tanstack/react-query';
import { getAllDocuments } from '../../api/functions/document.api';

type DocumentScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'DocumentEditor'
>;

export default function Documents() {
  const [search, setSearch] = useState('');
  const navigation = useNavigation<DocumentScreenNavigationProp>();
  const TABS = [
    { key: 'all', label: 'All' },
    { key: 'my-docs', label: 'My Docs' },
    { key: 'shared', label: 'Shared' },
  ];

  const DOCS = {
    all: [
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
      {
        id: '4',
        title: 'Medical History Summary – Uploaded (January 2025)',
        tag: 'Contract',
        tagColor: '#F16A24',
        tagBg: '#F16A241F',
        date: '05-06-2025',
      },
      {
        id: '5',
        title: 'Therapy Session Notes – Dr. R.K. Mehta (30 June 2025)',
        tag: 'Weekly',
        tagColor: '#52A86E',
        tagBg: '#E8F6ED',
        date: '05-06-2025',
      },
    ],
    myDocs: [],
    shared: [],
    archived: [],
  };

  const renderContent = (activeTab: string) => {
    const key = activeTab as keyof typeof DOCS;
    const docs = DOCS[key] || [];

    const {
      data = { data: [] },
      isLoading,
      isFetching,
    } = useQuery({
      queryKey: ['documents', activeTab],
      queryFn: () => getAllDocuments({ tab: activeTab }),
    });

    if (docs.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No documents found.</Text>
        </View>
      );
    }

    return docs.map(doc => (
      <TouchableOpacity
        activeOpacity={0.8}
        key={doc.id}
        onPress={() => navigation.navigate('DocumentEditor', { mode: 'view' })}
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
          <AppBadge
            bgColor={doc.tagBg}
            dotColor={doc.tagColor}
            text={doc.tag}
          />

          <View style={styles.dateRow}>
            <Calendar />
            <Text style={styles.dateText}>{doc.date}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.container}>
      <AppHeader
        heading="Documents"
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        onSettingsPress={() => console.log('Settings pressed')}
      />
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing(16),
          marginTop: spacing(6),
        }}
      >
        <AppTabs tabs={TABS} renderContent={renderContent} />
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.addBtn}
        onPress={() => navigation.navigate('DocumentEditor', { mode: 'add' })}
      >
        <Ionicons name="add" size={25} color={theme.colors.white} />
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    flex: 1,
    position: 'relative',
  },
  card: {
    backgroundColor: theme.colors.secondary,
    borderRadius: fontSize(12),
    paddingVertical: spacing(14),
    paddingHorizontal: spacing(12),
    marginBottom: spacing(16),
    shadowColor: theme.colors.gray[400],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    // shadowRadius: 3,
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
  emptyContainer: {
    marginTop: spacing(30),
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.gray[500],
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
  },
  addBtn: {
    position: 'absolute',
    bottom: spacing(14),
    right: spacing(14),
    padding: spacing(6),
    backgroundColor: theme.colors.primary,
    borderRadius: 100,
  },
});
