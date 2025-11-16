import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { fontSize, spacing } from '../../utils';
import Search from '../Search';
import TouchableButton from '../TouchableButton';

interface AppHeaderProps {
  heading: string;
  showSearch?: boolean;
}
type HeaderScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'Profile'
>;
const AppHeader: React.FC<AppHeaderProps> = ({
  heading,
  showSearch = false,
}) => {
  const navigation = useNavigation<HeaderScreenNavigationProp>();
  return (
    <View style={styles.container}>
      {/* Top Row */}
      <View style={styles.topRow}>
        <View />
        <Text style={styles.heading}>{heading}</Text>
        <TouchableButton onPress={() => navigation.navigate('Profile')}>
          <Ionicons
            name="settings-outline"
            size={fontSize(20)}
            color={theme.colors.gray[800]}
          />
        </TouchableButton>
      </View>

      {/* Search Bar */}
      {showSearch && <Search />}
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
});
