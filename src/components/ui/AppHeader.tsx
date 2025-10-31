import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';
import { CoachAi, HeaderSearchIcon } from '../../assets';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';

interface AppHeaderProps {
  heading: string;
  showSearch?: boolean;
  onSettingsPress?: () => void;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
}
type HeaderScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'Profile'
>;
const AppHeader: React.FC<AppHeaderProps> = ({
  heading,
  showSearch = false,
  onSettingsPress,
  searchValue,
  onSearchChange,
}) => {
  const navigation = useNavigation<HeaderScreenNavigationProp>();
  return (
    <View style={styles.container}>
      {/* Top Row */}
      <View style={styles.topRow}>
        <View />
        <Text style={styles.heading}>{heading}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Ionicons
            name="settings-outline"
            size={fontSize(20)}
            color={theme.colors.gray[800]}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <HeaderSearchIcon />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor={theme.colors.gray[400]}
              value={searchValue}
              onChangeText={onSearchChange}
            />
          </View>
          <TouchableOpacity activeOpacity={0.8}>
            <CoachAi />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default AppHeader;

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: spacing(16),
    paddingTop: spacing(10),
    paddingBottom: spacing(12),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(16),
  },
  heading: {
    fontSize: fontSize(18),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[950],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: fontSize(36),
    backgroundColor: theme.colors.white,
    borderRadius: fontSize(10),
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    paddingHorizontal: spacing(12),
    // paddingVertical: spacing(6),
    shadowColor: theme.colors.gray[500],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize(14),
    marginLeft: spacing(8),
    color: theme.colors.gray[800],
    fontFamily: theme.fonts.lato.regular,
  },
});
