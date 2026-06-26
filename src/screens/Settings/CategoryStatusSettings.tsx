import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';
import { SheetManager } from 'react-native-actions-sheet';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';
import { getAllCategories } from '../../api/functions/category.api';
import { getAllStatuses } from '../../api/functions/status.api';
import { ChevronLeft } from '../../assets';
import TouchableButton from '../../components/TouchableButton';
import AppTabs from '../../components/ui/AppTabs';
import Badge from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';
import { Category } from '../../typescript/interface/category.interface';
import { Status } from '../../typescript/interface/status.interface';
import { fontSize, spacing } from '../../utils';

type Taxonomy = Category | Status;
type TaxonomyType = 'category' | 'status';

function TaxonomyList({ type }: { type: TaxonomyType }) {
  const { styles } = useStyles(stylesheet);
  const { profile } = useAuth();
  const isCategory = type === 'category';
  const noun = isCategory ? 'category' : 'status';

  const { data = [], isLoading } = useQuery<Taxonomy[]>({
    queryKey: isCategory ? ['categories'] : ['status'],
    queryFn: ({ signal }) =>
      isCategory ? getAllCategories(signal) : getAllStatuses(signal),
  });

  const isOwned = (item: Taxonomy) =>
    !item.public && !!item.user && item.user === profile?._id;

  const handleDelete = (item: Taxonomy) => {
    const options = data
      .filter(other => other._id !== item._id)
      .map(other => ({
        value: other._id,
        label: other.title,
        bg: other.color.bg,
        text: other.color.text,
      }));

    SheetManager.show('delete-taxonomy-sheet', {
      payload: {
        type,
        item: { _id: item._id, title: item.title },
        options,
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.list}>
        {[0, 1, 2, 3, 4].map(i => (
          <View key={i} style={styles.row}>
            <Skeleton width={spacing(110)} height={fontSize(26)} borderRadius={100} />
            <Skeleton width={fontSize(20)} height={fontSize(20)} borderRadius={6} />
          </View>
        ))}
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No {noun} found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
    >
      {data.map(item => {
        const owned = isOwned(item);
        return (
          <View key={item._id} style={styles.row}>
            <Badge
              title={item.title}
              bgColor={item.color.bg}
              color={item.color.text}
            />
            {owned ? (
              <TouchableButton
                style={styles.deleteButton}
                hitSlop={spacing(10)}
                onPress={() => handleDelete(item)}
              >
                <Feather name="trash-2" size={fontSize(15)} color="#DC2626" />
              </TouchableButton>
            ) : (
              <View style={styles.defaultPill}>
                <Text style={styles.defaultPillText}>Default</Text>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const TabContent = ({ activeTab }: { activeTab: string }) => (
  <TaxonomyList type={activeTab === 'statuses' ? 'status' : 'category'} />
);

export default function CategoryStatusSettings() {
  const navigation = useNavigation();
  const { styles } = useStyles(stylesheet);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableButton
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft />
        </TouchableButton>
        <Text style={styles.headerTitle}>Categories & Statuses</Text>
        <View style={{ width: spacing(24) }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.subtitle}>
          Manage the categories and statuses used across your tasks. You can
          delete the ones you’ve created and transfer their tasks elsewhere.
        </Text>
        <AppTabs
          tabs={[
            { key: 'categories', label: 'Categories' },
            { key: 'statuses', label: 'Statuses' },
          ]}
          RenderContent={TabContent}
        />
      </View>
    </View>
  );
}

const stylesheet = createStyleSheet({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
  },
  iconButton: {
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(3),
  },
  headerTitle: {
    fontSize: fontSize(18),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.gray[950],
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing(16),
    paddingTop: spacing(8),
  },
  subtitle: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[600],
    lineHeight: fontSize(19),
    marginBottom: spacing(16),
  },
  list: {
    gap: spacing(10),
    paddingBottom: spacing(24),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(14),
    backgroundColor: theme.colors.secondary,
    borderRadius: fontSize(12),
  },
  deleteButton: {
    width: spacing(28),
    height: spacing(28),
    borderRadius: spacing(14),
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultPill: {
    paddingHorizontal: spacing(10),
    paddingVertical: spacing(4),
    borderRadius: 100,
    backgroundColor: theme.colors.gray[100],
  },
  defaultPillText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(11),
    color: theme.colors.gray[500],
  },
  empty: {
    paddingVertical: spacing(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: theme.fonts.lato.italic,
    fontSize: fontSize(13),
    color: theme.colors.gray[500],
  },
});
