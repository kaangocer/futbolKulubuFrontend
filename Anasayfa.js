import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './styles';

export default function Anasayfa({ navigation }) {
  
  useEffect(() => {
    const checkLoginStatus = async () => {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        // Eğer token yoksa, login ekranına yönlendir
        navigation.replace('LoginPanel');
      }
    };

    checkLoginStatus();
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Yatay Scrollable Button Bar */}
      <View style={styles.buttonsGrid}>
        <TouchableOpacity
          style={[styles.gridButton, styles.aidatButton]}
          onPress={() => navigation.navigate('AidatListeleme')}
        >
          <Icon name="attach-money" size={28} color="#FFFFFF" />
          <Text style={styles.gridButtonText}>Aidat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.gridButton, styles.yoklamaButton]}
          onPress={() => navigation.navigate('Yoklama')}
        >
          <Icon name="check-circle" size={28} color="#FFFFFF" />
          <Text style={styles.gridButtonText}>Yoklama</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.gridButton, styles.formalarButton]}
          onPress={() => navigation.navigate('Formalar')}
        >
          <IconFontAwesome name="tshirt" size={28} color="#FFFFFF" />
          <Text style={styles.gridButtonText}>Formalar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.gridButton, styles.gruplarButton]}
          onPress={() => navigation.navigate('Gruplar')}
        >
          <Icon name="group" size={28} color="#FFFFFF" />
          <Text style={styles.gridButtonText}>Gruplar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.gridButton, styles.kullanicilarButton]}
          onPress={() => navigation.navigate('Uyeler')}
        >
          <Icon name="people" size={28} color="#FFFFFF" />
          <Text style={styles.gridButtonText}>Uyeler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
