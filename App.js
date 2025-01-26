import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Anasayfa from './Anasayfa'; 
import Gruplar from './Gruplar'; 
import Formalar from './Formalar';
import AidatListeleme from './AidatListeleme';
import Yoklama from './Yoklama';
import LoginPanel from './LoginPanel'; 
import Uyeler from './Uyeler';
import RegisterPanel from './RegisterPanel';

const Stack = createStackNavigator(); 

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('userToken');
      setUserToken(token);
      if (token) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, []);

  const handleLogout = async (navigation) => {
    try {
      await AsyncStorage.removeItem('userToken');  
      setIsLoggedIn(false);  
      setUserToken(null);
      navigation.navigate('LoginPanel');  // Logout sonrası LoginPanel'e yönlendir
    } catch (error) {
      console.error('Çıkış yaparken hata:', error);
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isLoggedIn ? "Anasayfa" : "LoginPanel"}>
        <Stack.Screen 
          name="LoginPanel" 
          component={LoginPanel}
          options={{ headerShown: false }} 
        />
        
        <Stack.Screen 
          name="Anasayfa" 
          component={Anasayfa} 
          options={({ navigation }) => ({
            title: 'Anasayfa',
            headerRight: () => (
              <TouchableOpacity onPress={() => handleLogout(navigation)} style={styles.logoutButton}>
                <Text style={styles.logoutText}>Çıkış</Text>
              </TouchableOpacity>
            ),
          })}
        />
        
        <Stack.Screen 
          name="Gruplar" 
          component={Gruplar} 
          options={({ navigation }) => ({
            title: 'Gruplar',
            headerRight: () => (
              <TouchableOpacity onPress={() => handleLogout(navigation)} style={styles.logoutButton}>
                <Text style={styles.logoutText}>Çıkış</Text>
              </TouchableOpacity>
            ),
          })}
        />
        
        <Stack.Screen 
          name="AidatListeleme" 
          component={AidatListeleme} 
          options={({ navigation }) => ({
            title: 'Aidat Listeleme',
            headerRight: () => (
              <TouchableOpacity onPress={() => handleLogout(navigation)} style={styles.logoutButton}>
                <Text style={styles.logoutText}>Çıkış</Text>
              </TouchableOpacity>
            ),
          })}
        />
        
        <Stack.Screen 
          name="Formalar" 
          component={Formalar} 
          options={({ navigation }) => ({
            title: 'Formalar',
            headerRight: () => (
              <TouchableOpacity onPress={() => handleLogout(navigation)} style={styles.logoutButton}>
                <Text style={styles.logoutText}>Çıkış</Text>
              </TouchableOpacity>
            ),
          })}
        />
        
        <Stack.Screen 
          name="Yoklama" 
          component={Yoklama} 
          options={({ navigation }) => ({
            title: 'Yoklama',
            headerRight: () => (
              <TouchableOpacity onPress={() => handleLogout(navigation)} style={styles.logoutButton}>
                <Text style={styles.logoutText}>Çıkış</Text>
              </TouchableOpacity>
            ),
          })}
        />
        
        <Stack.Screen 
          name="Uyeler" 
          component={Uyeler} 
          options={{ title: 'Uyeler' }} 
        />
        
        <Stack.Screen 
          name="Register" 
          component={RegisterPanel}
          options={{ 
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    marginRight: 10,
    padding: 10,
    backgroundColor: '#FF0000',
    borderRadius: 5,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
