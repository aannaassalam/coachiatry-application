import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { assets, Calendar } from '../../assets';

import AppHeader from '../../components/ui/AppHeader';

import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { fontSize, spacing } from '../../utils';
import { Image } from 'react-native';
import AppButton from '../../components/ui/AppButton';
import { Modal } from 'react-native';
type ClientScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'ClientDetails'
>;
function MyClients() {
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation<ClientScreenNavigationProp>();

  const users = [
    {
      id: '1',
      name: 'Wade Warren',
      email: 'georgia.young@example.com',
      age: 24,
      gender: 'Male',
      avatar: { uri: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      id: '2',
      name: 'Jane Cooper',
      email: 'willie.jennings@example.com',
      age: 21,
      gender: 'Male',
      avatar: { uri: 'https://randomuser.me/api/portraits/women/44.jpg' },
    },
    {
      id: '3',
      name: 'Guy Hawkins',
      email: 'kenzi.lawson@example.com',
      age: 34,
      gender: 'Male',
      avatar: { uri: 'https://randomuser.me/api/portraits/men/85.jpg' },
    },
    {
      id: '4',
      name: 'Jacob Jones',
      email: 'georgia.young@example.com',
      age: 48,
      gender: 'Female',
      avatar: { uri: 'https://randomuser.me/api/portraits/women/48.jpg' },
    },
    {
      id: '5',
      name: 'Jacob Jones',
      email: 'alma.lawson@example.com',
      age: 50,
      gender: 'Male',
      avatar: { uri: 'https://randomuser.me/api/portraits/men/48.jpg' },
    },
    {
      id: '6',
      name: 'Savannah Nguyen',
      email: 'alma.lawson@example.com',
      age: 23,
      gender: 'Male',
      avatar: { uri: 'https://randomuser.me/api/portraits/men/9.jpg' },
    },
    {
      id: '7',
      name: 'Wade Warren',
      email: 'georgia.young@example.com',
      age: 24,
      gender: 'Male',
      avatar: { uri: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      id: '8',
      name: 'Jane Cooper',
      email: 'willie.jennings@example.com',
      age: 21,
      gender: 'Male',
      avatar: { uri: 'https://randomuser.me/api/portraits/women/44.jpg' },
    },
    {
      id: '9',
      name: 'Guy Hawkins',
      email: 'kenzi.lawson@example.com',
      age: 34,
      gender: 'Male',
      avatar: { uri: 'https://randomuser.me/api/portraits/men/85.jpg' },
    },
  ];
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.userCard}
      onPress={() => {
        setSelectedClient(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.userInfo}>
        <Image source={item.avatar} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
          <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail">
            {item.email}
          </Text>
        </View>
      </View>

      <View style={styles.rightInfo}>
        <Text style={styles.age}>{item.age}</Text>
        <Text style={styles.gender}>{item.gender}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader
        heading="All Clients"
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        onSettingsPress={() => console.log('Settings pressed')}
      />
      <View style={{ paddingHorizontal: spacing(16) }}>
        <View style={styles.buttonContainer}>
          <Pressable style={styles.filterIcon} onPress={() => {}}>
            <Image source={assets.icons.filter} style={styles.sortIcon} />
          </Pressable>
          <Pressable style={styles.filterIcon} onPress={() => {}}>
            <Image source={assets.icons.sort} style={styles.sortIcon} />
          </Pressable>
          <AppButton
            text="Add a New Client"
            onPress={() => {}}
            variant="secondary-outline"
            style={{
              padding: spacing(8),
              borderRadius: fontSize(6),
              marginLeft: 'auto',
            }}
            textStyle={{ fontSize: fontSize(14) }}
          />
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          marginTop: spacing(6),
          paddingHorizontal: spacing(16),
        }}
      >
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: theme.colors.gray[200],
                marginLeft: spacing(56),
              }}
            />
          )}
          contentContainerStyle={{ paddingVertical: spacing(4) }}
        />
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedClient && (
              <>
                <Image
                  source={selectedClient.avatar}
                  style={styles.modalAvatar}
                />
                <Text style={styles.modalName}>{selectedClient.name}</Text>
                <Text style={styles.modalEmail}>{selectedClient.email}</Text>

                <View style={styles.buttonRow}>
                  <AppButton
                    text="Cancel"
                    onPress={() => setModalVisible(false)}
                    variant="outline"
                    style={{ flex: 1 }}
                  />
                  <AppButton
                    text="View Profile"
                    onPress={() => {
                      setModalVisible(false);
                      navigation.navigate('ClientDetails');
                    }}
                    style={{ flex: 1 }}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default MyClients;

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    flex: 1,
    position: 'relative',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing(12),
    alignItems: 'center',
    marginTop: spacing(6),
    paddingBottom: spacing(6),
  },
  filterIcon: {
    padding: spacing(7),
    borderRadius: 100,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.colors.gray[200],
  },
  sortIcon: {
    width: 20,
    height: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(14),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
    flex: 1,
  },
  avatar: {
    width: fontSize(48),
    height: fontSize(48),
    borderRadius: fontSize(40),
  },
  name: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.regular,
    color: theme.colors.gray[900],
  },
  email: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[500],
    marginTop: spacing(6),
  },
  rightInfo: {
    alignItems: 'flex-end',
    gap: spacing(6),
    width: fontSize(60),
  },
  age: {
    fontSize: fontSize(13),
    fontFamily: theme.fonts.archivo.regular,
    color: theme.colors.gray[900],
  },
  gender: {
    fontSize: fontSize(13),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[600],
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000060',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: fontSize(16),
    padding: spacing(20),
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalAvatar: {
    width: fontSize(86),
    height: fontSize(86),
    borderRadius: fontSize(40),
    marginVertical: spacing(12),
  },
  modalName: {
    fontSize: fontSize(20),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[950],
    marginBottom: spacing(6),
    marginTop: spacing(10),
  },
  modalEmail: {
    fontSize: fontSize(16),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[600],
    marginBottom: spacing(18),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing(10),
    width: '100%',
    marginTop: spacing(6),
  },
});
