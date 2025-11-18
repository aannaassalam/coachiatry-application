import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { fontSize, scale, spacing } from '../../utils';
import { Image } from 'react-native';
import AppButton from '../../components/ui/AppButton';
import { Modal } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getClients } from '../../api/functions/coach.api';
import { User } from '../../typescript/interface/user.interface';
import { SmartAvatar } from '../../components/ui/SmartAvatar';

type ClientScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'ClientDetails'
>;
function MyClients() {
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation<ClientScreenNavigationProp>();

  const { data = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.userCard}
      onPress={() => {
        setSelectedClient(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.userInfo}>
        <SmartAvatar
          src={item.photo}
          size={scale(48)}
          name={item.fullName}
          fontSize={fontSize(22)}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {item.fullName}
          </Text>
          <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail">
            {item.email}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader heading="My Clients" showSearch />
      {/* <View style={{ paddingHorizontal: spacing(16) }}>
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
      </View> */}
      {/* <ScrollView showsVerticalScrollIndicator={false}> */}
      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{
            marginTop: spacing(6),
            paddingHorizontal: spacing(16),
            paddingVertical: spacing(4),
          }}
          data={data}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          // scrollEnabled={false}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: theme.colors.gray[200],
              }}
            />
          )}
        />
      )}
      {/* </ScrollView> */}

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
                <SmartAvatar
                  src={selectedClient.photo}
                  size={scale(86)}
                  style={{ marginVertical: spacing(12) }}
                  name={selectedClient.fullName}
                  fontSize={fontSize(36)}
                />
                <Text style={styles.modalName}>{selectedClient.fullName}</Text>
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
                      navigation.navigate('ClientDetails', {
                        userId: selectedClient._id,
                      });
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
