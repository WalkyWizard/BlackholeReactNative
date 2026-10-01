import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Contacts from 'expo-contacts/legacy';

interface ContactItem {
  id: string;
  name: string;
  phoneNumber: string;
}

export default function App() {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Открыть камеру
  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Нет доступа к камере');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      try {
        const { status: libStatus } = await MediaLibrary.requestPermissionsAsync(true);
        if (libStatus === 'granted') {
          await MediaLibrary.saveToLibraryAsync(result.assets[0].uri);
          Alert.alert('Успех', 'Фото сохранено в галерею устройства');
        } else {
          Alert.alert('Внимание', 'Нет разрешения на сохранение фото в галерею');
        }
      } catch (e: any) {
        Alert.alert('Ошибка сохранения', e?.message || 'Не удалось сохранить фото');
      }
    }
  };

  // 2. Открыть галерею
  const openGallery = async () => {
    await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
    });
  };

  // 3. Загрузить контакты (expo-contacts)
  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const { status } = await Contacts.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нет доступа к контактам устройства');
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      if (data && data.length > 0) {
        const formatted: ContactItem[] = data.map((item, index) => {
          const fullName =
            item.name ||
            `${item.firstName || ''} ${item.lastName || ''}`.trim() ||
            'Без имени';
          const phone = item.phoneNumbers?.[0]?.number || 'Номер не указан';
          return {
            id: item.id || String(index),
            name: fullName,
            phoneNumber: phone,
          };
        });

        formatted.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        setContacts(formatted);
      } else {
        setContacts([]);
        Alert.alert('Контакты', 'Контактов не найдено');
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error?.message || 'Не удалось загрузить контакты');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Кнопки управления */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={openCamera}
          activeOpacity={0.8}>
          <Text style={styles.buttonText}>Открыть камеру</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={openGallery}
          activeOpacity={0.8}>
          <Text style={styles.buttonText}>Открыть галлерею</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={loadContacts}
          disabled={isLoading}
          activeOpacity={0.8}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Контакты</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Простой листбокс снизу без заголовков и счетчиков */}
      <View style={styles.listBox}>
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Text style={styles.itemText}>
              {item.phoneNumber} — {item.name}
            </Text>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 16,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#1E1E1E',
    width: '100%',
    maxWidth: 320,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#0A0A0A',
    borderRadius: 4,
  },
  itemText: {
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
});
