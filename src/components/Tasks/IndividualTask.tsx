import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import { SmartAvatar } from '../ui/SmartAvatar';
import { fontSize, scale, spacing } from '../../utils';
import { theme } from '../../theme';
import StatusBox from './StatusBox';
import Badge from '../ui/Badge';
import Priority from '../ui/Priority';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';

type TaskScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'TaskDetails'
>;

export default function IndividualTask() {
  const navigation = useNavigation<TaskScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <View style={styles.cell}>
        <Pressable style={styles.caretButton}>
          <FontAwesome5
            name={'caret-right'}
            size={fontSize(16)}
            color={theme.colors.black}
          />
        </Pressable>
        <StatusBox />
        <Pressable onPress={() => navigation.navigate('TaskDetails')}>
          <Text
            style={[styles.cellText, { width: scale(280) }]}
            numberOfLines={1}
          >
            A very very very very long text for reference
          </Text>
        </Pressable>
      </View>
      <View style={[styles.cell, { justifyContent: 'center' }]}>
        <SmartAvatar
          src="https://coachiatry.s3.us-east-1.amazonaws.com/Logo+Mark+(1).png"
          name="Coachiatry"
          size={spacing(20)}
          fontSize={fontSize(10)}
        />
        <Text style={styles.cellText}>John Nick</Text>
      </View>
      <View style={[styles.cell, { justifyContent: 'center' }]}>
        <Text style={styles.cellText}>13-11-2025</Text>
      </View>
      <View style={[styles.cell, { justifyContent: 'center' }]}>
        <Badge title="Health" bgColor="#FFF0D8" color="#F4A118" />
      </View>
      <View
        style={[styles.cell, { borderRightWidth: 0, justifyContent: 'center' }]}
      >
        <Priority priority="high" />
      </View>
    </View>
  );
}

const styles = createStyleSheet({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  caretButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cell: {
    minWidth: spacing(120),
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing(10),
    borderRightWidth: 1,
    gap: spacing(8),
    borderRightColor: theme.colors.gray[200],
  },
  statusOutsideBox: backgroundColor => ({
    width: 14,
    height: 14,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor,
  }),
  statusInsideBox: {
    width: 12,
    height: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: theme.colors.white,
  },
  cellText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(14),
    color: '#333',
  },
});
