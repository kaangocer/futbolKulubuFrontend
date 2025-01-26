import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { setToken } from './authorization'; // authorization.js dosyasındaki setToken fonksiyonunu import ediyoruz
import RegisterPanel from './RegisterPanel';

export default function LoginPanel({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Yükleme durumu için

  const validateForm = () => {
    if (!email || !password) {
      setError('E-posta ve şifre alanları boş bırakılamaz!');
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Geçerli bir e-posta adresi giriniz!');
      return false;
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır!');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    setError('');
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await axios.post('http://192.168.1.21:3000/login', {
        Email: email.trim(),
        Password: password,
      });

      if (response.data.token) {
        await setToken(response.data.token);
        navigation.replace('Anasayfa');
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || 'Giriş yapılırken bir hata oluştu!';
      setError(errorMessage);
      Alert.alert('Hata', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await axios.post('http://192.168.1.21:3000/kullanicilar', {
        Email: email.trim(),
        Password: password,
        RolId: 1
      });

      if (response.data) {
        Alert.alert(
          'Başarılı',
          'Kayıt işleminiz başarıyla tamamlandı. Giriş yapabilirsiniz.',
          [{ text: 'Tamam' }]
        );
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      console.error('Register error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Kayıt olurken bir hata oluştu!');
      Alert.alert('Hata', error.response?.data?.message || 'Kayıt olurken bir hata oluştu!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Giriş Yap</Text>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <TextInput
          style={styles.input}
          placeholder="E-posta"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerButtonText}>Kayıt Ol</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14,
  },
  registerButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  registerButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
