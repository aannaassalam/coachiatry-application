import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AvatarListSkeleton from '../../components/skeletons/AvatarListSkeleton';

import AppHeader from '../../components/ui/AppHeader';

import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { fontSize, scale, spacing } from '../../utils';
import { FLOATING_BAR_FOOTPRINT } from '../../components/Chat/FloatingChatHost';
import AppButton from '../../components/ui/AppButton';
import { Modal } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SheetManager } from 'react-native-actions-sheet';
import { getClients } from '../../api/functions/coach.api';
import { User } from '../../typescript/interface/user.interface';
import { SmartAvatar } from '../../components/ui/SmartAvatar';
import { useAuth } from '../../hooks/useAuth';
import Ionicons from 'react-native-vector-icons/Ionicons';

type ClientScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'ClientDetails'
>;
function MyClients() {
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation<ClientScreenNavigationProp>();
  const { profile } = useAuth();
  const isCoach = profile?.role === 'coach';

  const { data = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: ({ signal }) => getClients(signal),
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
      {/* <ScrollView showsVerticalScrollIndicator={false}> */}
      {isLoading ? (
        <AvatarListSkeleton />
      ) : (
        <FlatList
          contentContainerStyle={{
            marginTop: spacing(6),
            paddingHorizontal: spacing(16),
            paddingVertical: spacing(4),
            paddingBottom: FLOATING_BAR_FOOTPRINT,
          }}
          data={data}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          refreshing={isFetching}
          onRefresh={refetch}
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

      {isCoach && (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.addBtn}
          onPress={() => SheetManager.show('create-client-sheet')}
        >
          <Ionicons name="add" size={25} color={theme.colors.white} />
        </TouchableOpacity>
      )}
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
  addBtn: {
    position: 'absolute',
    bottom: spacing(-15) + FLOATING_BAR_FOOTPRINT,
    right: spacing(16),
    padding: spacing(10),
    backgroundColor: theme.colors.primary,
    borderRadius: 100,
    // Lift the FAB above content on Android/iOS.
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
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
